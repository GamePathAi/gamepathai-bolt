// src/contexts/FpsBoosterContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface FpsBoosterContextType {
  isBoostEnabled: boolean;
  selectedMode: 'balanced' | 'performance' | 'extreme';
  processOptimization: boolean;
  memoryOptimization: boolean;
  gpuOptimization: boolean;
  priorityBoost: boolean;
  setBoostEnabled: (enabled: boolean) => void;
  setSelectedMode: (mode: 'balanced' | 'performance' | 'extreme') => void;
  setProcessOptimization: (enabled: boolean) => void;
  setMemoryOptimization: (enabled: boolean) => void;
  setGpuOptimization: (enabled: boolean) => void;
  setPriorityBoost: (enabled: boolean) => void;
}

const FpsBoosterContext = createContext<FpsBoosterContextType | undefined>(undefined);

export const FpsBoosterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBoostEnabled, setBoostEnabled] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'balanced' | 'performance' | 'extreme'>('performance');
  const [processOptimization, setProcessOptimization] = useState(true);
  const [memoryOptimization, setMemoryOptimization] = useState(true);
  const [gpuOptimization, setGpuOptimization] = useState(true);
  const [priorityBoost, setPriorityBoost] = useState(false);

  return (
    <FpsBoosterContext.Provider
      value={{
        isBoostEnabled,
        selectedMode,
        processOptimization,
        memoryOptimization,
        gpuOptimization,
        priorityBoost,
        setBoostEnabled,
        setSelectedMode,
        setProcessOptimization,
        setMemoryOptimization,
        setGpuOptimization,
        setPriorityBoost,
      }}
    >
      {children}
    </FpsBoosterContext.Provider>
  );
};

export const useFpsBooster = () => {
  const context = useContext(FpsBoosterContext);
  if (!context) {
    throw new Error('useFpsBooster must be used within a FpsBoosterProvider');
  }
  return context;
};
