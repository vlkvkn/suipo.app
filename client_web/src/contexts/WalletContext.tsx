import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useLayoutEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { WalletAccount, WalletWithRequiredFeatures, getWallets } from '@mysten/wallet-standard';
import { getFullnodeUrl } from '@mysten/sui/client';
import { useStore } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { createWalletStore } from './walletStore';
import { SUI_NETWORK } from '../config';

interface WalletContextType {
  client: SuiClient;
  account: WalletAccount | null;
  wallet: WalletWithRequiredFeatures | null;
  connecting: boolean;
  connected: boolean;
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  connect: (selectedWallet?: WalletWithRequiredFeatures) => Promise<void>;
  disconnect: () => void;
  selectAccount: (account: WalletAccount) => void;
  setNetwork: (network: 'mainnet' | 'testnet' | 'devnet' | 'localnet') => void;
}

const WalletContext = createContext<ReturnType<typeof createWalletStore> | null>(null);

interface WalletProviderProps {
  children: ReactNode;
  defaultNetwork?: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  autoConnect?: boolean;
}

// Default storage and key
const DEFAULT_STORAGE = typeof window !== 'undefined' && window.localStorage ? localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
const DEFAULT_STORAGE_KEY = 'sui-wallet:connection-info';

export function WalletProvider({ 
  children, 
  defaultNetwork = SUI_NETWORK,
  autoConnect = true 
}: WalletProviderProps) {
  const [network, setNetwork] = useState(defaultNetwork);
  const [clientOnly, setClientOnly] = useState(false);

  // Create client with useMemo to prevent unnecessary recreations
  const client = useMemo(() => new SuiClient({ url: getFullnodeUrl(network) }), [network]);

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

  // Auto-connect logic using React Query
  const { data: autoConnectStatus } = useQuery({
    queryKey: [
      'wallet-autoconnect',
      {
        autoConnect,
        lastConnectedWalletName: walletStore.getState().lastConnectedWalletName,
        lastConnectedAccountAddress: walletStore.getState().lastConnectedAccountAddress,
        isConnected: walletStore.getState().connectionStatus === 'connected',
        walletCount: walletStore.getState().wallets.length
      }
    ],
    queryFn: async () => {
      if (!autoConnect) {
        return 'disabled';
      }

      const state = walletStore.getState();
      if (!state.lastConnectedWalletName || !state.lastConnectedAccountAddress || state.connectionStatus === 'connected') {
        return 'attempted';
      }

      const wallet = state.wallets.find(
        (w) => (w.id ?? w.name) === state.lastConnectedWalletName
      );

      if (wallet) {
        try {
          walletStore.getState().setConnectionStatus('connecting');
          const connectResult = await wallet.features['standard:connect'].connect();
          
          const connectedSuiAccounts = connectResult.accounts.filter(
            (account) => account.chains.some((chain) => chain.split(':')[0] === 'sui')
          );

          const selectedAccount = connectedSuiAccounts.find(
            (account) => account.address === state.lastConnectedAccountAddress
          ) || connectedSuiAccounts[0];

          if (selectedAccount) {
            walletStore.getState().setWalletConnected(
              wallet,
              connectedSuiAccounts,
              selectedAccount,
              []
            );
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          walletStore.getState().setConnectionStatus('disconnected');
        }
      }

      return 'attempted';
    },
    enabled: autoConnect && clientOnly,
    retry: false,
    staleTime: 0,
    gcTime: 0
  });

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

  const connect = async (selectedWallet?: WalletWithRequiredFeatures) => {
    walletStore.getState().setConnectionStatus('connecting');
    
    try {
      let walletToConnect: WalletWithRequiredFeatures;

      if (selectedWallet) {
        walletToConnect = selectedWallet;
      } else {
        const wallets = walletStore.getState().wallets;
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
      
      walletStore.getState().setWalletConnected(
        walletToConnect,
        connectedSuiAccounts,
        selectedAccount,
        []
      );

      console.log('Successfully connected to wallet:', walletToConnect.name);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      walletStore.getState().setConnectionStatus('disconnected');
      throw error;
    }
  };

  const disconnect = () => {
    console.log('Disconnecting wallet');
    walletStore.getState().setWalletDisconnected();
  };

  const selectAccount = (selectedAccount: WalletAccount) => {
    walletStore.getState().setAccountSwitched(selectedAccount);
  };

  return (
    <WalletContext.Provider value={walletStore}>
      {children}
    </WalletContext.Provider>
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
    console.log('Disconnecting wallet');
    store.getState().setWalletDisconnected();
  };

  return {
    account,
    wallet,
    connecting,
    connected,
    network: 'testnet' as const,
    connect,
    disconnect
  };
}

export function useCurrentAccount() {
  const { account } = useWallet();
  return account;
}

export function useCurrentWallet() {
  const { wallet } = useWallet();
  return wallet;
}

export function useSuiClient() {
  // Create a stable client instance using useMemo
  return useMemo(() => new SuiClient({ url: getFullnodeUrl('testnet') }), []);
}

export function useNetwork() {
  return { network: 'testnet' as const };
} 