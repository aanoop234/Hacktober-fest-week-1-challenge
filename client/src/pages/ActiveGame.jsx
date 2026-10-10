import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Lightbulb, SkipForward, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ActiveGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins in seconds
  
  const [activePuzzleIndex, setActivePuzzleIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [revealedHint, setRevealedHint] = useState(null);

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;
    
    // Server says 5 mins (300000 ms) max.
    const timeRemaining = Math.max(0, 300 - Math.floor(gameState.elapsedMs / 1000));
    setTimeLeft(timeRemaining);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/game/${gameId}/results`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`${API_URL}/games/${gameId}`);
      if (!res.ok) throw new Error('Game not found or expired');
      const data = await res.json();
      
      if (data.status !== 'active') {
        navigate(`/game/${gameId}/results`);
        return;
      }
      
      setGameState(data);
      setLoading(false);
      
      // Find first uncompleted puzzle
      const nextIndex = data.puzzles.findIndex(p => p.status !== 'completed');
      if (nextIndex === -1) {
        navigate(`/game/${gameId}/results`);
      } else {
        setActivePuzzleIndex(nextIndex);
        setFeedback(null);
        setRevealedHint(null);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const currentPuzzle = gameState?.puzzles[activePuzzleIndex];

  const handleHint = async () => {
    try {
      const res = await fetch(`${API_URL}/games/${gameId}/puzzles/${currentPuzzle.id}/hint`, { method: 'POST' });
      const data = await res.json();
      setRevealedHint(data.hint);
    } catch (err) {
      alert('Failed to load hint');
    }
  };

  const handlePass = async () => {
    if (!window.confirm("Are you sure? You will get 0 points for this puzzle.")) return;
    try {
      setUploading(true);
      const res = await fetch(`${API_URL}/games/${gameId}/puzzles/${currentPuzzle.id}/pass`, { method: 'POST' });
      await res.json();
      setFeedback({ correct: false, message: 'Puzzle passed.' });
    } catch (err) {
      alert('Failed to pass');
    } finally {
      setUploading(false);
    }
  };

  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/games/${gameId}/puzzles/${currentPuzzle.id}/submit`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data);
      } else {
        setFeedback({ correct: false, message: 'Error', explanation: data.error });
      }
    } catch (err) {
      setFeedback({ correct: false, message: 'Upload Failed', explanation: 'Network or AI error.' });
    } finally {
      setUploading(false);
    }
  };

  const nextPuzzle = async () => {
    if (activePuzzleIndex < 4) {
      setLoading(true);
      try {
        await fetch(`${API_URL}/games/${gameId}/next`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to generate next puzzle', err);
      }
    }
    fetchGame();
  };

  if (loading) return <div className="loader"></div>;
  if (error) return <div className="text-accent text-center mt-4">{error}</div>;
  if (!currentPuzzle) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="font-bold text-forest">Score: {gameState.score}/5</div>
        <div className="font-bold text-accent" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={16} /> {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="card">
        <div className="text-sm text-earth mb-2">Puzzle {activePuzzleIndex + 1} of 5 &bull; {currentPuzzle.difficulty}</div>
        <h2 className="text-2xl font-bold mb-4">{currentPuzzle.riddle}</h2>

        {feedback ? (
          <div className="feedback-box">
            {photoPreview && <img src={photoPreview} className="preview-img" alt="Your submission" />}
            <h3 className={`font-bold ${feedback.correct ? 'text-forest' : 'text-accent'}`}>{feedback.message}</h3>
            {feedback.explanation && <p className="mt-2 text-earth-dark">{feedback.explanation}</p>}
            {(feedback.correct || feedback.message === 'Puzzle passed.') ? (
              <button className="btn btn-primary mt-4 w-full" onClick={() => { setPhotoPreview(null); nextPuzzle(); }}>Next Puzzle</button>
            ) : (
              <button className="btn btn-secondary mt-4 w-full" onClick={() => { setPhotoPreview(null); setFeedback(null); }}>Try Again</button>
            )}
          </div>
        ) : (
          <>
            {revealedHint && (
              <div className="mb-4 p-3" style={{ background: '#FFF3E0', borderRadius: '8px', color: '#E65100' }}>
                <strong>Hint:</strong> {revealedHint}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={handleHint} disabled={uploading || revealedHint} style={{ flex: 1, padding: '0.5rem' }}>
                <Lightbulb size={16} /> {revealedHint ? 'Hint Shown' : 'Hint'}
              </button>
              <button className="btn btn-danger" onClick={handlePass} disabled={uploading} style={{ flex: 1, padding: '0.5rem' }}>
                <SkipForward size={16} /> Pass
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {uploading ? (
                <div className="text-center py-4">
                  {photoPreview && <img src={photoPreview} className="preview-img" alt="Your submission" />}
                  <div className="loader"></div>
                  <p className="text-earth font-bold mt-4">AI is verifying your photo...</p>
                </div>
              ) : (
                <>
                  <div className="file-upload-wrapper w-full">
                    <button className="btn btn-primary w-full" style={{ width: '100%' }}>
                      <Camera size={20} /> Take Photo
                    </button>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
                  </div>
                  <div className="file-upload-wrapper w-full mt-2">
                    <button className="btn btn-secondary w-full" style={{ width: '100%' }}>
                      <ImageIcon size={20} /> Upload from Gallery
                    </button>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
