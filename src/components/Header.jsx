import { useAuth } from '../context/AuthContext';

export default function Header({ currentView, setCurrentView }) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="nav">
      <div className="nav-links">
        {user && (
          <button
            className={`nav-link ${currentView === 'create' ? 'active' : ''}`}
            onClick={() => setCurrentView('create')}
          >
            Create
          </button>
        )}
        <button
          className={`nav-link ${currentView === 'feed' ? 'active' : ''}`}
          onClick={() => setCurrentView('feed')}
        >
          Feed
        </button>
      </div>
      <div className="auth-section">
        {user ? (
          <>
            <div className="user-info">
              <span>{user.email || 'User'}</span>
            </div>
            <button className="btn-auth" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button className="btn-auth" onClick={() => setCurrentView('auth')}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

