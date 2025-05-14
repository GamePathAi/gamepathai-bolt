import { useState, useEffect, useCallback } from 'react';
import { networkOptimizer } from '../lib/networkOptimization/optimizer';

export function useNetworkOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Verificar status inicial
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const metrics = await networkOptimizer.getMetrics();
        setIsConnected(metrics.isConnected);
        setCurrentMetrics(metrics);
        if (metrics.currentRoute) {
          setSelectedRoute(metrics.currentRoute.id);
        }
      } catch (err) {
        console.error('Erro ao verificar status da rede:', err);
      }
    };
    
    checkStatus();
  }, []);

  // Atualizar métricas periodicamente quando conectado
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(async () => {
      try {
        const metrics = await networkOptimizer.getMetrics();
        setCurrentMetrics(metrics);
      } catch (err) {
        console.error('Erro ao atualizar métricas de rede:', err);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isConnected]);

  const startOptimization = useCallback(async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await networkOptimizer.optimizeRoute();
      setOptimizationResult(result);
      setIsConnected(true);
      setSelectedRoute(result.selectedRoute.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na otimização de rede');
    } finally {
      setIsOptimizing(false);
    }
  }, []);
  
  const connectToRoute = useCallback(async (routeId: string) => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setError(null);
    
    try {
      // Se já estiver conectado à mesma rota, desconectar
      if (isConnected && selectedRoute === routeId) {
        await disconnectRoute();
        return;
      }
      
      // Desconectar de qualquer rota atual primeiro
      if (isConnected) {
        await networkOptimizer.disconnectRoute();
      }
      
      // Conectar à nova rota
      const result = await networkOptimizer.optimizeRoute();
      setOptimizationResult(result);
      setIsConnected(true);
      setSelectedRoute(routeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar à rota');
    } finally {
      setIsOptimizing(false);
    }
  }, [isConnected, isOptimizing, selectedRoute]);
  
  const disconnectRoute = useCallback(async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setError(null);
    
    try {
      await networkOptimizer.disconnectRoute();
      setIsConnected(false);
      setSelectedRoute(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desconectar da rota');
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing]);

  return {
    isOptimizing,
    isConnected,
    currentMetrics,
    optimizationResult,
    error,
    selectedRoute,
    startOptimization,
    connectToRoute,
    disconnectRoute
  };
}