import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentWallet, useSuiClient, useZkLogin } from '../contexts/WalletContext';
import { useSignAndExecuteTransaction } from '../hooks/useSignAndExecuteTransaction';
import { useZkLoginTransaction } from '../hooks/useZkLoginTransaction';
import { buildMintPoapTx, getPOAPs } from '../sui/poap';
import './MintPage.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const MintPage = () => {
  const query = useQuery();
  const mintkey = query.get('mintkey') || '';
  const {account} = useCurrentWallet();
  const {isAuthenticated, userAddress, ephemeralKeyPair, jwt, maxEpoch, randomness } = useZkLogin();
  const [status, setStatus] = useState<'idle'|'minting'|'success'|'error'>('idle');
  const [error, setError] = useState<string>('');
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [alreadyMinted, setAlreadyMinted] = useState(false);
  const [checking, setChecking] = useState(true);

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
  const isConnected = account?.address || (isAuthenticated && userAddress);
  const isZkLoginConnected = isAuthenticated && userAddress;

  useEffect(() => {
    async function checkAlreadyMinted() {
      if (isConnected && mintkey) {
        setChecking(true);
        try {
          const address = account?.address || userAddress || '';
          const userPoaps = await getPOAPs(suiClient, address);
          const hasPoap = userPoaps.some(poap => poap.eventKey === mintkey);
          setAlreadyMinted(hasPoap);
        } catch (e) {
          // Could not check, allow mint attempt
          setAlreadyMinted(false);
        } finally {
          setChecking(false);
        }
      } else {
        setAlreadyMinted(false);
        setChecking(false);
      }
    }
    checkAlreadyMinted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mintkey]);

  useEffect(() => {
    async function handleMint() {
      if (isConnected && mintkey && !alreadyMinted) {
        setStatus('minting');
        try {
          const tx = buildMintPoapTx(mintkey);
          
          let result;
          if (isZkLoginConnected) {
            result = await zkLoginTransaction.executeTransaction(tx);
          } else {
            result = await signAndExecuteTransaction({ transaction: tx });
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
  }, [isConnected, mintkey, alreadyMinted]);

  if (!mintkey) {
    return <div style={{padding: 32}}>No event specified for minting.</div>;
  }

  if (!isConnected) {
    return <div style={{padding: 32}}>
        <div>Please connect your wallet to mint POAP.</div>
      </div>
  }

  if (checking) {
    return <div className="mint-page-container">Checking POAP ownership...</div>;
  }

  if (alreadyMinted) {
    return (
      <div className="mint-page-container error">
        <div>You already own this POAP for this event.</div>
        <div><a href="/poaps" className='poap-link'>Go to your POAPs</a></div>
      </div>
    );
  }

  if (status === 'minting') {
    return <div className="mint-page-container">Minting POAP...</div>;
  }
  if (status === 'success') {
    return (
      <div className="mint-page-container success">
        <div>POAP minted successfully!</div>
        <div><a href="/poaps" className='poap-link'>Go to your POAPs</a></div>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="mint-page-container error">Mint error: {error}</div>;
  }

  return null;
};

export default MintPage; 