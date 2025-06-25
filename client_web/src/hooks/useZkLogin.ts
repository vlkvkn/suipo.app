import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { setSalt } from '../api/zklogin';

// Storage keys for zkLogin
const ZKLOGIN_STORAGE_KEYS = {
  MAX_EPOCH: 'zklogin_max_epoch',
  JWT: 'zklogin_jwt',
  SALT: 'zklogin_salt',
  USER_ADDRESS: 'zklogin_user_address',
  EPHEMERAL_PRIVATE_KEY: 'zklogin_ephemeral_private_key',
  RANDOMNESS: 'zklogin_randomness',
};

interface ZkLoginState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userAddress: string | null;
  ephemeralKeyPair?: Ed25519Keypair;
  jwt: string | null;
  maxEpoch: number | null;
  randomness?: string;
}

// --- Helper function for restoring or generating ephemeralKeypair ---
async function GenerateTemporyCryptoParts(client: SuiClient) {

  const ephemeralKeypair = new Ed25519Keypair();
  const secretKey = ephemeralKeypair.getSecretKey();
  localStorage.setItem(ZKLOGIN_STORAGE_KEYS.EPHEMERAL_PRIVATE_KEY, secretKey);

  localStorage.setItem(ZKLOGIN_STORAGE_KEYS.RANDOMNESS, generateRandomness());

  const { epoch } = await client.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
  localStorage.setItem(ZKLOGIN_STORAGE_KEYS.MAX_EPOCH, maxEpoch.toString());

}

export function useZkLogin() {
  const [state, setState] = useState<ZkLoginState>({
    ephemeralKeyPair: undefined,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    userAddress: null,
    jwt: null,
    maxEpoch: null
  });

  // Memoize client to prevent recreation on every render
  const client = useMemo(() => new SuiClient({ url: getFullnodeUrl("testnet" as any) }), []);

  const logout = useCallback(() => {
    
    // Clear stored data
    Object.values(ZKLOGIN_STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      userAddress: null,
      jwt: null,
      maxEpoch: null,
      ephemeralKeyPair: undefined,
    });
    
  }, []);

  // Restore state from localStorage on component mount
  useEffect(() => {
    const restoreState = () => {
      const storedJwt = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.JWT);
      const storedUserAddress = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.USER_ADDRESS);
      const storedMaxEpoch = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.MAX_EPOCH);
      const storedRandomness = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.RANDOMNESS);
      const storedEphemeralPrivateKey = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.EPHEMERAL_PRIVATE_KEY);

      if (storedJwt && storedUserAddress && storedMaxEpoch && storedEphemeralPrivateKey && storedRandomness) {

        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(storedEphemeralPrivateKey as string);

        try {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            userAddress: storedUserAddress,
            jwt: storedJwt,
            maxEpoch: parseInt(storedMaxEpoch),
            ephemeralKeyPair,
            randomness: storedRandomness,
          }));
        } catch (error) {
          console.error('Failed to restore zkLogin state:', error);
          // Clear corrupted data
          logout();
        }
      }
    };

    restoreState();
  }, [logout]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlFragment = window.location.hash.substring(1);
      const fragmentParams = new URLSearchParams(urlFragment);
      const idToken = fragmentParams.get('id_token');

      if (idToken) {
        try {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
          localStorage.setItem(ZKLOGIN_STORAGE_KEYS.JWT, idToken);
          const saltResponse = await setSalt(idToken);
          localStorage.setItem(ZKLOGIN_STORAGE_KEYS.USER_ADDRESS, saltResponse.userAddress);
          localStorage.setItem(ZKLOGIN_STORAGE_KEYS.SALT, saltResponse.salt as string);

          const storedEphemeralPrivateKey = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.EPHEMERAL_PRIVATE_KEY);
          let ephemeralKeyPair = Ed25519Keypair.fromSecretKey(storedEphemeralPrivateKey as string);

          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            userAddress: saltResponse.userAddress,
            jwt: idToken,
            isLoading: false,
            ephemeralKeyPair,
            maxEpoch: parseInt(localStorage.getItem(ZKLOGIN_STORAGE_KEYS.MAX_EPOCH) as string),
            randomness: localStorage.getItem(ZKLOGIN_STORAGE_KEYS.RANDOMNESS) as string
          }));
          window.location.hash = '';
        } catch (error) {
          console.error('Failed to handle OAuth callback (implicit flow):', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to complete authentication (implicit flow)',
            isLoading: false,
          }));
        }
        return;
      }
    };
    handleOAuthCallback();
  }, []);

  // Generate and save only if not in localStorage
  const login = useCallback(async () => {
    try {
      await GenerateTemporyCryptoParts(client);
      const oauthUrl = buildGoogleOAuthUrl();
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to build OAuth URL:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start OAuth flow',
      }));
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    errorWithLogin: state.error ? {
      message: state.error,
      retry: login,
    } : null,
  };
}

// Generate a random state parameter for OAuth security
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function buildGoogleOAuthUrl(): string {

  const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'; //TODO: move to env or config

  // Generate state parameter for security
  const state = generateState();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  const storedMaxEpoch = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.MAX_EPOCH);
  const storedRandomness = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.RANDOMNESS);
  const storedEphemeralPrivateKey = localStorage.getItem(ZKLOGIN_STORAGE_KEYS.EPHEMERAL_PRIVATE_KEY);
  let ephemeralKeypair = Ed25519Keypair.fromSecretKey(storedEphemeralPrivateKey as string);
  let nonce = generateNonce(ephemeralKeypair.getPublicKey(), parseInt(storedMaxEpoch as string), storedRandomness as string);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: nonce,
    state: state, // Add state parameter for security
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}