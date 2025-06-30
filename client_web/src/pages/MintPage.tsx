import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentWallet, useSuiClient, useZkLogin } from '../contexts/WalletContext';
import { useSignAndExecuteTransaction } from '../hooks/useSignAndExecuteTransaction';
import { useZkLoginTransaction } from '../hooks/useZkLoginTransaction';
import { buildMintPoapTx } from '../sui/poap';
import './MintPage.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const MintPage = () => {
  const query = useQuery();
  const eventKey = query.get('event') || '';
  const wallet = useCurrentWallet();
  const { isAuthenticated, userAddress, ephemeralKeyPair, jwt, maxEpoch, randomness } = useZkLogin();
  const [status, setStatus] = useState<'idle'|'minting'|'success'|'error'>('idle');
  const [error, setError] = useState<string>('');
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

   // Always create zkLogin transaction hook, but only use it when connected
   const zkLoginTransaction = useZkLoginTransaction({
    client: suiClient,
    ephemeralKeyPair: ephemeralKeyPair as any,
    jwt: jwt || "",
    maxEpoch: maxEpoch || 0,
    randomness: randomness || '',
    userAddress: userAddress || '',
  });

  // Check if user is connected via either standard wallet or zkLogin
  const isConnected = wallet?.accounts[0]?.address || (isAuthenticated && userAddress);
  const isZkLoginConnected = isAuthenticated && userAddress;

  useEffect(() => {
    async function handleMint() {
      if (isConnected && eventKey) {
        setStatus('minting');
        try {
          const tx = buildMintPoapTx(eventKey);
          
          let result;
          if (isZkLoginConnected) {
            result = await zkLoginTransaction.executeTransaction(tx);
          } else {
            result = await signAndExecuteTransaction({ transaction: tx, chain: 'sui:testnet' });
          }
          
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
  }, [isConnected, eventKey]);

  if (!eventKey) {
    return <div className="mint-page-container">No event specified for minting.</div>;
  }

  if (!isConnected) {
    return (
      <div className="mint-page-container">
        <div>Please connect your wallet to mint POAP.</div>
      </div>
    );
  }

  if (status === 'minting') {
    return <div className="mint-page-container">Minting POAP...</div>;
  }
  if (status === 'success') {
    return <div className="mint-page-container success">POAP minted successfully!</div>;
  }
  if (status === 'error') {
    return <div className="mint-page-container error">Mint error: {error}</div>;
  }

  return null;
};

export default MintPage; 