import express from 'express';
import multer from 'multer';
import { 
  checkHealth, 
  createGame, 
  generateNextPuzzle,
  getGameProgress, 
  getPuzzle, 
  revealHint, 
  passPuzzle, 
  submitPhoto, 
  getResults 
} from '../controllers/gameController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.get('/health', checkHealth);
router.post('/games', createGame);
router.post('/games/:gameId/next', generateNextPuzzle);
router.get('/games/:gameId', getGameProgress);
router.get('/games/:gameId/puzzles/:puzzleId', getPuzzle);
router.post('/games/:gameId/puzzles/:puzzleId/hint', revealHint);
router.post('/games/:gameId/puzzles/:puzzleId/pass', passPuzzle);
router.post('/games/:gameId/puzzles/:puzzleId/submit', upload.single('photo'), submitPhoto);
router.get('/games/:gameId/results', getResults);

export default router;
