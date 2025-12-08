import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import MemeGenerator from './components/MemeGenerator';
import MemeFeed from './components/MemeFeed';
import Auth from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function AppContent() {
  const [currentView, setCurrentView] = useState('feed');
  const { user, isLoading } = useAuth();

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="app-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to create, show auth
  const showAuth = !user && currentView === 'create';

  const handlePostSuccess = () => {
    setCurrentView('feed');
  };

  if (showAuth) {
    return (
      <div className="app-wrapper">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <Auth />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      {currentView === 'auth' && <Auth />}
      {currentView === 'create' && user && <MemeGenerator onPostSuccess={handlePostSuccess} />}
      {currentView === 'feed' && <MemeFeed />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

