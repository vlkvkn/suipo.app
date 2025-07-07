import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { WalletWithRequiredFeatures, getWallets } from '@mysten/wallet-standard';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import { useStore } from 'zustand';

import { createWalletStore } from './walletStore';
import { setSalt } from '../api/zklogin';
import { BASE_URL, SUI_NETWORK, GOOGLE_OAUTH_URL, GOOGLE_CLIENT_ID } from '../config';

const WalletContext = createContext<ReturnType<typeof createWalletStore> | null>(null);
const SuiClientContext = createContext<SuiClient | null>(null);

interface WalletProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

// Default storage and key
const DEFAULT_STORAGE = typeof window !== 'undefined' && window.localStorage ? localStorage : {
  getItem: () => null,
  setItem: () => { },
  removeItem: () => { }
};
const DEFAULT_STORAGE_KEY = 'sui-wallet:connection-info';

export function WalletProvider({
  children,
  autoConnect = true
}: WalletProviderProps) {
  const [, setClientOnly] = useState(false);

  // Create a single SuiClient instance
  const suiClient = useMemo(() => {
    const client = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK),
      network: SUI_NETWORK
    });
    console.log('SuiClient created once:', client);
    return client;
  }, []);

  // Create wallet store
  const walletStore = useMemo(() => {
    const wallets = getWallets().get().filter(wallet =>
      wallet.features['standard:connect'] &&
      wallet.features['sui:signTransactionBlock']
    ) as WalletWithRequiredFeatures[];

    return createWalletStore({
      wallets,
      storage: DEFAULT_STORAGE as Storage,
      storageKey: DEFAULT_STORAGE_KEY,
      autoConnectEnabled: autoConnect
    });
  }, []);

  // Set client only after mount to prevent SSR issues
  useLayoutEffect(() => {
    setClientOnly(true);
  }, []);

  // Listen for wallet registry changes
  useEffect(() => {
    const handleWalletRegistryChange = () => {
      const wallets = getWallets().get().filter(wallet =>
        wallet.features['standard:connect'] &&
        wallet.features['sui:signTransactionBlock']
      ) as WalletWithRequiredFeatures[];
      walletStore.getState().setWalletRegistered(wallets);
    };

    const unsubscribe = getWallets().on('register', handleWalletRegistryChange);
    return () => unsubscribe();
  }, []);

  // Set up wallet event listeners
  useEffect(() => {
    const currentWallet = walletStore.getState().currentWallet;
    if (!currentWallet) return;

    const handleWalletEvent = (event: any) => {
      console.log('Wallet event:', event);

      if (event.name === 'disconnect') {
        walletStore.getState().setWalletDisconnected();
      }

      if (event.name === 'accountChange') {
        walletStore.getState().updateWalletAccounts(event.data || []);
      }
    };

    if (currentWallet.features['standard:events']) {
      currentWallet.features['standard:events'].on('change', handleWalletEvent);
    }

    return () => {
      if (currentWallet.features['standard:events']) {
        console.log('Cleaning up wallet event listeners');
      }
    };
  }, []);

  // Automatic wallet reconnection if data is present in localStorage
  useEffect(() => {
    const state = walletStore.getState();
    if (
      state.lastConnectedWalletName &&
      state.lastConnectedAccountAddress &&
      state.connectionStatus !== 'connected'
    ) {
      const wallet = state.wallets.find(
        w => (w.id ?? w.name) === state.lastConnectedWalletName
      );
      if (wallet) {
        // Try to reconnect to the wallet automatically
        wallet.features['standard:connect'].connect().then(connectResult => {
          const connectedSuiAccounts = connectResult.accounts.filter(
            (account) => account.chains.some((chain) => chain.split(':')[0] === 'sui')
          );
          const selectedAccount = connectedSuiAccounts.find(
            acc => acc.address === state.lastConnectedAccountAddress
          ) || connectedSuiAccounts[0];
          walletStore.getState().setWalletConnected(
            wallet,
            connectedSuiAccounts,
            selectedAccount,
            []
          );
        }).catch(() => {
          walletStore.getState().setConnectionStatus('disconnected');
        });
      }
    }
  }, [walletStore]);



  return (
    <SuiClientContext.Provider value={suiClient}>
      <WalletContext.Provider value={walletStore}>
        {children}
      </WalletContext.Provider>
    </SuiClientContext.Provider>
  );
}

export function useWallet() {
  const store = useContext(WalletContext);
  if (!store) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  const account = useStore(store, (state) => state.currentAccount);
  const wallet = useStore(store, (state) => state.currentWallet);
  const connecting = useStore(store, (state) => state.connectionStatus === 'connecting');
  const connected = useStore(store, (state) => state.connectionStatus === 'connected');

  const connect = async (selectedWallet?: WalletWithRequiredFeatures) => {
    store.getState().setConnectionStatus('connecting');

    try {
      let walletToConnect: WalletWithRequiredFeatures;

      if (selectedWallet) {
        walletToConnect = selectedWallet;
      } else {
        const wallets = store.getState().wallets;
        if (wallets.length === 0) {
          throw new Error('No wallets found. Please install a Sui wallet extension.');
        }
        if (wallets.length > 1) {
          throw new Error('Multiple wallets found. Please select a specific wallet to connect.');
        }
        walletToConnect = wallets[0];
      }

      const connectResult = await walletToConnect.features['standard:connect'].connect();

      const connectedSuiAccounts = connectResult.accounts.filter(
        (account) => account.chains.some((chain) => chain.split(':')[0] === 'sui')
      );

      if (connectedSuiAccounts.length === 0) {
        throw new Error('No Sui accounts found in the connected wallet.');
      }

      const selectedAccount = connectedSuiAccounts[0];

      store.getState().setWalletConnected(
        walletToConnect,
        connectedSuiAccounts,
        selectedAccount,
        []
      );

      console.log('Successfully connected to wallet:', walletToConnect.name);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      store.getState().setConnectionStatus('disconnected');
      throw error;
    }
  };

  const disconnect = () => {
    store.getState().setWalletDisconnected();
  };

  return {
    account,
    wallet,
    connecting,
    connected,
    connect,
    disconnect
  };
}

export function useCurrentWallet() {
  const { wallet, account } = useWallet();
  return { wallet, account };
}

export function useSuiClient() {
  const suiClient = useContext(SuiClientContext);
  if (!suiClient) {
    throw new Error('useSuiClient must be used within a WalletProvider');
  }
  return suiClient;
}

export function useZkLogin() {

  const store = useContext(WalletContext);
  if (!store) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  const userAddress = useStore(store, (state) => state.zk_userAddress);
  const isAuthenticated = useStore(store, (state) => state.zk_isAuthenticated);
  const ephemeralKeyPair = useStore(store, (state) => state.zk_ephemeralKeyPair);
  const jwt = useStore(store, (state) => state.zk_jwt);
  const maxEpoch = useStore(store, (state) => state.zk_maxEpoch);
  const randomness = useStore(store, (state) => state.zk_randomness);
  const isLoading = useStore(store, (state) => state.zk_isLoading);

  let locpathname = useLocation().pathname;  
  if (locpathname === "/" || locpathname === "/#") {
    locpathname = "/poaps"
  }
  const redirectUrl = BASE_URL + locpathname + window.location.search.toString(); //TODO redo using state

  const suiClient = useSuiClient();

  const logout = useCallback(() => {

    store.setState(prev => ({
      ...prev,
      zk_isAuthenticated: false,
      zk_isLoading: false,
      zk_error: null,
      zk_userAddress: null,
      zk_jwt: null,
      zk_maxEpoch: 0,
      zk_randomness: "",
      zk_ephemeralKeyPair: undefined,
    }));

  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlFragment = window.location.hash.substring(1);
      const fragmentParams = new URLSearchParams(urlFragment);
      const idToken = fragmentParams.get('id_token');

      if (idToken) {
        try {
          store.setState(prev => ({ ...prev, zklogin_isLoading: true, zklogin_error: null }));
          const saltResponse = await setSalt(idToken);

          const zk_randomness = store.getState().zk_randomness;
          const zk_maxEpoch = store.getState().zk_maxEpoch;
          const zk_ephemeralKeyPair = store.getState().zk_ephemeralKeyPair;

          store.setState(prev => ({
            ...prev,
            zk_ephemeralKeyPair: zk_ephemeralKeyPair,
            zk_maxEpoch: zk_maxEpoch,
            zk_randomness: zk_randomness,
            zk_isAuthenticated: true,
            zk_userAddress: saltResponse.userAddress,
            zk_jwt: idToken,
            zk_isLoading: false
          }));
          window.location.hash = '';
        } catch (error) {
          console.error('Failed to handle OAuth callback (implicit flow):', error);
          store.setState(prev => ({
            ...prev,
            zk_error: 'Failed to complete authentication (implicit flow)',
            zk_isLoading: false,
          }));
        }
        return;
      }
    };
    handleOAuthCallback();
  }, []);

  // Generate new zkLohin
  const login = useCallback(async () => {
    try {

      const { epoch } = await suiClient.getLatestSuiSystemState();

      const ephemeralKeyPair = new Ed25519Keypair();

      const zk_lokalstorage = {
        randomness: generateRandomness(),
        maxEpoch: Number(epoch) + 2,
        secretkey: ephemeralKeyPair.getSecretKey(),
      }

      localStorage.setItem("zk_storage", JSON.stringify(zk_lokalstorage));

      store.setState(prev => ({
        ...prev,
        zk_randomness: zk_lokalstorage.randomness,
        zk_maxEpoch: zk_lokalstorage.maxEpoch,
        zk_ephemeralKeyPair: ephemeralKeyPair,
      }));

      const oauthUrl = buildGoogleOAuthUrl(redirectUrl,store);
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to build OAuth URL:', error);
      store.setState(prev => ({
        ...prev,
        zk_error: error instanceof Error ? error.message : 'Failed to start OAuth flow',
      }));
    }
  }, []);

  return {
    userAddress,
    isAuthenticated,
    isLoading,
    ephemeralKeyPair,
    jwt,
    maxEpoch,
    randomness,
    login,
    logout,
  };
}

// Generate a random state parameter for OAuth security
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function buildGoogleOAuthUrl(redirectUrl:string,WalletContext: ReturnType<typeof createWalletStore>): string {

  const { zk_randomness, zk_maxEpoch, zk_ephemeralKeyPair } = WalletContext.getState();

  // Generate state parameter for security
  const state = generateState();

  let nonce = generateNonce((zk_ephemeralKeyPair as Ed25519Keypair).getPublicKey(), zk_maxEpoch, zk_randomness as string);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUrl,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: nonce,
    state: state, // Add state parameter for security
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}