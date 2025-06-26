import popularWallets from './wallets.json';

export interface PopularWallet {
  name: string;
  icon: string;
  url: string;
  type?: 'wallet' | 'zklogin'; // Optional type field
}

export { popularWallets }; 