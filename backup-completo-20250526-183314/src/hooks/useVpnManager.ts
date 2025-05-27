import { useState, useEffect, useCallback } from 'react';
import { vpnManager, type VpnServer, type VpnConnectionStatus } from '../lib/vpn/vpnManager';

export function useVpnManager() {
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [status, setStatus] = useState<VpnConnectionStatus>({ isConnected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('auto');
  const [connectionProgress, setConnectionProgress] = useState(0);

  // Carregar servidores e status inicial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const serverList = vpnManager.getServers();
        setServers(serverList);
        
        const currentStatus = vpnManager.getStatus();
        setStatus(currentStatus);
        
        if (currentStatus.isConnected && currentStatus.server) {
          setSelectedRegion(currentStatus.server.id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais da VPN:', err);
        setError('Falha ao carregar servidores VPN');
      }
    };
    
    loadInitialData();
  }, []);

  // Atualizar status periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const currentStatus = vpnManager.getStatus();
        setStatus(currentStatus);
      } catch (err) {
        console.error('Erro ao atualizar status da VPN:', err);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async (serverId: string) => {
    if (isConnecting) return;
    
    // Se já estiver conectado ao mesmo servidor, desconectar
    if (status.isConnected && status.server?.id === serverId) {
      return disconnect();
    }
    
    setIsConnecting(true);
    setConnectionProgress(0);
    setError(null);
    setSelectedRegion(serverId);
    
    // Simular progresso de conexão
    const progressInterval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    
    try {
      // Encontrar servidor pelo ID
      const server = servers.find(s => s.id === serverId);
      if (!server) {
        throw new Error('Servidor VPN não encontrado');
      }
      
      // Conectar ao servidor
      const result = await vpnManager.connect(serverId);
      
      if (!result) {
        throw new Error('Falha ao conectar ao servidor VPN');
      }
      
      // Atualizar status
      const currentStatus = vpnManager.getStatus();
      setStatus(currentStatus);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar à VPN');
      clearInterval(progressInterval);
      setConnectionProgress(0);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, servers, status.isConnected, status.server?.id]);

  const disconnect = useCallback(async () => {
    if (isConnecting) return false;
    
    setError(null);
    
    try {
      const result = await vpnManager.disconnect();
      
      if (!result) {
        throw new Error('Falha ao desconectar do servidor VPN');
      }
      
      // Atualizar status
      const currentStatus = vpnManager.getStatus();
      setStatus(currentStatus);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desconectar da VPN');
      return false;
    }
  }, [isConnecting]);

  const refreshServers = useCallback(async () => {
    try {
      const serverList = await vpnManager.refreshServers();
      setServers(serverList);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar lista de servidores');
      return false;
    }
  }, []);

  return {
    servers,
    status,
    isConnecting,
    error,
    selectedRegion,
    connectionProgress,
    connect,
    disconnect,
    refreshServers
  };
}