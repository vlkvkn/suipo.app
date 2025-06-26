import { useMutation } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet, useNetwork } from '../contexts/WalletContext';

interface SignAndExecuteTransactionOptions {
  transaction: Transaction;
  requestType?: 'WaitForLocalExecution' | 'WaitForEffectsCert';
  chain?: 'sui:mainnet' | 'sui:testnet' | 'sui:devnet';
}

export function useSignAndExecuteTransaction() {
  const { wallet, account } = useWallet();
  const { network } = useNetwork();

  return useMutation({
    mutationFn: async ({ 
      transaction, 
      requestType = 'WaitForLocalExecution',
      chain
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

      // Use provided chain or default to current network
      const chainId = chain || `sui:${network}`;

      // Sign and execute the transaction
      const result = await wallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
        transactionBlock: transaction as any, // Cast to any to work around type mismatch
        account,
        requestType,
        chain: chainId, // Add chain identifier
      });

      return result;
    },
  });
} 