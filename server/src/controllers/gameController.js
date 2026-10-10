import { randomUUID } from 'crypto';
import { state } from '../models/gameState.js';
import { generatePuzzle, verifyPhoto } from '../services/ollamaService.js';

export const checkHealth = async (req, res) => {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaCheck = await fetch(`${OLLAMA_URL}/`);
    if (ollamaCheck.ok) {
      return res.json({ status: 'ok', ollama: 'available' });
    } else {
      return res.json({ status: 'degraded', ollama: 'unavailable' });
    }
  } catch (err) {
    return res.json({ status: 'degraded', ollama: 'unavailable', error: err.message });
  }
};

export const createGame = async (req, res) => {
  try {
    const puzzleRaw = await generatePuzzle([]);
    const gameId = randomUUID();
    
    const puzzle = {
      ...puzzleRaw,
      status: 'pending',
      pointsAwarded: 0,
      passed: false
    };

    const newGame = {
      id: gameId,
      startTime: new Date(),
      endTime: null,
      puzzles: [puzzle],
      score: 0,
      status: 'active'
    };

    state.games.set(gameId, newGame);
    
    // Don't expose targetObject and hint immediately
    const safePuzzle = {
      id: puzzle.id,
      riddle: puzzle.riddle,
      difficulty: puzzle.difficulty,
      status: puzzle.status,
      pointsAwarded: puzzle.pointsAwarded,
      passed: puzzle.passed
    };

    res.status(201).json({ gameId, puzzles: [safePuzzle] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create game', details: err.message });
  }
};

export const generateNextPuzzle = async (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'active') return res.status(400).json({ error: 'Game is not active' });
  
  if (game.puzzles.length >= 5) {
    return res.status(400).json({ error: 'Max puzzles reached' });
  }

  const lastPuzzle = game.puzzles[game.puzzles.length - 1];
  if (lastPuzzle && lastPuzzle.status !== 'completed') {
    return res.status(400).json({ error: 'Current puzzle is not completed yet' });
  }

  try {
    const existingObjects = game.puzzles.map(p => p.targetObject);
    const puzzleRaw = await generatePuzzle(existingObjects);
    
    const newPuzzle = {
      ...puzzleRaw,
      status: 'pending',
      pointsAwarded: 0,
      passed: false
    };

    game.puzzles.push(newPuzzle);

    res.status(200).json({ 
      id: newPuzzle.id, 
      riddle: newPuzzle.riddle, 
      difficulty: newPuzzle.difficulty,
      status: newPuzzle.status,
      pointsAwarded: newPuzzle.pointsAwarded,
      passed: newPuzzle.passed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate next puzzle', details: err.message });
  }
};

export const getGameProgress = (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  // Calculate elapsed time (timer logic check)
  const now = new Date();
  const elapsed = now - game.startTime;
  if (elapsed > 5 * 60 * 1000 && game.status === 'active') {
    game.status = 'expired';
    game.endTime = now;
  }

  const safePuzzles = game.puzzles.map(p => {
    const safeP = {
      id: p.id,
      riddle: p.riddle,
      difficulty: p.difficulty,
      status: p.status,
      pointsAwarded: p.pointsAwarded,
      passed: p.passed
    };
    if (p.status === 'completed' || p.passed) {
      safeP.hint = p.hint;
    }
    return safeP;
  });

  res.json({
    id: game.id,
    status: game.status,
    score: game.score,
    elapsedMs: elapsed,
    puzzles: safePuzzles
  });
};

export const getPuzzle = (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const puzzle = game.puzzles.find(p => p.id === req.params.puzzleId);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });
  
  res.json({
    id: puzzle.id,
    riddle: puzzle.riddle,
    difficulty: puzzle.difficulty,
    status: puzzle.status,
    pointsAwarded: puzzle.pointsAwarded,
    passed: puzzle.passed,
    ...(puzzle.status === 'completed' || puzzle.passed ? { hint: puzzle.hint } : {})
  });
};

export const revealHint = (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const puzzle = game.puzzles.find(p => p.id === req.params.puzzleId);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

  res.json({ hint: puzzle.hint });
};

export const passPuzzle = (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'active') return res.status(400).json({ error: 'Game is not active' });
  
  const puzzle = game.puzzles.find(p => p.id === req.params.puzzleId);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

  if (puzzle.status === 'completed') {
    return res.status(400).json({ error: 'Puzzle is already completed' });
  }

  puzzle.status = 'completed';
  puzzle.passed = true;
  puzzle.pointsAwarded = 0;
  
  res.json({ 
    message: 'Puzzle passed'
  });
};

export const submitPhoto = async (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'active') return res.status(400).json({ error: 'Game is not active' });

  // Time check
  const now = new Date();
  if (now - game.startTime > 5 * 60 * 1000) {
    game.status = 'expired';
    game.endTime = now;
    return res.status(400).json({ error: 'Game has expired' });
  }
  
  const puzzle = game.puzzles.find(p => p.id === req.params.puzzleId);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

  if (puzzle.status === 'completed') {
    return res.status(400).json({ error: 'Puzzle already completed' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No photo provided' });
  }

  try {
    const result = await verifyPhoto(req.file.buffer, req.file.mimetype, puzzle.targetObject);
    
    if (result.match && (result.confidence || 0) >= 0.7) { // 0.7 conservative threshold
      puzzle.status = 'completed';
      puzzle.pointsAwarded = 1;
      game.score += 1;
      
      return res.json({ 
        correct: true, 
        message: 'Object matched!', 
        explanation: result.explanation
      });
    } else {
      return res.json({ 
        correct: false, 
        message: 'Incorrect object.', 
        explanation: result.explanation 
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Photo verification failed', details: err.message });
  }
};

export const getResults = (req, res) => {
  const game = state.games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const independent = game.puzzles.filter(p => p.pointsAwarded === 1).length;
  const passed = game.puzzles.filter(p => p.passed).length;

  res.json({
    score: game.score,
    independent,
    passed,
    summary: game.puzzles.map(p => ({
      id: p.id,
      status: p.status,
      pointsAwarded: p.pointsAwarded,
      targetObject: p.targetObject
    }))
  });
};
