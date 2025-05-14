import { useState, useEffect, useCallback } from 'react';
import { monitoringService } from '../lib/monitoring/monitoringService';
import type { SystemMetrics } from '../lib/systemOptimization/optimizer';
import { systemOptimizer } from '../lib/systemOptimization/optimizer';

export function useSystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [maxHistoryLength, setMaxHistoryLength] = useState(100);

  useEffect(() => {
    // Iniciar monitoramento automaticamente
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, []);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Iniciar monitoramento no serviço
    monitoringService.startMonitoring();
    
    // Configurar listener para atualizações de métricas
    const unsubscribe = monitoringService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setHistory(prev => {
        const newHistory = [...prev, newMetrics];
        if (newHistory.length > maxHistoryLength) {
          return newHistory.slice(-maxHistoryLength);
        }
        return newHistory;
      });
    });
    
    // Retornar função de limpeza
    return () => {
      unsubscribe();
      monitoringService.stopMonitoring();
    };
  }, [isMonitoring, maxHistoryLength]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    monitoringService.stopMonitoring();
  }, [isMonitoring]);

  const getSystemInfo = useCallback(async () => {
    try {
      const info = await monitoringService.getMetrics();
      setMetrics(info);
      return info;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao obter informações do sistema');
      return null;
    }
  }, []);

  const optimizeSystem = useCallback(async () => {
    try {
      const result = await systemOptimizer.optimize();
      
      // Atualizar métricas após otimização
      await getSystemInfo();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao otimizar sistema');
      throw err;
    }
  }, [getSystemInfo]);

  return {
    metrics,
    isMonitoring,
    error,
    history,
    startMonitoring,
    stopMonitoring,
    getSystemInfo,
    optimizeSystem,
    setMaxHistoryLength
  };
}