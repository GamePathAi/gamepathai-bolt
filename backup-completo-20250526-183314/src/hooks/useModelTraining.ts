import { useState, useCallback } from 'react';
import { modelTrainer } from '../lib/ml/modelTraining';

export function useModelTraining() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startTraining = useCallback(async () => {
    setIsTraining(true);
    setError(null);
    setProgress(0);

    try {
      await modelTrainer.trainModel({
        architecture: 'mlp',
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 100,
          layers: [64, 32, 16, 1]
        },
        version: '1.0.0'
      });
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during training');
    } finally {
      setIsTraining(false);
    }
  }, []);

  return {
    isTraining,
    progress,
    error,
    startTraining
  };
}