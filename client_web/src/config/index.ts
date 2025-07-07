// App Configuration
export const BASE_URL = import.meta.env.VITE_APP_DOMAIN;
export const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const MAX_FILE_SIZE = 2097152 //# Maximum file size for upload (in bytes)

// Sui Network
export const SUI_NETWORK = import.meta.env.VITE_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet' || "testnet";

// Sui Contract
export const PACKAGE_ID = import.meta.env.VITE_SUI_POAPCONTRACT_PACKAGE_ID as string;
export const EVENT_CONFIG_ID = import.meta.env.VITE_SUI_POAPCONTRACT_EVENT_CONFIG_ID as string;
export const CLOCK_ID = "0x6";

// Google OAuth
export const GOOGLE_OAUTH_URL = import.meta.env.VITE_GOOGLE_OAUTH_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;