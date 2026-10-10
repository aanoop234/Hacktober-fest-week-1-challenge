import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => setStatus({ status: 'error', error: err.message }));
  }, []);

  const startGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/games`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start game. Is the server and Ollama running?');
      const data = await res.json();
      navigate(`/game/${data.gameId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card text-center" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <Leaf size={48} className="text-forest" />
      </div>
      <h1 className="text-3xl text-forest font-bold mb-2">Touch Grass</h1>
      <p className="text-earth text-xl mb-6">Step outside. Solve the world.</p>
      
      <div className="mb-6 text-left" style={{ background: 'var(--color-sage-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <h3 className="font-bold mb-2">How to Play:</h3>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>You will get 5 riddles for outdoor objects.</li>
          <li>Find the object and take a picture.</li>
          <li>Our AI will verify if you found the right thing.</li>
          <li>Score up to 5 points before the 5-minute timer runs out!</li>
        </ul>
      </div>

      {status && (
        <div className={`mb-4 ${status.status === 'ok' ? 'text-forest' : 'text-accent'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={16} />
          {status.status === 'ok' ? 'AI Systems Online' : 'AI Systems Offline/Degraded'}
        </div>
      )}

      {error && <p className="text-accent mb-4">{error}</p>}

      <button className="btn btn-primary" onClick={startGame} disabled={loading} style={{ width: '100%', fontSize: '1.2rem' }}>
        {loading ? 'Generating Hunt...' : 'Start Hunt'}
      </button>
    </div>
  );
}
