import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameInfo } from '../lib/gameDetection/types';

interface GameState {
  credits: number;
  upgrades: Upgrade[];
  userGames: GameInfo[];
  games: GameInfo[];
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  purchaseUpgrade: (upgradeId: string) => void;
  getPlayerLevel: () => number;
  setGames: (games: GameInfo[]) => void;
  updateGame: (gameId: string, updates: Partial<GameInfo>) => void;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  level: number;
  maxLevel: number;
  effect: number;
  category: 'performance' | 'network' | 'security' | 'optimization';
  icon: string;
  unlockLevel?: number;
  isPro?: boolean;
}

const initialUpgrades: Upgrade[] = [
  {
    id: 'cpu_optimization',
    name: 'CPU Optimization',
    description: 'Improves overall system performance and reduces latency',
    baseCost: 100,
    level: 0,
    maxLevel: 10,
    effect: 0.05,
    category: 'performance',
    icon: 'Cpu'
  },
  {
    id: 'network_routing',
    name: 'Smart Network Routing',
    description: 'Optimizes network paths for better connection stability',
    baseCost: 150,
    level: 0,
    maxLevel: 8,
    effect: 0.08,
    category: 'network',
    icon: 'Network'
  },
  {
    id: 'memory_boost',
    name: 'Memory Boost',
    description: 'Enhances memory management and reduces stuttering',
    baseCost: 200,
    level: 0,
    maxLevel: 5,
    effect: 0.1,
    category: 'performance',
    icon: 'Zap',
    unlockLevel: 2
  },
  {
    id: 'ddos_protection',
    name: 'DDoS Protection',
    description: 'Advanced security against network attacks',
    baseCost: 500,
    level: 0,
    maxLevel: 3,
    effect: 0.15,
    category: 'security',
    icon: 'Shield',
    isPro: true
  }
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      credits: 1000,
      upgrades: initialUpgrades,
      userGames: [],
      games: [],

      addCredits: (amount: number) => 
        set(state => ({ credits: state.credits + amount })),

      spendCredits: (amount: number) => {
        const state = get();
        if (state.credits >= amount) {
          set({ credits: state.credits - amount });
          return true;
        }
        return false;
      },

      purchaseUpgrade: (upgradeId: string) => {
        const state = get();
        const upgrade = state.upgrades.find(u => u.id === upgradeId);
        
        if (!upgrade || upgrade.isPro || upgrade.level >= upgrade.maxLevel) {
          return;
        }

        const playerLevel = get().getPlayerLevel();
        if (upgrade.unlockLevel && playerLevel < upgrade.unlockLevel) {
          return;
        }

        const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
        if (state.credits >= cost) {
          set(state => ({
            credits: state.credits - cost,
            upgrades: state.upgrades.map(u =>
              u.id === upgradeId ? { ...u, level: u.level + 1 } : u
            )
          }));
        }
      },

      getPlayerLevel: () => {
        const state = get();
        return Math.floor(state.upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0) / 3);
      },

      setGames: (games: GameInfo[]) => {
        set({ games });
      },

      updateGame: (gameId: string, updates: Partial<GameInfo>) => {
        set(state => ({
          games: state.games.map(game => 
            game.id === gameId ? { ...game, ...updates } : game
          )
        }));
      }
    }),
    {
      name: 'gamepath-ai-storage'
    }
  )
);