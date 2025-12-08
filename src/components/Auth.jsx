import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { signInWithEmail, verifyMagicCode, signInWithGoogle, signInWithGithub } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signInWithEmail(email);
      setCodeSent(true);
      setSuccess('Check your email for a magic code!');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyMagicCode(email, code);
      setSuccess('Successfully signed in!');
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'github') {
        await signInWithGithub();
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (codeSent) {
    return (
      <div className="auth-container">
        <h1 className="auth-title">Enter Magic Code</h1>
        <p className="auth-subtitle">
          We sent a code to {email}. Enter it below to sign in.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

        <form className="auth-form" onSubmit={handleCodeSubmit}>
          <input
            type="text"
            className="auth-input"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            disabled={loading}
            maxLength={6}
            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
          />
          <button type="submit" className="btn-primary" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setCode('');
              setError('');
              setSuccess('');
            }}
            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1 className="auth-title">Sign In</h1>
      <p className="auth-subtitle">
        Sign in to post and upvote memes
      </p>

      {error && <div className="error-message">{error}</div>}
      {success && <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

      <form className="auth-form" onSubmit={handleEmailSubmit}>
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending code...' : 'Send Magic Code'}
        </button>
      </form>

      <div className="social-buttons">
        <button
          type="button"
          className="btn-social"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
        >
          <span>Continue with Google</span>
        </button>
        <button
          type="button"
          className="btn-social"
          onClick={() => handleSocialLogin('github')}
          disabled={loading}
        >
          <span>Continue with GitHub</span>
        </button>
      </div>
    </div>
  );
}

