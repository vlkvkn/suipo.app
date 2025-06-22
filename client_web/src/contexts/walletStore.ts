import { createStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { WalletAccount, WalletWithRequiredFeatures } from '@mysten/wallet-standard';

type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface WalletState {
  // State
  autoConnectEnabled: boolean;
  wallets: WalletWithRequiredFeatures[];
  accounts: readonly WalletAccount[];
  currentWallet: WalletWithRequiredFeatures | null;
  currentAccount: WalletAccount | null;
  lastConnectedAccountAddress: string | null;
  lastConnectedWalletName: string | null;
  connectionStatus: WalletConnectionStatus;
  supportedIntents: string[];

  // Actions
  setConnectionStatus: (connectionStatus: WalletConnectionStatus) => void;
  setWalletConnected: (
    wallet: WalletWithRequiredFeatures, 
    connectedAccounts: readonly WalletAccount[], 
    selectedAccount: WalletAccount | null, 
    supportedIntents?: string[]
  ) => void;
  setWalletDisconnected: () => void;
  setAccountSwitched: (selectedAccount: WalletAccount) => void;
  setWalletRegistered: (updatedWallets: WalletWithRequiredFeatures[]) => void;
  setWalletUnregistered: (updatedWallets: WalletWithRequiredFeatures[], unregisteredWallet: WalletWithRequiredFeatures) => void;
  updateWalletAccounts: (accounts: readonly WalletAccount[]) => void;
}

function getWalletUniqueIdentifier(wallet: WalletWithRequiredFeatures): string {
  return wallet?.id ?? wallet?.name;
}

export function createWalletStore({
  wallets,
  storage,
  storageKey,
  autoConnectEnabled
}: {
  wallets: WalletWithRequiredFeatures[];
  storage: Storage;
  storageKey: string;
  autoConnectEnabled: boolean;
}) {
  return createStore<WalletState>()(
    persist(
      (set, get) => ({
        autoConnectEnabled,
        wallets,
        accounts: [],
        currentWallet: null,
        currentAccount: null,
        lastConnectedAccountAddress: null,
        lastConnectedWalletName: null,
        connectionStatus: 'disconnected',
        supportedIntents: [],

        setConnectionStatus(connectionStatus) {
          set(() => ({
            connectionStatus
          }));
        },

        setWalletConnected(wallet, connectedAccounts, selectedAccount, supportedIntents = []) {
          set(() => ({
            accounts: connectedAccounts,
            currentWallet: wallet,
            currentAccount: selectedAccount,
            lastConnectedWalletName: getWalletUniqueIdentifier(wallet),
            lastConnectedAccountAddress: selectedAccount?.address ?? null,
            connectionStatus: 'connected',
            supportedIntents
          }));
        },

        setWalletDisconnected() {
          set(() => ({
            accounts: [],
            currentWallet: null,
            currentAccount: null,
            lastConnectedWalletName: null,
            lastConnectedAccountAddress: null,
            connectionStatus: 'disconnected',
            supportedIntents: []
          }));
        },

        setAccountSwitched(selectedAccount) {
          set(() => ({
            currentAccount: selectedAccount,
            lastConnectedAccountAddress: selectedAccount.address
          }));
        },

        setWalletRegistered(updatedWallets) {
          set(() => ({ wallets: updatedWallets }));
        },

        setWalletUnregistered(updatedWallets, unregisteredWallet) {
          if (unregisteredWallet === get().currentWallet) {
            set(() => ({
              wallets: updatedWallets,
              accounts: [],
              currentWallet: null,
              currentAccount: null,
              lastConnectedWalletName: null,
              lastConnectedAccountAddress: null,
              connectionStatus: 'disconnected',
              supportedIntents: []
            }));
          } else {
            set(() => ({ wallets: updatedWallets }));
          }
        },

        updateWalletAccounts(accounts) {
          const currentAccount = get().currentAccount;
          set(() => ({
            accounts,
            currentAccount: currentAccount && accounts.find(({ address }) => address === currentAccount.address) || accounts[0]
          }));
        }
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => storage),
        partialize: ({ lastConnectedWalletName, lastConnectedAccountAddress }) => ({
          lastConnectedWalletName,
          lastConnectedAccountAddress
        })
      }
    )
  );
} 