import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Loading from './components/Loading';
import LandingPage from './components/LandingPage';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Reset loading state on route change or refresh
    setIsLoading(true);
    
    // Listen for page refresh
    const handleBeforeUnload = () => {
      setIsLoading(true);
      setKey(prev => prev + 1);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <Router>
      {isLoading ? (
        <Loading key={key} onLoadingComplete={handleLoadingComplete} />
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<LandingPage />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
