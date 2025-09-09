import { useMutation } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { useAuth, useSuiClient } from '../contexts/WalletContext';
import { SUI_NETWORK } from '../config';
import { getZkLoginSignature } from '@mysten/sui/zklogin';
import { createSponsoredTransaction, executeSponsoredTransaction } from '../api/zklogin';
import { Buffer } from 'buffer';

interface SignAndExecuteTransactionOptions {
  transaction: Transaction;
  transtactiontype?: 'wallet-standard' | 'zklogin' | 'zklogin-sponsored';
  requestType?: 'WaitForLocalExecution' | 'WaitForEffectsCert';
}

export function useSignAndExecuteTransaction() {

  const { wallet, zkLogin } = useAuth();
  const { userAddress, ephemeralKeyPair, proofData, maxEpoch, jwt } = zkLogin;
  const client =  useSuiClient();

  return useMutation({
    mutationFn: async ({ 
      transaction,
      transtactiontype = 'wallet-standard',
      requestType = 'WaitForLocalExecution'
    }: SignAndExecuteTransactionOptions) => {

      if (transtactiontype == "wallet-standard") {
        if (!wallet.wallet || !wallet.account) {
          throw new Error('Wallet not connected');
        }

        if (!wallet.wallet.features['sui:signAndExecuteTransactionBlock']) {
          throw new Error('Wallet does not support signAndExecuteTransactionBlock');
        }

        // Set the sender if not already set
        if (!transaction.blockData.sender) {
          transaction.setSender(wallet.account.address);
        }

        // Sign and execute the transaction
        const result = await wallet.wallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
          transactionBlock: transaction as any, // Cast to any to work around type mismatch
          account: wallet.account,
          requestType,
          chain: `sui:${SUI_NETWORK}`,
        });

        return result;
      
      //zklogin
      } else if (transtactiontype == "zklogin") {

        if (ephemeralKeyPair == undefined) {
          throw new Error('Ephemeral key pair is not ready');
        }

        transaction.setSender(userAddress);
        const { bytes, signature: userSignature } = await transaction.sign({
          client,
          signer: ephemeralKeyPair,
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
  
        return result;

      } else if (transtactiontype == "zklogin-sponsored") {

        if (ephemeralKeyPair == undefined) {
          throw new Error('Ephemeral key pair is not ready');
        }

        transaction.setSender(userAddress);

        // Build the transaction with the onlyTransactionKind flag,
        // as described in https://docs.enoki.mystenlabs.com/http-api/openapi
        const payloadBytes = await transaction.build({
          client,
          onlyTransactionKind: true,
        });

        const payloadBytesHex = Buffer.from(payloadBytes).toString("hex");
        const sponsoredResponse = await createSponsoredTransaction(jwt as string, payloadBytesHex, userAddress);
        const gaslessTx = Transaction.from(sponsoredResponse.data.bytes);

        const { signature: userSignature } = await gaslessTx.sign({
          client,
          signer: ephemeralKeyPair,
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

        const result = await executeSponsoredTransaction(sponsoredResponse.data.digest, zkLoginSignature);

        return result;

      }
    },
  });
}