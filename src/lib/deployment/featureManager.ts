import { supabase } from '../supabase';

interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  stage: 'internal' | 'beta' | 'production';
  metrics: {
    successRate: number;
    errorRate: number;
    latency: number;
    userSatisfaction: number;
  };
  abTest?: {
    enabled: boolean;
    controlGroupSize: number;
    variants: string[];
  };
  fallback: {
    enabled: boolean;
    threshold: {
      errorRate: number;
      latency: number;
    };
    strategy: 'graceful_degradation' | 'feature_disable' | 'rollback';
  };
}

class FeatureManager {
  private static instance: FeatureManager;
  private features: Map<string, FeatureConfig> = new Map();
  private metricsBuffer: any[] = [];

  private constructor() {
    this.initializeFeatures();
    this.startMetricsCollection();
  }

  public static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager();
    }
    return FeatureManager.instance;
  }

  private async initializeFeatures() {
    try {
      const { data, error } = await supabase
        .from('feature_configs')
        .select('*');

      if (error) throw error;

      data?.forEach(feature => {
        this.features.set(feature.id, feature);
      });
    } catch (error) {
      console.error('Error initializing features:', error);
    }
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.flushMetrics();
    }, 60000); // Flush every minute
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const { error } = await supabase
        .from('feature_metrics')
        .insert(this.metricsBuffer);

      if (error) throw error;
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  public async updateFeatureStage(featureId: string, stage: FeatureConfig['stage']) {
    const feature = this.features.get(featureId);
    if (!feature) throw new Error('Feature not found');

    const metrics = await this.evaluateFeatureMetrics(featureId);
    if (!this.meetsStageRequirements(metrics, stage)) {
      throw new Error('Feature does not meet requirements for stage advancement');
    }

    try {
      const { error } = await supabase
        .from('feature_configs')
        .update({ stage })
        .eq('id', featureId);

      if (error) throw error;
      feature.stage = stage;
      this.features.set(featureId, feature);
    } catch (error) {
      console.error('Error updating feature stage:', error);
      throw error;
    }
  }

  public async updateRolloutPercentage(featureId: string, percentage: number) {
    const feature = this.features.get(featureId);
    if (!feature) throw new Error('Feature not found');

    try {
      const { error } = await supabase
        .from('feature_configs')
        .update({ rolloutPercentage: percentage })
        .eq('id', featureId);

      if (error) throw error;
      feature.rolloutPercentage = percentage;
      this.features.set(featureId, feature);
    } catch (error) {
      console.error('Error updating rollout percentage:', error);
      throw error;
    }
  }

  public async configureABTest(featureId: string, config: FeatureConfig['abTest']) {
    const feature = this.features.get(featureId);
    if (!feature) throw new Error('Feature not found');

    try {
      const { error } = await supabase
        .from('feature_configs')
        .update({ abTest: config })
        .eq('id', featureId);

      if (error) throw error;
      feature.abTest = config;
      this.features.set(featureId, feature);
    } catch (error) {
      console.error('Error configuring A/B test:', error);
      throw error;
    }
  }

  public async configureFallback(featureId: string, config: FeatureConfig['fallback']) {
    const feature = this.features.get(featureId);
    if (!feature) throw new Error('Feature not found');

    try {
      const { error } = await supabase
        .from('feature_configs')
        .update({ fallback: config })
        .eq('id', featureId);

      if (error) throw error;
      feature.fallback = config;
      this.features.set(featureId, feature);
    } catch (error) {
      console.error('Error configuring fallback:', error);
      throw error;
    }
  }

  public isFeatureEnabled(featureId: string, userId: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature || !feature.enabled) return false;

    // Check rollout percentage
    const userHash = this.hashUserId(userId);
    const userPercentile = userHash % 100;
    if (userPercentile > feature.rolloutPercentage) return false;

    // Check A/B test assignment
    if (feature.abTest?.enabled) {
      const isInControlGroup = this.isUserInControlGroup(userId, feature.abTest.controlGroupSize);
      if (isInControlGroup) return false;
    }

    return true;
  }

  public async recordMetric(featureId: string, metric: any) {
    this.metricsBuffer.push({
      featureId,
      ...metric,
      timestamp: new Date(),
    });

    // Check fallback conditions
    const feature = this.features.get(featureId);
    if (feature?.fallback.enabled) {
      await this.checkFallbackConditions(featureId, metric);
    }
  }

  private async checkFallbackConditions(featureId: string, metric: any) {
    const feature = this.features.get(featureId);
    if (!feature) return;

    const { threshold } = feature.fallback;
    const shouldTriggerFallback = 
      metric.errorRate > threshold.errorRate ||
      metric.latency > threshold.latency;

    if (shouldTriggerFallback) {
      await this.triggerFallback(featureId);
    }
  }

  private async triggerFallback(featureId: string) {
    const feature = this.features.get(featureId);
    if (!feature) return;

    switch (feature.fallback.strategy) {
      case 'graceful_degradation':
        await this.updateRolloutPercentage(featureId, 0);
        break;
      case 'feature_disable':
        await this.disableFeature(featureId);
        break;
      case 'rollback':
        await this.rollbackFeature(featureId);
        break;
    }
  }

  private async evaluateFeatureMetrics(featureId: string) {
    const { data, error } = await supabase
      .from('feature_metrics')
      .select('*')
      .eq('featureId', featureId)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return this.calculateMetrics(data || []);
  }

  private calculateMetrics(metrics: any[]) {
    // Implement metrics calculation
    return {
      successRate: 0,
      errorRate: 0,
      latency: 0,
      userSatisfaction: 0,
    };
  }

  private meetsStageRequirements(metrics: any, stage: FeatureConfig['stage']): boolean {
    switch (stage) {
      case 'internal':
        return metrics.successRate > 0.9;
      case 'beta':
        return metrics.successRate > 0.95 && metrics.userSatisfaction > 0.8;
      case 'production':
        return metrics.successRate > 0.99 && metrics.userSatisfaction > 0.9;
      default:
        return false;
    }
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private isUserInControlGroup(userId: string, controlGroupSize: number): boolean {
    return (this.hashUserId(userId) % 100) < controlGroupSize;
  }

  private async disableFeature(featureId: string) {
    // Implement feature disable logic
  }

  private async rollbackFeature(featureId: string) {
    // Implement feature rollback logic
  }
}

export const featureManager = FeatureManager.getInstance();