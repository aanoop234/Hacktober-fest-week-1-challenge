import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

let counter = 0;

jest.unstable_mockModule('../src/services/ollamaService.js', () => ({
  generatePuzzle: jest.fn(async () => {
    counter++;
    return { id: String(counter), riddle: 'R', targetObject: 'tree', difficulty: 'Easy', hint: 'H' };
  }),
  verifyPhoto: jest.fn(async (buf, mime, obj) => {
    if (obj === 'tree') return { match: true, confidence: 0.9, explanation: 'Looks like a tree' };
    return { match: false, confidence: 0.1, explanation: 'Not matching' };
  })
}));

const { state } = await import('../src/models/gameState.js');
const { default: apiRoutes } = await import('../src/routes/api.js');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Game Endpoints', () => {
  beforeEach(() => {
    state.games.clear();
    counter = 0;
  });

  test('POST /api/games generates 1 puzzle', async () => {
    const res = await request(app).post('/api/games');
    expect(res.status).toBe(201);
    expect(res.body.gameId).toBeDefined();
    expect(res.body.puzzles).toHaveLength(1);
  });

  test('POST /api/games/:gameId/next generates next puzzle only if current is completed', async () => {
    const res = await request(app).post('/api/games');
    const gId = res.body.gameId;

    // Try generating next when current is NOT completed
    const resNextFail = await request(app).post(`/api/games/${gId}/next`);
    expect(resNextFail.status).toBe(400);

    // Complete current
    const p1 = res.body.puzzles[0];
    await request(app).post(`/api/games/${gId}/puzzles/${p1.id}/pass`);

    // Generate next
    const resNextSuccess = await request(app).post(`/api/games/${gId}/next`);
    expect(resNextSuccess.status).toBe(200);
    expect(resNextSuccess.body.id).toBe('2');

    const resProgress = await request(app).get(`/api/games/${gId}`);
    expect(resProgress.body.puzzles).toHaveLength(2);
  });

  test('Verify photo awards points correctly and prevents double scoring', async () => {
    const resGame = await request(app).post('/api/games');
    const gId = resGame.body.gameId;
    const p1 = resGame.body.puzzles[0];

    const resSubmit = await request(app)
      .post(`/api/games/${gId}/puzzles/${p1.id}/submit`)
      .attach('photo', Buffer.from('fake'), 'test.jpg');
    
    expect(resSubmit.status).toBe(200);
    expect(resSubmit.body.correct).toBe(true);

    const resProgress = await request(app).get(`/api/games/${gId}`);
    expect(resProgress.body.score).toBe(1);

    const resSubmitAgain = await request(app)
      .post(`/api/games/${gId}/puzzles/${p1.id}/submit`)
      .attach('photo', Buffer.from('fake'), 'test.jpg');
    
    expect(resSubmitAgain.status).toBe(400);
  });
});
