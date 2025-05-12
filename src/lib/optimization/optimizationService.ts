import { systemOptimizer } from '../systemOptimization/optimizer';
import { networkOptimizer } from '../networkOptimization/optimizer';
import { modelTrainer } from '../ml/modelTraining';
import { supabase } from '../supabase';

interface OptimizationMetrics {
  gameId: string;
  preMetrics: {
    fps: number;
    memoryUsage: number;
    loadTime: number;
    latency: number;
    packetLoss: number;
    stability: number;
  };
  optimizationType: string;
  changesApplied: Record<string, any>;
}

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

  public async startGameOptimization(gameId: string, optimizationType: string): Promise<string> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current game metrics
      const preMetrics = await this.collectGameMetrics(gameId);

      // Create optimization record
      const { data, error } = await supabase
        .from('optimization_metrics')
        .insert({
          game_id: gameId,
          user_id: user.id,
          timestamp: new Date().toISOString(),
          pre_metrics: preMetrics,
          optimization_type: optimizationType,
          changes_applied: this.getOptimizationChanges(optimizationType),
          status: 'in_progress'
        })
        .select('id')
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error starting game optimization:', error);
      throw error;
    }
  }

  public async completeGameOptimization(optimizationId: string): Promise<void> {
    try {
      // Get the optimization record
      const { data: optimization, error: fetchError } = await supabase
        .from('optimization_metrics')
        .select('*')
        .eq('id', optimizationId)
        .single();

      if (fetchError) throw fetchError;
      if (!optimization) throw new Error('Optimization record not found');

      // Collect post-optimization metrics
      const postMetrics = await this.collectGameMetrics(optimization.game_id);
      
      // Calculate improvement percentages
      const improvementPercentage = this.calculateImprovement(optimization.pre_metrics, postMetrics);

      // Update the optimization record
      const { error: updateError } = await supabase
        .from('optimization_metrics')
        .update({
          post_metrics: postMetrics,
          improvement_percentage: improvementPercentage,
          status: 'completed'
        })
        .eq('id', optimizationId);

      if (updateError) throw updateError;

      // Update user profile stats
      await this.updateUserOptimizationStats(optimization.user_id, improvementPercentage);
      
      // Update game optimization status
      await supabase
        .from('games')
        .update({ 
          optimized: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', optimization.game_id);

    } catch (error) {
      console.error('Error completing game optimization:', error);
      throw error;
    }
  }

  private async collectGameMetrics(gameId: string): Promise<any> {
    // In a real implementation, this would collect actual metrics
    // For now, we'll return mock data
    return {
      fps: 60 + Math.random() * 30,
      memoryUsage: 2000 + Math.random() * 1000,
      loadTime: 5 + Math.random() * 3,
      latency: 20 + Math.random() * 30,
      packetLoss: Math.random() * 2,
      stability: 85 + Math.random() * 15
    };
  }

  private getOptimizationChanges(optimizationType: string): Record<string, any> {
    // In a real implementation, this would return actual changes
    // For now, we'll return mock data based on optimization type
    switch (optimizationType) {
      case 'performance':
        return {
          cpuPriority: 'high',
          memoryManagement: 'optimized',
          diskCacheSize: 'increased',
          backgroundProcesses: 'reduced'
        };
      case 'network':
        return {
          packetOptimization: true,
          routeSelection: 'optimized',
          bufferSize: 'increased',
          tcpSettings: 'tuned'
        };
      case 'graphics':
        return {
          textureQuality: 'optimized',
          shaderCache: 'enabled',
          renderingPath: 'improved',
          antiAliasing: 'balanced'
        };
      default:
        return {
          general: 'optimized'
        };
    }
  }

  private calculateImprovement(preMetrics: any, postMetrics: any): number {
    // Calculate weighted improvement percentage
    const fpsImprovement = (postMetrics.fps - preMetrics.fps) / preMetrics.fps;
    const memoryImprovement = (preMetrics.memoryUsage - postMetrics.memoryUsage) / preMetrics.memoryUsage;
    const loadTimeImprovement = (preMetrics.loadTime - postMetrics.loadTime) / preMetrics.loadTime;
    const latencyImprovement = (preMetrics.latency - postMetrics.latency) / preMetrics.latency;
    const packetLossImprovement = (preMetrics.packetLoss - postMetrics.packetLoss) / (preMetrics.packetLoss || 0.01);
    const stabilityImprovement = (postMetrics.stability - preMetrics.stability) / preMetrics.stability;

    // Weighted average (weights should sum to 1)
    const weightedImprovement = 
      fpsImprovement * 0.3 + 
      memoryImprovement * 0.15 + 
      loadTimeImprovement * 0.15 + 
      latencyImprovement * 0.2 + 
      packetLossImprovement * 0.1 + 
      stabilityImprovement * 0.1;

    // Convert to percentage and round to 2 decimal places
    return Math.round(weightedImprovement * 100 * 100) / 100;
  }

  private async updateUserOptimizationStats(userId: string, improvementPercentage: number): Promise<void> {
    try {
      // Get current user profile
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('games_optimized, average_improvement')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!profile) throw new Error('User profile not found');

      // Calculate new average improvement
      const newGamesOptimized = profile.games_optimized + 1;
      const newAverageImprovement = 
        ((profile.average_improvement * profile.games_optimized) + improvementPercentage) / newGamesOptimized;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          games_optimized: newGamesOptimized,
          average_improvement: Math.round(newAverageImprovement * 100) / 100,
          xp: profile.xp + Math.round(improvementPercentage), // Award XP based on improvement
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating user optimization stats:', error);
      throw error;
    }
  }
}

export const optimizationService = OptimizationService.getInstance();