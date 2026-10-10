import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ActiveGame from './pages/ActiveGame';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:gameId" element={<ActiveGame />} />
        <Route path="/game/:gameId/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
