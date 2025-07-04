export const PACKAGE_ID = import.meta.env.VITE_SUI_POAPCONTRACT_PACKAGE_ID as string;
export const EVENT_CONFIG_ID = import.meta.env.VITE_SUI_POAPCONTRACT_EVENT_CONFIG_ID as string;
export const CLOCK_ID = "0x6";

export const SUI_NETWORK = import.meta.env.VITE_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet' || "testnet";
export const BASE_URL = import.meta.env.VITE_APP_DOMAIN || "https://suipo.app";

// Server configuration
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://suipo.app:8000";