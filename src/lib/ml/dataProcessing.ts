import { GameMetrics } from './dataCollection';
import { supabase } from '../supabase';

export class DataProcessor {
  private static instance: DataProcessor;
  
  private constructor() {}

  public static getInstance(): DataProcessor {
    if (!DataProcessor.instance) {
      DataProcessor.instance = new DataProcessor();
    }
    return DataProcessor.instance;
  }

  public async processMetrics(metrics: GameMetrics): Promise<void> {
    const validatedMetrics = await this.validateMetrics(metrics);
    const cleanedMetrics = await this.cleanMetrics(validatedMetrics);
    const normalizedMetrics = await this.normalizeMetrics(cleanedMetrics);
    
    await this.storeProcessedMetrics(normalizedMetrics);
  }

  private async validateMetrics(metrics: GameMetrics): Promise<GameMetrics> {
    // Implement validation logic
    return metrics;
  }

  private async cleanMetrics(metrics: GameMetrics): Promise<GameMetrics> {
    // Implement cleaning logic
    return metrics;
  }

  private async normalizeMetrics(metrics: GameMetrics): Promise<GameMetrics> {
    // Implement normalization logic
    return metrics;
  }

  private async storeProcessedMetrics(metrics: GameMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('processed_game_metrics')
        .insert(metrics);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing processed metrics:', error);
      throw error;
    }
  }
}

export const dataProcessor = DataProcessor.getInstance();