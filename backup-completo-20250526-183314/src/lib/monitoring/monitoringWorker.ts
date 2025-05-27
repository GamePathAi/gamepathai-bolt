import * as Comlink from 'comlink';
import type { SystemMetrics } from '../systemOptimization/optimizer';

interface MonitoringWorker {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getMetrics: () => Promise<SystemMetrics>;
}

let monitoringInterval: number | null = null;
const MONITORING_INTERVAL = 1000; // 1 segundo para atualizações em tempo real

// Função para gerar processos simulados
function generateSimulatedProcesses() {
  const processes = [];
  const numProcesses = Math.floor(Math.random() * 5) + 3; // 3-8 processos
  
  const gameProcessNames = [
    'steam.exe',
    'LeagueOfLegends.exe',
    'Fortnite.exe',
    'VALORANT.exe',
    'csgo.exe',
    'GTA5.exe',
    'Cyberpunk2077.exe',
    'RocketLeague.exe'
  ];
  
  for (let i = 0; i < numProcesses; i++) {
    processes.push({
      pid: 1000 + i,
      name: gameProcessNames[i % gameProcessNames.length],
      cpuUsage: Math.random() * 20, // 0-20%
      memoryUsage: Math.random() * 2000, // 0-2000 MB
      priority: Math.floor(Math.random() * 5) // 0-4 (prioridade)
    });
  }
  
  return processes;
}

const worker: MonitoringWorker = {
  startMonitoring() {
    if (monitoringInterval) return;

    monitoringInterval = setInterval(() => {
      const metrics = this.getMetrics();
      // @ts-ignore
      postMessage({ type: 'metrics', data: metrics });
    }, MONITORING_INTERVAL) as unknown as number;
  },

  stopMonitoring() {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  },

  async getMetrics(): Promise<SystemMetrics> {
    // Verificar se estamos no Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const metrics = await window.electronAPI.getSystemInfo();
        return metrics;
      } catch (error) {
        console.error('Erro ao obter métricas do sistema via Electron:', error);
      }
    }
    
    // Fallback para métricas simuladas
    return {
      cpu: {
        usage: 30 + Math.random() * 40, // 30-70%
        temperature: 50 + Math.random() * 30, // 50-80°C
        frequency: 2000 + Math.random() * 1000, // 2-3 GHz
        processes: generateSimulatedProcesses()
      },
      memory: {
        used: 4000 + Math.random() * 8000, // 4-12 GB
        available: 16384, // 16 GB
        swapUsage: Math.random() * 1024 // 0-1 GB
      },
      gpu: {
        usage: 20 + Math.random() * 60, // 20-80%
        temperature: 60 + Math.random() * 20, // 60-80°C
        memoryUsed: Math.random() * 4096, // 0-4 GB
        memoryTotal: 8192 // 8 GB
      },
      network: {
        latency: 10 + Math.random() * 40, // 10-50ms
        bandwidth: 100 + Math.random() * 900, // 100-1000 Mbps
        packetLoss: Math.random() * 0.5 // 0-0.5%
      }
    };
  }
};

Comlink.expose(worker);

export type { MonitoringWorker };