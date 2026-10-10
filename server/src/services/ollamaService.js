export const generatePuzzle = async (existingObjects = []) => {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const MODEL_NAME = process.env.MODEL_NAME || 'gemma3:4b';
  
  const avoidList = existingObjects.length > 0 ? `Do NOT pick these objects: ${existingObjects.join(', ')}.` : '';
  const prompt = `You are a creative puzzle master for a real-world scavenger hunt game called Touch Grass.
Generate a JSON object of exactly 1 unique puzzle for a common, safe outdoor object (e.g. leaf, tree, flower, rock, bench). 
Do NOT pick objects that are dangerous or inside private buildings. ${avoidList}
The puzzle MUST have this JSON structure:
{
  "id": "unique-string-id",
  "riddle": "the riddle text, max 3 sentences",
  "targetObject": "the canonical object name, e.g., 'pinecone'",
  "difficulty": "Easy" or "Medium" or "Hard",
  "hint": "a helpful hint that doesn't give away the exact name"
}

Return ONLY valid JSON and nothing else.`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(300000), // 5 min timeout for CPU inference
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });
    
    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    const resultJson = JSON.parse(data.response);
    if (!resultJson.id || !resultJson.targetObject) {
        throw new Error('Invalid puzzle data received');
    }
    return resultJson;
  } catch (err) {
    console.error('Error generating puzzle:', err);
    throw new Error('Failed to generate puzzle from AI');
  }
};

export const verifyPhoto = async (imageBuffer, mimeType, expectedObject) => {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const MODEL_NAME = process.env.MODEL_NAME || 'gemma3:4b';

  const base64Image = imageBuffer.toString('base64');
  
  const prompt = `You are an AI verification assistant. 
Is the specific object "${expectedObject}" clearly visible in this image?
Reply in JSON format:
{
  "match": true/false,
  "confidence": number from 0 to 1,
  "explanation": "short reason"
}`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(300000), // 5 min timeout for CPU vision inference
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        images: [base64Image],
        stream: false,
        format: 'json'
      })
    });
    
    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    const resultJson = JSON.parse(data.response);
    return resultJson;
  } catch (err) {
    console.error('Error verifying photo:', err);
    throw new Error('Failed to verify photo via AI');
  }
};
