import { useMutation } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '../contexts/WalletContext';
import { SUI_NETWORK } from '../config';

interface SignAndExecuteTransactionOptions {
  transaction: Transaction;
  requestType?: 'WaitForLocalExecution' | 'WaitForEffectsCert';
}

export function useSignAndExecuteTransaction() {
  const { wallet, account } = useWallet();

  return useMutation({
    mutationFn: async ({ 
      transaction, 
      requestType = 'WaitForLocalExecution'
    }: SignAndExecuteTransactionOptions) => {
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
    },
  });
} 