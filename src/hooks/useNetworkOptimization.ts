import { useState, useEffect, useCallback } from 'react';
import { networkOptimizer } from '../lib/networkOptimization/optimizer';

export function useNetworkOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startOptimization = useCallback(async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await networkOptimizer.optimizeRoute();
      setOptimizationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  useEffect(() => {
    // Cleanup function
    return () => {
      // Any cleanup needed
    };
  }, []);

  return {
    isOptimizing,
    currentMetrics,
    optimizationResult,
    error,
    startOptimization
  };
}