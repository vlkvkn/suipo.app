import { useCurrentWallet } from '../contexts/WalletContext';
import { useZkLogin } from '../hooks/useZkLogin';
import { useEffect, useState, useMemo } from 'react';
import { getPOAPs, POAP } from '../sui/poap';
import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import './POAPCard.css';

export function POAPCard() {
  const wallet = useCurrentWallet();
  const { isAuthenticated, userAddress } = useZkLogin();
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get address from either standard wallet or zkLogin
  const address = wallet?.accounts[0]?.address || (isAuthenticated ? userAddress : null);

  // Create a stable SuiClient instance
  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl('testnet') }), []);

  // Debug logging
  useEffect(() => {
    console.log('POAPCard state:', {
      walletAddress: wallet?.accounts[0]?.address,
      zkLoginAuthenticated: isAuthenticated,
      zkLoginUserAddr: userAddress,
      finalAddress: address
    });
  }, [wallet, isAuthenticated, userAddress, address]);

  useEffect(() => {
    async function loadPOAPs() {
      if (!address) {
        setPoaps([]);
        setLoading(false);
        setError(null);
        return;
      }
      try {
        setError(null);
        console.log('Loading POAPs for address:', address);
        const userPoaps = await getPOAPs(suiClient, address);
        console.log('Loaded POAPs:', userPoaps);
        setPoaps(userPoaps);
      } catch (e) {
        console.error('Error loading POAPs:', e);
        setError('Failed to load POAPs');
      } finally {
        setLoading(false);
      }
    }
    loadPOAPs();
  }, [address, suiClient]);

  if (loading) return <div>Loading POAPs...</div>;
  if (error) return <div>{error}</div>;
  if (!address) return <div>Please connect your wallet to view POAPs.</div>;
  if (!poaps.length) return <div>No POAPs found for this address.</div>;

  return (
    <div className="poap-card-list">
      {poaps.map((poap) => (
        <div className="poap-card" key={poap.id}>
          <img src={poap.imageUrl} alt={poap.name} className="poap-card-image" />
          <div className="poap-card-content">
            <h3>{poap.name}</h3>
            <p>{poap.description}</p>
            <span className="poap-card-event">Event ID: {poap.eventId}</span>
          </div>
        </div>
      ))}
    </div>
  );
} 