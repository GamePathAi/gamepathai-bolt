import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NetworkState {
  isConnected: boolean;
  selectedRegion: string;
  connectionStartTime: Date | null;
  metrics: {
    download: number;
    upload: number;
    latency: number;
    uptime: string;
  };
}

interface NetworkMetrics {
  ping: number;
  downloadSpeed: number;
  uploadSpeed: number;
  packetLoss: number;
  jitter: number;
  dns: string;
}

interface OptimizationResult {
  improved: boolean;
  message: string;
  oldMetrics?: NetworkMetrics;
  newMetrics?: NetworkMetrics;
}

interface NetworkContextType {
  // Manter compatibilidade com código existente
  networkState: NetworkState;
  setNetworkState: (state: Partial<NetworkState>) => void;
  updateNetworkState: (updates: Partial<NetworkState>) => void;
  
  // Adicionar funcionalidades para NetworkOptimizer
  isOptimizing: boolean;
  metrics: NetworkMetrics | null;
  lastOptimization: Date | null;
  startOptimization: () => Promise<void>;
  stopOptimization: () => void;
  testNetwork: () => Promise<NetworkMetrics>;
  applyOptimization: (type: string) => Promise<OptimizationResult>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado original mantido
  const [networkState, setNetworkStateInternal] = useState<NetworkState>({
    isConnected: false,
    selectedRegion: 'auto',
    connectionStartTime: null,
    metrics: {
      download: 0,
      upload: 0,
      latency: 0,
      uptime: '00:00'
    }
  });

  // Novos estados para NetworkOptimizer
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);

  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.networkAPI;

  // Funções originais mantidas
  const updateNetworkState = (updates: Partial<NetworkState>) => {
    setNetworkStateInternal(prev => ({ ...prev, ...updates }));
  };

  const setNetworkState = (state: Partial<NetworkState>) => {
    setNetworkStateInternal(prev => ({ ...prev, ...state }));
  };

  // Novas funções para NetworkOptimizer
  const testNetwork = useCallback(async (): Promise<NetworkMetrics> => {
    if (!isElectron) {
      // Modo desenvolvimento - retornar dados simulados
      const mockMetrics: NetworkMetrics = {
        ping: networkState.metrics.latency || (20 + Math.random() * 30),
        downloadSpeed: networkState.metrics.download || (50 + Math.random() * 100),
        uploadSpeed: networkState.metrics.upload || (10 + Math.random() * 50),
        packetLoss: Math.random() * 2,
        jitter: Math.random() * 10,
        dns: 'Auto'
      };
      setMetrics(mockMetrics);
      
      // Sincronizar com networkState
      updateNetworkState({
        metrics: {
          download: mockMetrics.downloadSpeed,
          upload: mockMetrics.uploadSpeed,
          latency: mockMetrics.ping,
          uptime: networkState.metrics.uptime
        }
      });
      
      return mockMetrics;
    }

    try {
      const result = await window.electronAPI.networkAPI.testSpeed();
      const networkMetrics: NetworkMetrics = {
        ping: result.ping || 0,
        downloadSpeed: result.downloadSpeed || 0,
        uploadSpeed: result.uploadSpeed || 0,
        packetLoss: result.packetLoss || 0,
        jitter: result.jitter || 0,
        dns: result.dns || 'Auto'
      };
      setMetrics(networkMetrics);
      
      // Sincronizar com networkState
      updateNetworkState({
        metrics: {
          download: networkMetrics.downloadSpeed,
          upload: networkMetrics.uploadSpeed,
          latency: networkMetrics.ping,
          uptime: networkState.metrics.uptime
        }
      });
      
      return networkMetrics;
    } catch (error) {
      console.error('Erro ao testar rede:', error);
      return {
        ping: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        packetLoss: 0,
        jitter: 0,
        dns: 'Auto'
      };
    }
  }, [isElectron, networkState.metrics.uptime, updateNetworkState]);

  const startOptimization = useCallback(async () => {
    setIsOptimizing(true);
    console.log('🚀 Iniciando otimização de rede...');
    
    try {
      await testNetwork();
      
      if (isElectron) {
        await window.electronAPI.networkAPI.optimize();
      }
      
      setLastOptimization(new Date());
      updateNetworkState({ isConnected: true });
    } catch (error) {
      console.error('Erro na otimização:', error);
    } finally {
      await testNetwork();
      setIsOptimizing(false);
    }
  }, [isElectron, testNetwork, updateNetworkState]);

  const stopOptimization = useCallback(() => {
    setIsOptimizing(false);
    console.log('⏹️ Otimização parada');
  }, []);

  const applyOptimization = useCallback(async (type: string): Promise<OptimizationResult> => {
    if (!isElectron) {
      return {
        improved: true,
        message: `Otimização ${type} aplicada com sucesso (modo dev)`,
        oldMetrics: metrics || {
          ping: 30,
          downloadSpeed: 50,
          uploadSpeed: 10,
          packetLoss: 1,
          jitter: 5,
          dns: 'Auto'
        },
        newMetrics: {
          ping: 15 + Math.random() * 10,
          downloadSpeed: 100 + Math.random() * 50,
          uploadSpeed: 50 + Math.random() * 20,
          packetLoss: Math.random() * 0.5,
          jitter: Math.random() * 3,
          dns: 'Cloudflare'
        }
      };
    }

    try {
      const oldMetrics = metrics || await testNetwork();
      const result = await window.electronAPI.networkAPI.applyOptimization(type);
      const newMetrics = await testNetwork();
      
      return {
        improved: result.success,
        message: result.message,
        oldMetrics,
        newMetrics
      };
    } catch (error) {
      return {
        improved: false,
        message: `Erro ao aplicar otimização: ${error}`
      };
    }
  }, [isElectron, metrics, testNetwork]);

  return (
    <NetworkContext.Provider value={{ 
      // Compatibilidade com código existente
      networkState, 
      setNetworkState, 
      updateNetworkState,
      
      // Novas funcionalidades
      isOptimizing,
      metrics,
      lastOptimization,
      startOptimization,
      stopOptimization,
      testNetwork,
      applyOptimization
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};