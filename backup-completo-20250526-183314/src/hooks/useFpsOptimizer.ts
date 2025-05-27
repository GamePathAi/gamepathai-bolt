import { useState, useCallback } from 'react';
import { fpsOptimizer } from '../lib/fpsOptimization/fpsOptimizer';

export function useFpsOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLevel, setOptimizationLevel] = useState<'balanced' | 'performance' | 'extreme'>('performance');
  const [customSettings, setCustomSettings] = useState({
    processOptimization: true,
    memoryOptimization: true,
    gpuOptimization: true,
    priorityBoost: false,
  });
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizeGame = useCallback(async (gameId: string) => {
    if (isOptimizing) return null;
    
    setIsOptimizing(true);
    setError(null);
    
    try {
      // Converter configurações personalizadas para o formato esperado pelo otimizador
      const settings = {
        cpu: {
          priority: customSettings.priorityBoost ? 5 : 3,
          threadOptimization: customSettings.processOptimization
        },
        memory: {
          cleanerInterval: customSettings.memoryOptimization ? 3 : 0,
          pageFileOptimization: customSettings.memoryOptimization ? 2 : 0
        },
        gpu: {
          powerMode: customSettings.gpuOptimization ? 2 : 0,
          shaderCache: customSettings.gpuOptimization
        }
      };
      
      // Otimizar jogo
      const result = await fpsOptimizer.optimizeGame(gameId, optimizationLevel, settings);
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao otimizar jogo');
      }
      
      setOptimizationResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao otimizar jogo');
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, optimizationLevel, customSettings]);

  const updateOptimizationLevel = useCallback((level: 'balanced' | 'performance' | 'extreme') => {
    setOptimizationLevel(level);
  }, []);

  const updateCustomSettings = useCallback((settings: Partial<typeof customSettings>) => {
    setCustomSettings(prev => ({
      ...prev,
      ...settings
    }));
  }, []);

  return {
    isOptimizing,
    optimizationLevel,
    customSettings,
    optimizationResult,
    error,
    optimizeGame,
    updateOptimizationLevel,
    updateCustomSettings
  };
}