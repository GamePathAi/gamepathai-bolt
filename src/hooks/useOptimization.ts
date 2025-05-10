import { useState, useCallback } from 'react';
import { optimizationService } from '../lib/optimization/optimizationService';

export function useOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startOptimization = useCallback(async () => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);

    try {
      const result = await optimizationService.optimizeSystem();
      setProgress(100);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const getStatus = useCallback(async () => {
    try {
      return await optimizationService.getOptimizationStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get status');
      throw err;
    }
  }, []);

  return {
    isOptimizing,
    progress,
    error,
    startOptimization,
    getStatus
  };
}