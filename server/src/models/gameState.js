export const state = {
  games: new Map() // Maps gameId to game object
};

/*
Game Object Structure:
{
  id: string,
  startTime: Date,
  endTime: Date | null,
  puzzles: [
    {
      id: string,
      riddle: string,
      targetObject: string, // canonical answer
      difficulty: string,
      hint: string,
      status: 'pending' | 'completed',
      pointsAwarded: number,
      revealedEarly: boolean
    }
  ],
  score: number,
  status: 'active' | 'completed' | 'expired'
}
*/
