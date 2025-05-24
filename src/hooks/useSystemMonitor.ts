import { useState, useEffect, useCallback } from 'react';
import { systemInfoService, SystemMetrics } from '../lib/systemMonitoring/systemInfo';
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
        
        // Get initial hardware info
        const metrics = await systemInfoService.getSystemMetrics();
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
      const unsubscribe = systemInfoService.subscribeToMetrics((metrics) => {
        setCurrentMetrics(prev => {
          if (!prev) return { hardware: hardwareInfo!, performance: metrics, timestamp: Date.now() };
          return { ...prev, performance: metrics, timestamp: Date.now() };
        });
        
        setMetricsHistory(prev => {
          const newHistory = [...prev, metrics];
          // Limit history size
          const historySize = options.historySize || 60;
          if (newHistory.length > historySize) {
            return newHistory.slice(-historySize);
          }
          return newHistory;
        });
      });
      
      // Start the monitoring service
      systemInfoService.startMonitoring(options.interval);
      setIsMonitoring(true);
      
      // Return cleanup function
      return () => {
        unsubscribe();
        systemInfoService.stopMonitoring();
        setIsMonitoring(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start monitoring';
      setError(errorMessage);
      console.error('Error starting monitoring:', err);
      return () => {};
    }
  }, [isMonitoring, hardwareInfo, options.interval, options.historySize]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    systemInfoService.stopMonitoring();
    setIsMonitoring(false);
  }, [isMonitoring]);

  // Refresh hardware info
  const refreshHardwareInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const metrics = await systemInfoService.getSystemMetrics();
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
      
      const diagnostics = await systemInfoService.runDiagnostics();
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
    runDiagnostics
  };
}