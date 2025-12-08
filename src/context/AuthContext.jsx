import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../utils/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, isLoading } = db.useAuth();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setAuthLoading(false);
    }
  }, [isLoading]);

  const signInWithEmail = async (email) => {
    try {
      // InstantDB uses Magic Codes - sends a code to email
      await db.auth.sendMagicCode({ email });
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (email) => {
    try {
      // InstantDB uses Magic Codes - sends a code to email
      // Sign up and sign in use the same method
      await db.auth.sendMagicCode({ email });
    } catch (error) {
      throw error;
    }
  };

  const verifyMagicCode = async (email, code) => {
    try {
      // Verify the magic code and sign in
      await db.auth.signInWithMagicCode({ email, code });
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await db.auth.signInWithPopup('google');
    } catch (error) {
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      await db.auth.signInWithPopup('github');
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await db.auth.signOut();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading: authLoading,
    signInWithEmail,
    signUpWithEmail,
    verifyMagicCode,
    signInWithGoogle,
    signInWithGithub,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

