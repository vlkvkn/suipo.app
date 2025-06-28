import { useCurrentWallet, useSuiClient, useZkLogin} from '../contexts/WalletContext';
import { useEffect, useState } from 'react';
import { getPOAPs, POAP } from '../sui/poap';
import './POAPCard.css';

export function POAPCard() {
  const wallet = useCurrentWallet();
  const { isAuthenticated, userAddress } = useZkLogin();
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get address from either standard wallet or zkLogin
  const address = wallet?.accounts[0]?.address || (isAuthenticated ? userAddress : null);
  const suiClient = useSuiClient();

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
        const userPoaps = await getPOAPs(suiClient, address);
        setPoaps(userPoaps);
      } catch (e) {
        setError('Failed to load POAPs');
      } finally {
        setLoading(false);
      }
    }
    loadPOAPs();
  }, [address, suiClient, userAddress]);

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