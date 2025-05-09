import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Game {
  id: string;
  name: string;
  platform: string;
  process_name: string | null;
  install_path: string | null;
}

interface UserGame {
  id: string;
  game_id: string;
  last_played: string | null;
  optimized: boolean;
  settings: Record<string, any>;
  game: Game;
}

interface GameState {
  games: Game[];
  userGames: UserGame[];
  loading: boolean;
  error: string | null;
  fetchGames: () => Promise<void>;
  fetchUserGames: () => Promise<void>;
  optimizeGame: (gameId: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  userGames: [],
  loading: false,
  error: null,

  fetchGames: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*');

      if (error) throw error;
      set({ games: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchUserGames: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          *,
          game:games(*)
        `);

      if (error) throw error;
      set({ userGames: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  optimizeGame: async (gameId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('user_games')
        .update({ optimized: true })
        .eq('game_id', gameId);

      if (error) throw error;
      
      // Refresh user games after optimization
      await get().fetchUserGames();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));