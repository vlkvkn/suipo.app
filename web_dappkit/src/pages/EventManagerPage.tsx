import { EventManager } from '../components/EventManager';
// import { ConnectButton } from '../components/ConnectButton';
import { Link } from 'react-router-dom';

export function EventManagerPage() {
  return (
    <div>
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ 
          color: '#2563eb', 
          textDecoration: 'none',
          fontSize: '1rem',
          fontWeight: '500'
        }}>
          ← Back to Home
        </Link>
        {/* <ConnectButton /> */}
      </div>
      <EventManager />
    </div>
  );
} 