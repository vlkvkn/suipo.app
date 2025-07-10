// Client-side API functions for zkLogin
import { SUI_NETWORK } from '../config';
import { Buffer } from 'buffer';

export interface SaltResponse {
  success: boolean;
  salt: string;
  userAddress: string;
  publicKey: string;
  provider: string;
}

export interface ProofResponse {
  data: {
    proofPoints?: {
      [k: string]: unknown;
    };
    issBase64Details?: {
      [k: string]: unknown;
    };
    headerBase64?: {
      [k: string]: unknown;
    };
    addressSeed: string;
  };
}
 
export interface SponsoredCreateResponse {
  data: {
    digest: string;
    bytes: string;
  };
}

export interface SponsoredExecuteResponse {
  data: {
    digest: string;
  };
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
export async function getProof(jwt: string, ephemeralPublicKey: string, maxEpoch: number, randomness: string): Promise<ProofResponse> {

  try {

    const response = await fetch(`/api/zklogin/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: SUI_NETWORK,
        jwt: jwt,
        ephemeralPublicKey: ephemeralPublicKey,
        maxEpoch: maxEpoch,
        randomness: randomness
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

export async function createSponsoredTransaction(jwt: string, payloadBytesHex: string, userAddress: string): Promise<SponsoredCreateResponse> {

  const payloadBytes = new Uint8Array(Buffer.from(payloadBytesHex, "hex"));
  const payloadBase64 = btoa(
    payloadBytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  try {

    const response = await fetch(`/api/zklogin/sponsor/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network: SUI_NETWORK,
        jwt: jwt,
        payloadBytes: payloadBase64,
        userAddress: userAddress
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Error in sponsored transaction response: ${data.errors.map((err: any) => typeof err === 'string' ? err : JSON.stringify(err)).join('; ')}`);
    }

    return data;

  } catch (error) {
    throw new Error(`Failed to create sponsored transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
}

export async function executeSponsoredTransaction(digest: string, signature: string): Promise<SponsoredExecuteResponse> {

  try {

    const response = await fetch(`/api/zklogin/sponsor/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        digest: digest,
        signature: signature
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Error in sponsored transaction response: ${data.errors.map((err: any) => typeof err === 'string' ? err : JSON.stringify(err)).join('; ')}`);
    }

    return data;

  } catch (error) {
    throw new Error(`Failed to execute sponsored transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
}