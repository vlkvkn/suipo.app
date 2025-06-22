import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentWallet } from '../contexts/WalletContext';
import { useSignAndExecuteTransaction } from '../hooks/useSignAndExecuteTransaction';
import { buildMintPoapTx } from '../sui/poap';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const MintPage = () => {
  const query = useQuery();
  const eventKey = query.get('event') || '';
  const wallet = useCurrentWallet();
  const [status, setStatus] = useState<'idle'|'minting'|'success'|'error'>('idle');
  const [error, setError] = useState<string>('');
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    async function handleMint() {
      if (wallet?.accounts[0]?.address && eventKey) {
        setStatus('minting');
        try {
          const tx = buildMintPoapTx(eventKey);
          const result = await signAndExecuteTransaction({ transaction: tx });
          if (result) {
            setStatus('success');
          } else {
            setStatus('error');
            setError('Mint failed');
          }
        } catch (e: any) {
          setStatus('error');
          setError(e?.message || 'Mint error');
        }
      }
    }
    handleMint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, eventKey]);

  if (!eventKey) {
    return <div style={{padding: 32}}>No event specified for minting.</div>;
  }

  if (!wallet?.accounts[0]?.address) {
    return <div style={{padding: 32}}>
      <div>Please connect your wallet to mint POAP.</div>
    </div>;
  }

  if (status === 'minting') {
    return <div style={{padding: 32}}>Minting POAP...</div>;
  }
  if (status === 'success') {
    return <div style={{padding: 32, color: 'green'}}>POAP minted successfully!</div>;
  }
  if (status === 'error') {
    return <div style={{padding: 32, color: 'red'}}>Mint error: {error}</div>;
  }

  return null;
};

export default MintPage; 