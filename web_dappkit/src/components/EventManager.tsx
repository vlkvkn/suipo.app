import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { buildCreateEventTx, getEvents } from '../sui/poap';
import { POAPEvent } from '../types/poap';
import './EventManager.css';
import QRCode from 'react-qr-code';
import { BASE_URL } from '../config';

export function EventManager() {
  const [events, setEvents] = useState<POAPEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ 
    eventKey: '', 
    description: '', 
    imgPath: '',
    poapName: '',
    poapDescription: '',
    poapImgPath: '',
    expiredAt: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const wallet = useCurrentWallet();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEvents = async () => {
    try {
      const eventsList = await getEvents(suiClient);
      setEvents(eventsList as POAPEvent[]);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet?.currentWallet?.accounts[0]?.address) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    try {
      const tx = await buildCreateEventTx(
        suiClient,
        newEvent.eventKey,
        newEvent.description,
        newEvent.imgPath,
        newEvent.poapName,
        newEvent.poapDescription,
        newEvent.poapImgPath,
        newEvent.expiredAt
      );
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      if (result) {
        setNewEvent({ 
          eventKey: '', 
          description: '', 
          imgPath: '',
          poapName: '',
          poapDescription: '',
          poapImgPath: '',
          expiredAt: ''
        });
        await loadEvents();
      } else {
        alert('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="event-manager-container">
      <h2 className="event-manager-title">Event Manager</h2>
      
      <form onSubmit={handleCreateEvent} className="event-manager-form">
        <div className="event-manager-input-group">
          <input
            type="text"
            placeholder="Event Key"
            value={newEvent.eventKey}
            onChange={(e) => setNewEvent({ ...newEvent, eventKey: e.target.value })}
            className="event-manager-input"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            className="event-manager-input"
            required
          />
          <input
            type="text"
            placeholder="Image Path"
            value={newEvent.imgPath}
            onChange={(e) => setNewEvent({ ...newEvent, imgPath: e.target.value })}
            className="event-manager-input"
            required
          />
        </div>
        <div className="event-manager-input-group">
          <input
            type="text"
            placeholder="POAP Name"
            value={newEvent.poapName}
            onChange={(e) => setNewEvent({ ...newEvent, poapName: e.target.value })}
            className="event-manager-input"
            required
          />
          <input
            type="text"
            placeholder="POAP Description"
            value={newEvent.poapDescription}
            onChange={(e) => setNewEvent({ ...newEvent, poapDescription: e.target.value })}
            className="event-manager-input"
            required
          />
          <input
            type="text"
            placeholder="POAP Image Path"
            value={newEvent.poapImgPath}
            onChange={(e) => setNewEvent({ ...newEvent, poapImgPath: e.target.value })}
            className="event-manager-input"
            required
          />
        </div>
        <div className="event-manager-input-group">
          <input
            type="number"
            placeholder="Expired At (timestamp in milliseconds)"
            value={newEvent.expiredAt}
            onChange={(e) => setNewEvent({ ...newEvent, expiredAt: e.target.value })}
            className="event-manager-input"
            required
          />
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#666', 
            marginTop: '0.25rem',
            gridColumn: '1 / -1'
          }}>
            Tip: Use current timestamp + desired days (e.g., {Date.now()} + 86400000 for 1 day)
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="event-manager-button"
        >
          {isLoading ? 'Creating...' : 'Create Event'}
        </button>
      </form>

      <div className="event-manager-events-container">
        <div className="event-manager-events-list">
          {events.map((event) => (
            <div key={event.id} className="event-manager-event-card">
              <div className="event-manager-event-content">
                <img 
                  src={event.imageUrl} 
                  alt={event.name} 
                  className="event-manager-event-image"
                />
                <div className="event-manager-event-info">
                  <div className="event-manager-event-name">{event.name}</div>
                  <div className="event-manager-event-description">{event.description}</div>
                  <div className="event-manager-event-description" style={{fontSize: '0.7rem', marginTop: '0.25rem'}}>
                    POAP: {event.poapName}
                  </div>
                  <div className="event-manager-event-description" style={{fontSize: '0.7rem'}}>
                    Visitors: {event.visitors.length}
                  </div>
                  <div className="event-manager-event-description" style={{fontSize: '0.7rem'}}>
                    Expires: {(() => {
                      const timestamp = Number(event.expiredAt);
                      if (isNaN(timestamp) || timestamp === 0) {
                        return 'Never';
                      }
                      return new Date(timestamp).toLocaleDateString();
                    })()}
                  </div>
                </div>
                <div style={{marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <QRCode value={`${BASE_URL}/mint?event=${encodeURIComponent(event.name)}`} size={64} />
                  {/* Direct mint link for mobile or desktop users */}
                  <a href={`${BASE_URL}/mint?event=${encodeURIComponent(event.name)}`} target="_blank"
                    rel="noopener noreferrer" style={{ marginTop: 8, fontSize: '0.85rem', color: '#2563eb', wordBreak: 'break-all' }}
                  >Mint POAP</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 