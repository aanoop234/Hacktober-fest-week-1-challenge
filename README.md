# Touch Grass — AI Scavenger Hunt

An AI-powered real-world scavenger hunt for Hacktoberfest. This app encourages you to step outside, solve AI-generated riddles, and take photos of real-world objects. The AI verifies your submissions and scores your findings!

## Requirements
- Node.js (v18+ recommended)
- Ollama (running locally)
- A webcam/camera on your device (for photo submissions)

## Installation

1. **Clone the repository** (or download it).
2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```
3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   ```

## Model Setup
This application requires Ollama to be running locally with the `gemma3:4b` model.

1. Install [Ollama](https://ollama.com/).
2. Start the Ollama application.
3. Pull the required model:
   ```bash
   ollama pull gemma3:4b
   ```

## Running the Application

### 1. Start the Backend API
In the `server` directory:
```bash
npm run dev
```
The server will run on http://localhost:3001.

### 2. Start the Frontend
In a new terminal window, in the `client` directory:
```bash
npm run dev
```
The frontend will be accessible at http://localhost:5173.

## Playing the Game
1. Open the frontend URL in your browser or a mobile device connected to the same network (ensure HTTPS or localhost context for camera access).
2. The homepage will indicate if the AI systems (Ollama) are online.
3. Click "Start Hunt".
4. Read the riddle, go outside, find the object, and upload a photo!
5. You have 5 minutes to solve 5 puzzles.

## Testing
To run the automated backend tests:
```bash
cd server
npm test
```
*(Tests use mocked AI responses to ensure logic works independently of model performance).*
