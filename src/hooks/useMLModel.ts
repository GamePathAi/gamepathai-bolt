import { useState, useEffect, useCallback } from 'react';
import * as Comlink from 'comlink';
import type { ModelWorker } from '../lib/ml/modelWorker';

export function useMLModel(modelUrl: string) {
  const [worker, setWorker] = useState<Comlink.Remote<ModelWorker> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initWorker = async () => {
      try {
        const workerUrl = new URL('../lib/ml/modelWorker', import.meta.url);
        const worker = new Worker(workerUrl, { type: 'module' });
        const workerApi = Comlink.wrap<ModelWorker>(worker);
        
        await workerApi.init(modelUrl);
        setWorker(workerApi);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize model'));
        setIsLoading(false);
      }
    };

    initWorker();

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [modelUrl]);

  const predict = useCallback(async (input: Float32Array, inputShape: number[]) => {
    if (!worker) {
      throw new Error('Model not initialized');
    }

    try {
      return await worker.predict(input, inputShape);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Prediction failed');
    }
  }, [worker]);

  return {
    predict,
    isLoading,
    error
  };
}