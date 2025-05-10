import { create } from 'zustand';
import { authService } from '../lib/auth/authService';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      await authService.signIn(email, password);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign in' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      await authService.signUp(email, password);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign up' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign out' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await authService.resetPassword(email);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reset password' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true, error: null });
    try {
      await authService.updatePassword(newPassword);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update password' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setUser: (user) => set({ user, loading: false }),
  clearError: () => set({ error: null }),
}));