import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { getPOAPs, POAP } from '../sui/poap';
import './POAPCard.css';

export function POAPCard() {
  const wallet = useCurrentWallet();
  const suiClient = useSuiClient();
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const address = wallet?.currentWallet?.accounts[0]?.address;

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
  }, [address, suiClient]);

  if (loading) return <div>Loading POAPs...</div>;
  if (error) return <div>{error}</div>;
  if (!poaps.length) return <div>No POAPs found.</div>;

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