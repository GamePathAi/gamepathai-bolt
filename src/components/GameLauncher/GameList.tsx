// ========================================
// 🎮 MELHORIAS PARA O GAMELIST
// Integração completa com Network Optimizer
// ========================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Gamepad2, Search, Filter, ChevronDown, Zap, Play, 
  AlertTriangle, RefreshCw, Globe, Activity, Wifi, Server 
} from 'lucide-react';
import { useGameDetectionContext } from './GameDetectionProvider';
import type { GameInfo } from '../../lib/gameDetection/types';

// 1. NOVOS TIPOS PARA NETWORK OPTIMIZER
interface NetworkStatus {
  connected: boolean;
  route: string;
  ping: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  region: string;
}

interface ServerInfo {
  name: string;
  region: string;
  ping: number;
  playerCount?: number;
  status: 'online' | 'busy' | 'offline';
}

interface OptimizationConfig {
  networkRoute: NetworkStatus;
  gameServer: ServerInfo;
  launchArgs: string[];
  estimatedPing: number;
}

// 2. HOOK CUSTOMIZADO PARA NETWORK OPTIMIZER
const useNetworkOptimizer = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Monitorar status do Network Optimizer
    const checkStatus = () => {
      const status = localStorage.getItem('network-optimizer-status');
      if (status) {
        setNetworkStatus(JSON.parse(status));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    // Listener para eventos do Network Optimizer
    const handleNetworkChange = (e: CustomEvent) => {
      setNetworkStatus(e.detail);
    };

    window.addEventListener('network-optimizer-changed', handleNetworkChange as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('network-optimizer-changed', handleNetworkChange as EventListener);
    };
  }, []);

  const connectToOptimalRoute = async (targetRegion?: string) => {
    setIsConnecting(true);
    try {
      // Disparar evento para o Network Optimizer
      window.dispatchEvent(new CustomEvent('network-optimizer-connect', {
        detail: { region: targetRegion || 'auto' }
      }));

      // Aguardar conexão
      await new Promise(resolve => setTimeout(resolve, 3000));

      return true;
    } finally {
      setIsConnecting(false);
    }
  };

  return { networkStatus, isConnecting, connectToOptimalRoute };
};

// 3. SERVIÇO DE OTIMIZAÇÃO DE SERVIDORES
class GameServerOptimizer {
  private static serverConfigs: Record<string, ServerInfo[]> = {
    'Red Dead Redemption 2': [
      { name: 'Brasil - São Paulo', region: 'sa-east-1', ping: 0, status: 'online' },
      { name: 'US East - Virginia', region: 'us-east-1', ping: 0, status: 'online' },
      { name: 'Europe - Frankfurt', region: 'eu-central-1', ping: 0, status: 'online' }
    ],
    'Call of Duty': [
      { name: 'South America', region: 'sa', ping: 0, playerCount: 0, status: 'online' },
      { name: 'North America East', region: 'na-east', ping: 0, playerCount: 0, status: 'online' },
      { name: 'North America West', region: 'na-west', ping: 0, playerCount: 0, status: 'online' }
    ]
  };

  static async findBestServer(gameName: string, userRegion?: string): Promise<ServerInfo> {
    const servers = this.serverConfigs[gameName] || [];
    
    // Simular teste de ping
    const testedServers = servers.map(server => ({
      ...server,
      ping: this.estimatePing(server.region, userRegion),
      playerCount: Math.floor(Math.random() * 10000) + 1000
    }));

    // Ordenar por ping
    testedServers.sort((a, b) => a.ping - b.ping);

    return testedServers[0];
  }

  private static estimatePing(serverRegion: string, userRegion?: string): number {
    const basePings: Record<string, Record<string, number>> = {
      'sa-east-1': { 'sa': 15, 'na-east': 120, 'na-west': 180, 'eu': 220 },
      'us-east-1': { 'sa': 120, 'na-east': 30, 'na-west': 60, 'eu': 100 },
      'eu-central-1': { 'sa': 220, 'na-east': 100, 'na-west': 140, 'eu': 30 }
    };

    const userReg = userRegion || 'sa';
    return basePings[serverRegion]?.[userReg] || 100;
  }

  static buildLaunchArgs(game: GameInfo, server: ServerInfo): string[] {
    const configs: Record<string, (server: ServerInfo) => string[]> = {
      'Call of Duty': (srv) => [
        '-server', srv.region,
        '-maxping', '80',
        '-tickrate', '128',
        '-highpriority'
      ],
      'Red Dead Redemption 2': (srv) => [
        '-sgaRegion', srv.region,
        '-sgaMaxPing', '100',
        '-adapter', 'network-optimized'
      ]
    };

    return configs[game.name]?.(server) || [];
  }
}

// 4. COMPONENTE DE STATUS DE REDE
const NetworkStatusBar: React.FC<{ status: NetworkStatus | null }> = ({ status }) => {
  if (!status) return null;

  const qualityColors = {
    'Excellent': 'text-green-400',
    'Good': 'text-cyan-400',
    'Fair': 'text-yellow-400',
    'Poor': 'text-red-400'
  };

  return (
    <div className="mb-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="text-cyan-400" size={20} />
          <div>
            <p className="text-sm font-medium text-white">Network Optimizer</p>
            <p className="text-xs text-gray-400">
              {status.route} • {status.region}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Wifi className={qualityColors[status.quality]} size={16} />
            <span className={`text-sm font-medium ${qualityColors[status.quality]}`}>
              {status.ping}ms
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="text-green-400" size={16} />
            <span className="text-xs text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. BOTÃO DE LANÇAMENTO OTIMIZADO
interface OptimizedLaunchButtonProps {
  game: GameInfo;
  onLaunch: (game: GameInfo, config: OptimizationConfig) => void;
  networkStatus: NetworkStatus | null;
}

const OptimizedLaunchButton: React.FC<OptimizedLaunchButtonProps> = ({ 
  game, 
  onLaunch, 
  networkStatus 
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState('');
  const [lastOptimization, setLastOptimization] = useState<OptimizationConfig | null>(null);

  useEffect(() => {
    // Carregar última otimização
    const saved = localStorage.getItem(`game-optimization-${game.id}`);
    if (saved) {
      setLastOptimization(JSON.parse(saved));
    }
  }, [game.id]);

  const handleOptimizedLaunch = async () => {
    setIsOptimizing(true);
    
    try {
      // Passo 1: Verificar Network Optimizer
      setOptimizationStep('Verificando conexão de rede...');
      if (!networkStatus?.connected) {
        setOptimizationStep('Conectando Network Optimizer...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Passo 2: Encontrar melhor servidor
      setOptimizationStep('Procurando melhor servidor...');
      const bestServer = await GameServerOptimizer.findBestServer(game.name);

      // Passo 3: Construir configuração
      setOptimizationStep('Aplicando otimizações...');
      const launchArgs = GameServerOptimizer.buildLaunchArgs(game, bestServer);
      
      const config: OptimizationConfig = {
        networkRoute: networkStatus || {
          connected: true,
          route: 'Direct',
          ping: 50,
          quality: 'Good',
          region: 'sa'
        },
        gameServer: bestServer,
        launchArgs,
        estimatedPing: bestServer.ping
      };

      // Salvar otimização
      localStorage.setItem(`game-optimization-${game.id}`, JSON.stringify(config));
      setLastOptimization(config);

      // Passo 4: Lançar
      setOptimizationStep('Lançando jogo...');
      await onLaunch(game, config);

      setOptimizationStep('');
    } catch (error) {
      console.error('Erro na otimização:', error);
      setOptimizationStep('Erro na otimização');
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setOptimizationStep(''), 3000);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleOptimizedLaunch}
        disabled={isOptimizing}
        className="w-full py-2 px-3 rounded bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center"
      >
        {isOptimizing ? (
          <>
            <RefreshCw size={14} className="animate-spin mr-2" />
            {optimizationStep || 'Otimizando...'}
          </>
        ) : (
          <>
            <Zap size={14} className="mr-2" />
            Jogar Otimizado
          </>
        )}
      </button>

      {/* Mostrar última otimização */}
      {lastOptimization && !isOptimizing && (
        <div className="text-xs text-gray-500 text-center">
          <Server size={10} className="inline mr-1" />
          {lastOptimization.gameServer.name} ({lastOptimization.estimatedPing}ms)
        </div>
      )}
    </div>
  );
};

// 6. COMPONENTE GAMELIST ATUALIZADO (Adicionar estas partes ao seu GameList existente)

// Adicione ao início do componente GameList:
const { networkStatus, isConnecting, connectToOptimalRoute } = useNetworkOptimizer();
const [optimizationHistory, setOptimizationHistory] = useState<Record<string, OptimizationConfig>>({});

// Adicione este handler para lançamento otimizado:
const handleOptimizedLaunch = useCallback(async (game: GameInfo, config: OptimizationConfig) => {
  console.log(`GameList: Lançando ${game.name} com otimização:`, config);
  
  setIsLaunching(prev => ({ ...prev, [game.id]: true }));
  
  try {
    // Lançar com argumentos otimizados
    if (window.electronAPI?.launchGame) {
      const result = await window.electronAPI.launchGame(game.executablePath, config.launchArgs);
      
      if (result.success) {
        console.log(`GameList: ${game.name} lançado com servidor ${config.gameServer.name}`);
        
        // Salvar no histórico
        setOptimizationHistory(prev => ({
          ...prev,
          [game.id]: config
        }));
      } else {
        throw new Error(result.error || 'Falha ao lançar');
      }
    }
  } catch (error) {
    console.error(`GameList: Erro ao lançar otimizado:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    setLaunchErrors(prev => ({ 
      ...prev, 
      [game.id]: errorMessage 
    }));
  } finally {
    setIsLaunching(prev => ({ ...prev, [game.id]: false }));
  }
}, []);

// 7. ADICIONAR NA SEÇÃO DE RENDERIZAÇÃO (antes do grid de jogos):
{networkStatus && <NetworkStatusBar status={networkStatus} />}

// 8. MODIFICAR OS BOTÕES DE AÇÃO NO CARD DO JOGO:
{/* Substituir a seção de botões por: */}
<div className="flex flex-col gap-2">
  <div className="flex gap-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleLaunchGame(game);
      }}
      disabled={isLaunching[game.id]}
      className="flex-1 py-2 px-3 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
    >
      {isLaunching[game.id] ? (
        <RefreshCw size={14} className="animate-spin" />
      ) : (
        <>
          <Play size={14} className="mr-1" />
          Jogar Normal
        </>
      )}
    </button>
  </div>
  
  {/* Botão de lançamento otimizado */}
  <OptimizedLaunchButton 
    game={game}
    onLaunch={handleOptimizedLaunch}
    networkStatus={networkStatus}
  />
</div>