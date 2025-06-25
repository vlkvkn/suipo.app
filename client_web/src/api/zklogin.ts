// Client-side API functions for zkLogin
import { SUI_NETWORK } from '../config';

export interface ZkLoginResponse {
  jwt: string;
  userInfo?: {
    email: string;
    name: string;
    picture?: string;
  };
}

export interface SaltResponse {
  success: boolean;
  salt: string;
  userAddress: string;
  publicKey: string;
  provider: string;
}

// Get salt for zkLogin from backend
export async function setSalt(jwt: string): Promise<SaltResponse> {

  try {

    const response = await fetch(`/api/zklogin/salt/generate?jwt=${encodeURIComponent(jwt)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw new Error(`Failed to set salt from jwt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get proof from backend
export async function getProof(jwt: string, ephemeralPublicKey: string, maxEpoch: number, randomness: string): Promise<any> {

  try {

    const response = await fetch(`/api/zklogin/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "network": SUI_NETWORK,
        "jwt": jwt,
        "ephemeralPublicKey": ephemeralPublicKey,
        "maxEpoch": maxEpoch,
        "randomness": randomness
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw new Error(`Failed to get proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

}