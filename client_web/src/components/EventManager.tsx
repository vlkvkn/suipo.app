import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient } from '../contexts/WalletContext';
import { useSignAndExecuteTransaction } from '../hooks/useSignAndExecuteTransaction';
import { buildCreateEventTx, getEvents } from '../sui/poap';
import { POAPEvent } from '../types/poap';
import './EventManager.css';
import QRCode from 'react-qr-code';
import { BASE_URL, SERVER_URL } from '../config';

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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [poapImageFile, setPoapImageFile] = useState<File | null>(null);
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

  // Function to upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${SERVER_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.file?.url) {
        throw new Error('Invalid response from server');
      }

      return result.file.filename;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during upload');
    }
  };

  // Function to upload both images before creating event
  const uploadImages = async (): Promise<{ eventImagePath: string; poapImagePath: string }> => {
    if (!eventImageFile || !poapImageFile) {
      throw new Error('Both event image and POAP image are required');
    }

    setUploadingImages(true);
    setUploadProgress('Starting image upload...');
    
    try {
      // Upload event image first
      setUploadProgress('Uploading event image...');
      const eventImagePath = await uploadImage(eventImageFile);
      
      // Upload POAP image
      setUploadProgress('Uploading POAP image...');
      const poapImagePath = await uploadImage(poapImageFile);
      
      setUploadProgress('Images uploaded successfully!');
      
      return { eventImagePath, poapImagePath };
    } catch (error) {
      setUploadProgress('');
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet?.accounts[0]?.address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!eventImageFile || !poapImageFile) {
      alert('Please select both event image and POAP image');
      return;
    }

    setIsLoading(true);
    try {
      // Upload images first
      const { eventImagePath, poapImagePath } = await uploadImages();

      // Create event with uploaded image URLs
      const tx = await buildCreateEventTx(
        suiClient,
        newEvent.eventKey,
        newEvent.description,
        eventImagePath, // Use uploaded image URL
        newEvent.poapName,
        newEvent.poapDescription,
        poapImagePath, // Use uploaded POAP image URL
        newEvent.expiredAt
      );

      const result = await signAndExecuteTransaction({
        transaction: tx,
        chain: "sui:testnet"
      });

      if (result) {
        // Reset form and file inputs
        setNewEvent({ 
          eventKey: '', 
          description: '', 
          imgPath: '',
          poapName: '',
          poapDescription: '',
          poapImgPath: '',
          expiredAt: ''
        });
        setEventImageFile(null);
        setPoapImageFile(null);
        setUploadProgress('');
        
        // Reset file input elements
        const eventImageInput = document.getElementById('event-image-input') as HTMLInputElement;
        const poapImageInput = document.getElementById('poap-image-input') as HTMLInputElement;
        if (eventImageInput) eventImageInput.value = '';
        if (poapImageInput) poapImageInput.value = '';

        await loadEvents();
      } else {
        alert('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        </div>

        {/* Event Image Upload */}
        <div className="event-manager-input-group">
          <label htmlFor="event-image-input" className="event-manager-label">
            Event Image (required)
          </label>
          <input
            id="event-image-input"
            type="file"
            accept="image/*"
            onChange={(e) => setEventImageFile(e.target.files?.[0] || null)}
            className="event-manager-file-input"
            required
          />
          {eventImageFile && (
            <div className="event-manager-file-info">
              Selected: {eventImageFile.name} ({(eventImageFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
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
        </div>

        {/* POAP Image Upload */}
        <div className="event-manager-input-group">
          <label htmlFor="poap-image-input" className="event-manager-label">
            POAP Image (required)
          </label>
          <input
            id="poap-image-input"
            type="file"
            accept="image/*"
            onChange={(e) => setPoapImageFile(e.target.files?.[0] || null)}
            className="event-manager-file-input"
            required
          />
          {poapImageFile && (
            <div className="event-manager-file-info">
              Selected: {poapImageFile.name} ({(poapImageFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
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
          disabled={isLoading || uploadingImages}
          className="event-manager-button"
        >
          {uploadingImages ? 'Uploading Images...' : isLoading ? 'Creating Event...' : 'Create Event'}
        </button>
        
        {uploadProgress && (
          <div className="event-manager-upload-progress">
            {uploadProgress}
          </div>
        )}
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
                  <QRCode value={`${BASE_URL}/mint?mintkey=${encodeURIComponent(event.name)}`} size={64} />
                  {/* Direct mint link for mobile or desktop users */}
                  <a href={`${BASE_URL}/mint?mintkey=${encodeURIComponent(event.name)}`} target="_blank"
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