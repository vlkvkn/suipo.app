import { POAPCard } from '../components/POAPCard';
import '../components/POAPCard.css';

export default function PoapsPage() {
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ color: '#2586d1', fontWeight: 700, fontSize: '2rem', marginBottom: '2.5rem', textAlign: 'center' }}>
        My Collection
      </h2>
      <div className="poap-grid">
        <POAPCard />
      </div>
    </div>
  );
} 