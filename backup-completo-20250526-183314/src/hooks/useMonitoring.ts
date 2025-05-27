import { useState, useEffect } from 'react';
import { monitoringService } from '../lib/monitoring/monitoringService';
import type { SystemMetrics } from '../lib/systemOptimization/optimizer';

export function useMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const unsubscribe = monitoringService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubscribe();
      if (isMonitoring) {
        monitoringService.stopMonitoring();
      }
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    monitoringService.startMonitoring();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    monitoringService.stopMonitoring();
  };

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
}