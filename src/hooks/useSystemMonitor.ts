import { useState, useEffect, useCallback } from 'react';
import { systemMonitoringService } from '../lib/systemMonitoring/systemMonitoringService';
import { SystemMetrics } from '../lib/systemMonitoring/systemInfo';
import { PerformanceMetrics } from '../lib/systemMonitoring/performanceMonitor';
import { HardwareInfo } from '../lib/systemMonitoring/hardwareDetection';

interface SystemMonitorOptions {
  interval?: number;
  autoStart?: boolean;
  historySize?: number;
}

export function useSystemMonitor(options: SystemMonitorOptions = {}) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize monitoring
  useEffect(() => {
    const initializeMonitor = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get initial metrics
        const metrics = await systemMonitoringService.getMetrics();
        setCurrentMetrics(metrics);
        setHardwareInfo(metrics.hardware);
        
        // Start monitoring if autoStart is true
        if (options.autoStart !== false) {
          startMonitoring();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize system monitor';
        setError(errorMessage);
        console.error('Error initializing system monitor:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMonitor();

    // Cleanup on unmount
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [options.autoStart]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    try {
      setError(null);
      
      // Subscribe to metrics updates
      const unsubscribe = systemMonitoringService.subscribe((metrics) => {
        setCurrentMetrics(metrics);
        setHardwareInfo(metrics.hardware);
        
        // Update metrics history
        setMetricsHistory(prev => {
          const newHistory = [...prev, metrics.performance];
          // Limit history size
          const historySize = options.historySize || 60;
          if (newHistory.length > historySize) {
            return newHistory.slice(-historySize);
          }
          return newHistory;
        });
      });
      
      // Start the monitoring service
      systemMonitoringService.startMonitoring({
        interval: options.interval,
        historySize: options.historySize
      });
      
      setIsMonitoring(true);
      
      // Return cleanup function
      return () => {
        unsubscribe();
        systemMonitoringService.stopMonitoring();
        setIsMonitoring(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start monitoring';
      setError(errorMessage);
      console.error('Error starting monitoring:', err);
      return () => {};
    }
  }, [isMonitoring, options.interval, options.historySize]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    systemMonitoringService.stopMonitoring();
    setIsMonitoring(false);
  }, [isMonitoring]);

  // Refresh hardware info
  const refreshHardwareInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const metrics = await systemMonitoringService.getMetrics();
      setCurrentMetrics(metrics);
      setHardwareInfo(metrics.hardware);
      
      return metrics.hardware;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh hardware info';
      setError(errorMessage);
      console.error('Error refreshing hardware info:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run system diagnostics
  const runDiagnostics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const diagnostics = await systemMonitoringService.runDiagnostics();
      return diagnostics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run diagnostics';
      setError(errorMessage);
      console.error('Error running diagnostics:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimize system
  const optimizeSystem = useCallback(async (profile: string = 'balanced') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await systemMonitoringService.optimizeSystem(profile);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize system';
      setError(errorMessage);
      console.error('Error optimizing system:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isMonitoring,
    isLoading,
    error,
    currentMetrics,
    metricsHistory,
    hardwareInfo,
    startMonitoring,
    stopMonitoring,
    refreshHardwareInfo,
    runDiagnostics,
    optimizeSystem
  };
}