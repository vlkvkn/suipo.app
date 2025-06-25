import { useState, useCallback } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getZkLoginSignature, getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin';
import { getProof } from '../api/zklogin';

interface UseZkLoginTransactionProps {
  client: SuiClient;
  ephemeralKeyPair: Ed25519Keypair;
  jwt: string;
  randomness: string;
  maxEpoch: number;
  userAddress: string;
}

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  txDigest: string | null;
}

export function useZkLoginTransaction({
  client,
  ephemeralKeyPair,
  randomness,
  maxEpoch,
  jwt,
  userAddress,
}: UseZkLoginTransactionProps) {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    success: false,
    txDigest: null,
  });

  const executeTransaction = useCallback(async (
    transaction: Transaction
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        success: false,
        txDigest: null,
      }));

      const ephemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
      const proofData = await getProof(jwt, ephemeralPublicKey, maxEpoch, randomness);
      
      // Set the sender for the transaction
      transaction.setSender(userAddress);
      const { bytes, signature: userSignature } = await transaction.sign({
        client,
        signer: ephemeralKeyPair, // This must be the same ephemeral key pair used in the ZKP request
      });

      // Convert userSignature from base64 to Uint8Array
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          proofPoints: {
            a: proofData.data.proofPoints.a, 
            b: proofData.data.proofPoints.b,
            c: proofData.data.proofPoints.c,
          },
          issBase64Details: proofData.data.issBase64Details,
          headerBase64: proofData.data.headerBase64,
          addressSeed: proofData.data.addressSeed,
        },
        maxEpoch: maxEpoch.toString(),
        userSignature: userSignature,
      });

      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: true,
        txDigest: result.digest,
      }));
      return result;

    } catch (error) {
      console.error('Failed to execute zkLogin transaction:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to execute transaction',
        success: false,
      }));
      throw error;
    }
  }, [client, ephemeralKeyPair, jwt, maxEpoch, randomness]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      txDigest: null,
    });
  }, []);

  return {
    executeTransaction,
    ...state,
    reset,
  };
}