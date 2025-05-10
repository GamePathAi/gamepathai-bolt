import { systemOptimizer } from '../systemOptimization/optimizer';
import { networkOptimizer } from '../networkOptimization/optimizer';
import { modelTrainer } from '../ml/modelTraining';

class OptimizationService {
  private static instance: OptimizationService;

  private constructor() {}

  public static getInstance(): OptimizationService {
    if (!OptimizationService.instance) {
      OptimizationService.instance = new OptimizationService();
    }
    return OptimizationService.instance;
  }

  public async optimizeSystem() {
    try {
      // System optimization
      const systemResult = await systemOptimizer.optimize();

      // Network optimization
      const networkResult = await networkOptimizer.optimizeRoute();

      // Train and update ML model
      await modelTrainer.trainModel({
        architecture: 'mlp',
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 50,
          layers: [64, 32, 16, 1]
        },
        version: '1.0.0'
      });

      return {
        system: systemResult,
        network: networkResult,
        success: true
      };
    } catch (error) {
      console.error('Optimization error:', error);
      throw error;
    }
  }

  public async getOptimizationStatus() {
    return {
      systemStatus: await systemOptimizer.getMetrics(),
      networkStatus: await networkOptimizer.getMetrics(),
      modelStatus: await modelTrainer.getMetrics()
    };
  }
}

export const optimizationService = OptimizationService.getInstance();