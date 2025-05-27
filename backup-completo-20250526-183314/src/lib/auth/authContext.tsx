import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from './authService';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setError(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    signIn: async (email: string, password: string) => {
      try {
        await authService.signIn(email, password);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed');
        throw err;
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        await authService.signUp(email, password);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed');
        throw err;
      }
    },
    signOut: async () => {
      try {
        await authService.signOut();
        setUser(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign out failed');
        throw err;
      }
    },
    resetPassword: async (email: string) => {
      try {
        await authService.resetPassword(email);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Password reset failed');
        throw err;
      }
    },
    updatePassword: async (newPassword: string) => {
      try {
        await authService.updatePassword(newPassword);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Password update failed');
        throw err;
      }
    },
    resendConfirmationEmail: async (email: string) => {
      try {
        await authService.resendConfirmationEmail(email);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resend confirmation email');
        throw err;
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}