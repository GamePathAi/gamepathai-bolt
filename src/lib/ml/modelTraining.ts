import { create } from 'zustand';
import * as tf from '@tensorflow/tfjs';
import * as tfWasm from '@tensorflow/tfjs-backend-wasm';
import { supabase } from '../supabase';
import type { GameMetrics } from './dataCollection';

interface ModelConfig {
  architecture: string;
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    layers: number[];
  };
  version: string;
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  validationLoss: number;
  validationAccuracy: number;
  timestamp: number;
}

interface ModelArtifact {
  weights: Float32Array[];
  config: ModelConfig;
  metrics: TrainingMetrics[];
  timestamp: number;
}

interface TrainingState {
  isTraining: boolean;
  progress: number;
  currentMetrics: TrainingMetrics | null;
  error: string | null;
}

export const useTrainingStore = create<TrainingState>(() => ({
  isTraining: false,
  progress: 0,
  currentMetrics: null,
  error: null,
}));

class ModelTrainer {
  private static instance: ModelTrainer;
  private model: tf.LayersModel | null = null;
  private wasmReady: boolean = false;

  private constructor() {
    this.initializeWasm();
  }

  public static getInstance(): ModelTrainer {
    if (!ModelTrainer.instance) {
      ModelTrainer.instance = new ModelTrainer();
    }
    return ModelTrainer.instance;
  }

  private async initializeWasm() {
    if (!this.wasmReady) {
      await tf.setBackend('wasm');
      await tfWasm.setWasmPaths('/');
      this.wasmReady = true;
    }
  }

  private async buildModel(config: ModelConfig): Promise<tf.LayersModel> {
    const { layers } = config.hyperparameters;
    
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: layers[0],
      inputShape: [50], // Adjust based on input features
      activation: 'relu'
    }));

    // Hidden layers
    for (let i = 1; i < layers.length - 1; i++) {
      model.add(tf.layers.dense({
        units: layers[i],
        activation: 'relu'
      }));
      
      // Add dropout for regularization
      model.add(tf.layers.dropout({ rate: 0.2 }));
    }

    // Output layer
    model.add(tf.layers.dense({
      units: layers[layers.length - 1],
      activation: 'sigmoid'
    }));

    model.compile({
      optimizer: tf.train.adam(config.hyperparameters.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private async preprocessData(data: GameMetrics[]): Promise<{
    trainData: tf.Tensor,
    trainLabels: tf.Tensor,
    valData: tf.Tensor,
    valLabels: tf.Tensor
  }> {
    // Extract features and normalize
    const features = data.map(metrics => [
      ...this.normalizePerformanceMetrics(metrics.metrics.performance),
      ...this.normalizeNetworkMetrics(metrics.metrics.network),
      ...this.normalizeSystemMetrics(metrics)
    ]);

    const labels = data.map(metrics => 
      this.generateLabel(metrics.metrics.performance)
    );

    // Split into training and validation sets (80/20)
    const splitIndex = Math.floor(features.length * 0.8);
    
    return {
      trainData: tf.tensor2d(features.slice(0, splitIndex)),
      trainLabels: tf.tensor2d(labels.slice(0, splitIndex)),
      valData: tf.tensor2d(features.slice(splitIndex)),
      valLabels: tf.tensor2d(labels.slice(splitIndex))
    };
  }

  private normalizePerformanceMetrics(metrics: any): number[] {
    return [
      metrics.fps / 144, // Normalize FPS
      metrics.frameTime / 16.67, // Normalize frame time (60 FPS baseline)
      metrics.cpuUsage / 100,
      metrics.memoryUsage / 16384, // Normalize to 16GB
      metrics.gpuUsage / 100
    ];
  }

  private normalizeNetworkMetrics(metrics: any): number[] {
    return [
      metrics.latency / 100, // Normalize to 100ms baseline
      metrics.packetLoss,
      metrics.bandwidth / 1000, // Normalize to 1000 Mbps
      metrics.jitter / 20 // Normalize to 20ms baseline
    ];
  }

  private normalizeSystemMetrics(metrics: GameMetrics): number[] {
    // Extract and normalize system-level metrics
    return [
      metrics.timestamp / Date.now(), // Normalize timestamp
      // Add other system metrics as needed
    ];
  }

  private generateLabel(metrics: any): number[] {
    // Generate binary classification label based on performance thresholds
    return [Number(
      metrics.fps > 60 &&
      metrics.frameTime < 16.67 &&
      metrics.cpuUsage < 80
    )];
  }

  public async trainModel(config: ModelConfig): Promise<void> {
    const store = useTrainingStore.getState();
    if (store.isTraining) {
      throw new Error('Training is already in progress');
    }

    useTrainingStore.setState({ 
      isTraining: true, 
      progress: 0,
      error: null 
    });

    try {
      await this.initializeWasm();

      // Load training data
      const { data, error } = await supabase
        .from('game_metrics')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No training data available');
      }

      // Preprocess data
      const {
        trainData,
        trainLabels,
        valData,
        valLabels
      } = await this.preprocessData(data);

      // Build and compile model
      this.model = await this.buildModel(config);

      // Train model
      await this.model.fit(trainData, trainLabels, {
        epochs: config.hyperparameters.epochs,
        batchSize: config.hyperparameters.batchSize,
        validationData: [valData, valLabels],
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            const metrics: TrainingMetrics = {
              epoch,
              loss: logs?.loss || 0,
              accuracy: logs?.accuracy || 0,
              validationLoss: logs?.val_loss || 0,
              validationAccuracy: logs?.val_accuracy || 0,
              timestamp: Date.now()
            };

            const progress = ((epoch + 1) / config.hyperparameters.epochs) * 100;

            useTrainingStore.setState({
              progress,
              currentMetrics: metrics
            });

            // Store training metrics
            await this.storeTrainingMetrics(metrics);
          }
        }
      });

      // Save model artifacts
      await this.saveModelArtifacts();

    } catch (error) {
      useTrainingStore.setState({ 
        error: error instanceof Error ? error.message : 'Training failed' 
      });
      throw error;
    } finally {
      useTrainingStore.setState({ isTraining: false });
    }
  }

  private async storeTrainingMetrics(metrics: TrainingMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_metrics')
        .insert([metrics]);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing training metrics:', error);
    }
  }

  private async saveModelArtifacts(): Promise<void> {
    if (!this.model) return;

    try {
      const weights = await this.model.getWeights();
      const weightData = weights.map(w => new Float32Array(w.dataSync()));

      const { error } = await supabase
        .from('model_artifacts')
        .insert([{
          version: '1.0.0',
          weights: weightData,
          timestamp: Date.now()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving model artifacts:', error);
      throw error;
    }
  }

  public async predict(input: number[]): Promise<number[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const inputTensor = tf.tensor2d([input]);
    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    return Array.from(prediction.dataSync());
  }
}

export const modelTrainer = ModelTrainer.getInstance();