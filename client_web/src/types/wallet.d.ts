import { WalletWithRequiredFeatures, Wallet } from '@mysten/wallet-standard';

declare global {
  interface Navigator {
    wallets?: WalletWithRequiredFeatures[];
  }
}

// Extend the Wallets type to be iterable
declare module '@mysten/wallet-standard' {
  interface Wallets {
    get(): Wallet[];
  }
}

export {}; 