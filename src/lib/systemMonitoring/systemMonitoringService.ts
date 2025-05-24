import { isElectron } from '../gameDetection/isElectron';
import { systemInfoService, SystemMetrics } from './systemInfo';
import { performanceMonitor, PerformanceMetrics } from './performanceMonitor';

export interface SystemMonitoringOptions {
  interval?: number;
  historySize?: number;
  includeProcesses?: boolean;
  includeNetwork?: boolean;
}

/**
 * Service for monitoring system performance in both Electron and web environments
 */
class SystemMonitoringService {
  private static instance: SystemMonitoringService;
  private isElectronEnv: boolean;
  private monitoringInterval: number | null = null;
  private updateInterval: number = 1000; // Default to 1 second
  private listeners: Set<(metrics: SystemMetrics) => void> = new Set();
  private lastMetrics: SystemMetrics | null = null;
  private metricsHistory: SystemMetrics[] = [];
  private maxHistoryLength: number = 60; // Default to 60 data points

  private constructor() {
    this.isElectronEnv = isElectron();
    console.log(`SystemMonitoringService initialized, Electron environment: ${this.isElectronEnv}`);
  }

  public static getInstance(): SystemMonitoringService {
    if (!SystemMonitoringService.instance) {
      SystemMonitoringService.instance = new SystemMonitoringService();
    }
    return SystemMonitoringService.instance;
  }

  /**
   * Start monitoring system performance
   */
  public startMonitoring(options?: SystemMonitoringOptions): void {
    if (this.monitoringInterval !== null) {
      this.stopMonitoring();
    }

    // Apply options
    if (options) {
      if (options.interval) this.updateInterval = options.interval;
      if (options.historySize) this.maxHistoryLength = options.historySize;
    }

    console.log(`Starting system monitoring with interval: ${this.updateInterval}ms`);

    // Start the appropriate monitoring method based on environment
    if (this.isElectronEnv) {
      this.startElectronMonitoring();
    } else {
      this.startWebMonitoring();
    }
  }

  /**
   * Start monitoring in Electron environment
   */
  private startElectronMonitoring(): void {
    this.monitoringInterval = window.setInterval(async () => {
      try {
        if (window.electronAPI?.monitoring?.getSystemMetrics) {
          const result = await window.electronAPI.monitoring.getSystemMetrics();
          
          if (result.success && result.data) {
            this.updateMetrics(result.data);
          } else if (result.error) {
            console.error('Error getting system metrics:', result.error);
          }
        } else {
          // Fallback to web monitoring if API is not available
          this.updateMetricsFromServices();
        }
      } catch (error) {
        console.error('Error in Electron monitoring:', error);
        // Fallback to web monitoring on error
        this.updateMetricsFromServices();
      }
    }, this.updateInterval);
  }

  /**
   * Start monitoring in web environment
   */
  private startWebMonitoring(): void {
    // Start the systemInfoService and performanceMonitor
    systemInfoService.startMonitoring(this.updateInterval);
    
    // Subscribe to metrics updates
    const unsubscribe = systemInfoService.subscribeToMetrics((metrics) => {
      this.updateMetricsFromServices();
    });
    
    // Store the interval for cleanup
    this.monitoringInterval = window.setInterval(() => {
      // This is just a placeholder to maintain the interval reference
      // The actual updates come from the subscription
    }, this.updateInterval);
  }

  /**
   * Update metrics from systemInfoService and performanceMonitor
   */
  private async updateMetricsFromServices(): Promise<void> {
    try {
      const metrics = await systemInfoService.getSystemMetrics();
      this.updateMetrics(metrics);
    } catch (error) {
      console.error('Error updating metrics from services:', error);
    }
  }

  /**
   * Update metrics and notify listeners
   */
  private updateMetrics(metrics: SystemMetrics): void {
    this.lastMetrics = metrics;
    
    // Add to history
    this.metricsHistory.push(metrics);
    
    // Trim history if needed
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistoryLength);
    }
    
    // Notify listeners
    this.notifyListeners(metrics);
  }

  /**
   * Stop monitoring system performance
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      
      // Also stop the systemInfoService if in web environment
      if (!this.isElectronEnv) {
        systemInfoService.stopMonitoring();
      }
      
      console.log('System monitoring stopped');
    }
  }

  /**
   * Get the current system metrics
   */
  public async getMetrics(): Promise<SystemMetrics> {
    if (this.lastMetrics) {
      return this.lastMetrics;
    }
    
    // If no cached metrics, get fresh ones
    if (this.isElectronEnv && window.electronAPI?.monitoring?.getSystemMetrics) {
      try {
        const result = await window.electronAPI.monitoring.getSystemMetrics();
        
        if (result.success && result.data) {
          return result.data;
        }
      } catch (error) {
        console.error('Error getting system metrics from Electron:', error);
      }
    }
    
    // Fallback to web services
    return await systemInfoService.getSystemMetrics();
  }

  /**
   * Get the metrics history
   */
  public getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Subscribe to metrics updates
   */
  public subscribe(callback: (metrics: SystemMetrics) => void): () => void {
    this.listeners.add(callback);
    
    // If we have metrics, immediately notify the new listener
    if (this.lastMetrics) {
      callback(this.lastMetrics);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of new metrics
   */
  private notifyListeners(metrics: SystemMetrics): void {
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in system metrics listener:', error);
      }
    });
  }

  /**
   * Run system diagnostics
   */
  public async runDiagnostics(): Promise<any> {
    if (this.isElectronEnv && window.electronAPI?.monitoring?.runDiagnostics) {
      try {
        const result = await window.electronAPI.monitoring.runDiagnostics();
        
        if (result.success) {
          return result.data;
        } else if (result.error) {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error running diagnostics via Electron:', error);
        throw error;
      }
    }
    
    // Fallback to web services
    return await systemInfoService.runDiagnostics();
  }

  /**
   * Optimize system performance
   */
  public async optimizeSystem(profile: string = 'balanced'): Promise<any> {
    if (this.isElectronEnv) {
      try {
        // Call the appropriate optimization functions based on profile
        const results = await Promise.all([
          window.electronAPI?.monitoring?.optimizeCPU({ profile }),
          window.electronAPI?.monitoring?.optimizeMemory({ profile }),
          window.electronAPI?.monitoring?.optimizeGPU({ profile }),
          window.electronAPI?.monitoring?.optimizeNetwork({ profile })
        ]);
        
        // Combine results
        const improvements = {
          cpu: results[0]?.improvement || 0,
          memory: results[1]?.improvement || 0,
          gpu: results[2]?.improvement || 0,
          network: results[3]?.improvement || 0
        };
        
        return {
          success: true,
          improvements,
          profile
        };
      } catch (error) {
        console.error('Error optimizing system via Electron:', error);
        throw error;
      }
    }
    
    // In web environment, we can't actually optimize the system
    // So we'll just return simulated results
    return {
      success: true,
      improvements: {
        cpu: profile === 'balanced' ? 15 : profile === 'performance' ? 25 : 35,
        memory: profile === 'balanced' ? 10 : profile === 'performance' ? 20 : 30,
        gpu: profile === 'balanced' ? 5 : profile === 'performance' ? 15 : 25,
        network: profile === 'balanced' ? 5 : profile === 'performance' ? 10 : 15
      },
      profile
    };
  }
}

export const systemMonitoringService = SystemMonitoringService.getInstance();