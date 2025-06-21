import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { buildMintPoapTx, getEvents } from '../sui/poap';
import { POAPEvent } from '../types/poap';

interface MintButtonProps {
  onSuccess?: () => void;
}

export function MintButton({ onSuccess }: MintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<POAPEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('0');
  const wallet = useCurrentWallet();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleMint = async () => {
    if (!wallet?.currentWallet?.accounts[0]?.address) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    try {
      const tx = buildMintPoapTx(selectedEventId);
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      if (result) {
        alert('POAP minted successfully!');
        onSuccess?.();
      } else {
        alert('Failed to mint POAP');
      }
    } catch (error) {
      console.error('Error minting POAP:', error);
      alert('Failed to mint POAP');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const eventsList = await getEvents(suiClient);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Load events when component mounts
  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDisabled = isLoading || !wallet?.currentWallet?.accounts[0]?.address;

  return (
    <div className="mint-button-container">
      <select
        value={selectedEventId}
        onChange={(e) => setSelectedEventId(e.target.value)}
        className="mint-button-select"
      >
        <option value="0">Select an event</option>
        {events.map((event) => (
          <option key={event.id} value={event.name}>
            {event.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleMint}
        disabled={isDisabled}
        className={`mint-button-button ${isDisabled ? 'mint-button-button-disabled' : 'mint-button-button-enabled'}`}
      >
        {isLoading ? 'Minting...' : 'Mint POAP'}
      </button>
    </div>
  );
}
