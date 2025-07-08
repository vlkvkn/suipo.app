import { useMutation } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet, useZkLogin, useSuiClient } from '../contexts/WalletContext';
import { SUI_NETWORK } from '../config';
import { getZkLoginSignature } from '@mysten/sui/zklogin';

interface SignAndExecuteTransactionOptions {
  transaction: Transaction;
  wallettype?: 'wallet-standard' | 'zklogin';
  requestType?: 'WaitForLocalExecution' | 'WaitForEffectsCert';
}

export function useSignAndExecuteTransaction() {

  const { wallet, account } = useWallet();
  const { userAddress, ephemeralKeyPair, proofData, maxEpoch } = useZkLogin();
  const client =  useSuiClient();

  return useMutation({
    mutationFn: async ({ 
      transaction,
      wallettype = 'wallet-standard',
      requestType = 'WaitForLocalExecution'
    }: SignAndExecuteTransactionOptions) => {

      if (wallettype == "wallet-standard") {
        if (!wallet || !account) {
          throw new Error('Wallet not connected');
        }

        if (!wallet.features['sui:signAndExecuteTransactionBlock']) {
          throw new Error('Wallet does not support signAndExecuteTransactionBlock');
        }

        // Set the sender if not already set
        if (!transaction.blockData.sender) {
          transaction.setSender(account.address);
        }

        // Sign and execute the transaction
        const result = await wallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
          transactionBlock: transaction as any, // Cast to any to work around type mismatch
          account,
          requestType,
          chain: `sui:${SUI_NETWORK}`,
        });

        return result;
      
      //zklogin
      } else {

        if (ephemeralKeyPair == undefined) {
          throw new Error('Key pair is not ready');
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

      }
    },
  });
}