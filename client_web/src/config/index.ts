export const PACKAGE_ID = "0x36431e24f17fd9b9e3d8daaa330f0f37b81c3441b157cf7159aa4b8a80c12f1e";
export const EVENT_CONFIG_ID = "0xd3221c2c75703be7bf1612ff093e711e8b7e630a989984aefdad9b499e5446cd";
export const CLOCK_ID = "0x6";

export const SUI_NETWORK = (import.meta.env.SUI_NETWORK as "mainnet" | "testnet" | "devnet" | "localnet") ?? "testnet";
export const BASE_URL = import.meta.env.VITE_APP_DOMAIN || "https://suipo.app";

// Server configuration
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://suipo.app:8000";