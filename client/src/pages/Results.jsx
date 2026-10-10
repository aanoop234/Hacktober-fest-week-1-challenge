import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Home as HomeIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Results() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/games/${gameId}/results`)
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameId]);

  if (loading) return <div className="loader"></div>;
  if (!results) return <div className="text-center text-accent mt-4">Failed to load results.</div>;

  return (
    <div className="card text-center" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <Trophy size={48} className="text-accent" />
      </div>
      <h1 className="text-3xl text-forest font-bold mb-2">Hunt Complete!</h1>
      <p className="text-xl font-bold mb-6">Score: {results.score} / 5</p>

      <div className="mb-6 text-left" style={{ background: 'var(--color-sage-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <p className="mb-2"><strong>Independent Finds:</strong> {results.independent}</p>
        <p className="mb-4"><strong>Revealed Early:</strong> {results.revealed}</p>
        <h4 className="font-bold mb-2">Summary:</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {results.summary.map((p, i) => (
            <li key={p.id} className="mb-2 p-2 bg-white rounded" style={{ background: 'white', borderRadius: '4px' }}>
              Puzzle {i + 1}: {p.targetObject || 'Unknown'} 
              <span style={{ float: 'right', color: p.pointsAwarded > 0 ? 'var(--color-forest)' : 'var(--color-accent)' }}>
                {p.pointsAwarded > 0 ? '+1' : '0'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>
        <HomeIcon size={20} /> Play Again
      </button>
    </div>
  );
}
