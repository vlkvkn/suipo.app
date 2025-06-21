import { MintButton } from '../components/MintButton';
import { POAPCard } from '../components/POAPCard';

export function Home() {
  return (
    <div>     
      <div style={{ padding: '1rem' }}>
        <MintButton />
        <POAPCard />
      </div>
    </div>
  );
} 