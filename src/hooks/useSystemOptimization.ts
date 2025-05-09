import { useState, useCallback } from 'react';
import { systemOptimizer } from '../lib/systemOptimization/optimizer';

export function useSystemOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startOptimization = useCallback(async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await systemOptimizer.optimize();
      setOptimizationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  return {
    isOptimizing,
    optimizationResult,
    error,
    startOptimization
  };
}