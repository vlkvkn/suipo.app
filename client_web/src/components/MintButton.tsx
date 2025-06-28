import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient, useZkLogin } from '../contexts/WalletContext';
import { useSignAndExecuteTransaction } from '../hooks/useSignAndExecuteTransaction';
import { useZkLoginTransaction } from '../hooks/useZkLoginTransaction';
import { buildMintPoapTx, getEvents } from '../sui/poap';
import { POAPEvent } from '../types/poap';

interface MintButtonProps {
  onSuccess?: () => void;
}

export function MintButton({ onSuccess }: MintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<POAPEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const wallet = useCurrentWallet();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const {isAuthenticated,userAddress,ephemeralKeyPair,jwt,maxEpoch,randomness} = useZkLogin();

  const isWalletConnected = !!wallet?.accounts[0]?.address; //TODO: make refactor
  const isZkLoginReady = isAuthenticated && !!userAddress && !!jwt; //TODO: make refactor
  const isConnected = isWalletConnected || isZkLoginReady; //TODO: make refactor

  // Always create zkLogin transaction hook, but only use it when connected
  const zkLoginTransaction = useZkLoginTransaction({
    client: suiClient,
    ephemeralKeyPair: ephemeralKeyPair as any,
    jwt: jwt || "",
    maxEpoch: maxEpoch || 0,
    randomness: randomness || '',
    userAddress: userAddress || '',
  });

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet or zkLogin first');
      return;
    }
    if (!selectedEventId || selectedEventId === '' || selectedEventId === "0") {
      alert('Please select an event first');
      return;
    }
    setIsLoading(true);
    try {
      // Mint logic: prefer wallet if connected, else zkLogin
      let result;
      const tx = buildMintPoapTx(selectedEventId); // nonce not needed for wallet      
      if (isWalletConnected) {
        result = await signAndExecuteTransaction({ transaction: tx, chain: 'sui:testnet' });
      } else if (isZkLoginReady) {
        result = await zkLoginTransaction.executeTransaction(tx);
      } else {
        alert('No valid wallet or zkLogin session found.');
        setIsLoading(false);
        return;
      }
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
      setIsLoadingEvents(true);
      const eventsList = await getEvents(suiClient);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Load events when component mounts
  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if button should be disabled
  const isDisabled = isLoading || !isConnected || !selectedEventId || selectedEventId === '' || isLoadingEvents;

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
