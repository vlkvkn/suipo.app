import { POAPCard } from '../components/POAPCard';
import '../components/POAPCard.css';

export default function PoapsPage() {
  return (
    <div className="poaps-page-container">
      <h2 className="poaps-page-title">
        My Collection
      </h2>
      <div className="poap-grid">
        <POAPCard />
      </div>
    </div>
  );
} 