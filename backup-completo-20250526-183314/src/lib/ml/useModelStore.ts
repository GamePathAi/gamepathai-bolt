import { create } from 'zustand';
import type { ModelConfig } from './modelTraining';

interface ModelState {
  currentModel: string | null;
  modelConfigs: Record<string, ModelConfig>;
  trainingProgress: number;
  isTraining: boolean;
  error: string | null;
  setCurrentModel: (modelId: string) => void;
  updateTrainingProgress: (progress: number) => void;
  setTrainingStatus: (isTraining: boolean) => void;
  setError: (error: string | null) => void;
  addModelConfig: (config: ModelConfig) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  currentModel: null,
  modelConfigs: {},
  trainingProgress: 0,
  isTraining: false,
  error: null,

  setCurrentModel: (modelId) => set({ currentModel: modelId }),
  
  updateTrainingProgress: (progress) => set({ trainingProgress: progress }),
  
  setTrainingStatus: (isTraining) => set({ isTraining }),
  
  setError: (error) => set({ error }),
  
  addModelConfig: (config) => set((state) => ({
    modelConfigs: {
      ...state.modelConfigs,
      [config.version]: config,
    },
  })),
}));