import { create } from 'zustand';
import type { SystemMetrics } from '../systemOptimization/optimizer';

interface MetricsState {
  metrics: SystemMetrics | null;
  history: SystemMetrics[];
  maxHistoryLength: number;
  addMetrics: (metrics: SystemMetrics) => void;
  clearHistory: () => void;
  setMaxHistoryLength: (length: number) => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  metrics: null,
  history: [],
  maxHistoryLength: 100,

  addMetrics: (metrics) => set((state) => {
    const newHistory = [
      ...state.history,
      metrics
    ].slice(-state.maxHistoryLength);

    return {
      metrics,
      history: newHistory,
    };
  }),

  clearHistory: () => set({ history: [] }),
  
  setMaxHistoryLength: (length) => set({ maxHistoryLength: length }),
}));