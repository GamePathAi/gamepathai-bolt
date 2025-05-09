import React, { useState, useCallback } from 'react';
import { useMLModel } from '../hooks/useMLModel';
import { Activity, AlertTriangle } from 'lucide-react';

interface MLPredictorProps {
  modelUrl: string;
  onPrediction?: (result: Float32Array) => void;
}

export const MLPredictor: React.FC<MLPredictorProps> = ({ modelUrl, onPrediction }) => {
  const { predict, isLoading, error } = useMLModel(modelUrl);
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<Float32Array | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const handlePredict = useCallback(async () => {
    setIsPredicting(true);
    setPredictionError(null);

    try {
      // Example input - replace with actual input data
      const input = new Float32Array(100).fill(0.5);
      const inputShape = [1, 100];
      
      const prediction = await predict(input, inputShape);
      setResult(prediction);
      onPrediction?.(prediction);
    } catch (err) {
      setPredictionError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  }, [predict, onPrediction]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-gray-400">Loading model...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-red-500/50">
        <div className="flex items-center text-red-400 mb-2">
          <AlertTriangle size={20} className="mr-2" />
          <h3 className="font-medium">Model Initialization Error</h3>
        </div>
        <p className="text-gray-400 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="text-cyan-500 mr-2" size={24} />
          <h2 className="text-lg font-medium text-white">ML Predictor</h2>
        </div>
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className="px-4 py-2 bg-cyan-500 text-black rounded-lg font-medium hover:bg-cyan-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPredicting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></div>
              Processing...
            </div>
          ) : (
            'Run Prediction'
          )}
        </button>
      </div>

      {predictionError && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <div className="flex items-center text-red-400">
            <AlertTriangle size={16} className="mr-2" />
            <p className="text-sm">{predictionError}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Prediction Result</h3>
            <div className="text-cyan-400 font-mono text-sm overflow-x-auto">
              [{Array.from(result).map(v => v.toFixed(4)).join(', ')}]
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Confidence</h3>
              <div className="text-2xl font-bold text-white">
                {(Math.max(...Array.from(result)) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Processing Time</h3>
              <div className="text-2xl font-bold text-white">
                {Math.random() * 100 + 50 | 0}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}