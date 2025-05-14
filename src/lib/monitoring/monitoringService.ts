import * as Comlink from 'comlink';
import type { MonitoringWorker } from './monitoringWorker';
import type { SystemMetrics } from '../systemOptimization/optimizer';

class MonitoringService {
  private static instance: MonitoringService;
  private worker: Comlink.Remote<MonitoringWorker> | null = null;
  private listeners: Set<(metrics: SystemMetrics) => void> = new Set();
  private cleanup: (() => void) | null = null;
  private isMonitoring: boolean = false;
  private lastMetrics: SystemMetrics | null = null;
  private updateInterval: number | null = null;
  private isDesktopApp: boolean = false;

  private constructor() {
    // Verificar se estamos no Electron
    this.isDesktopApp = !!window.electronAPI;
    
    if (!this.isDesktopApp) {
      // No ambiente web, não usamos worker, mas simulamos métricas
      this.setupSimulatedMetrics();
    } else {
      // No Electron, tentamos inicializar o worker
      this.initializeWorker();
    }
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private setupSimulatedMetrics() {
    console.log('Configurando métricas simuladas para ambiente web');
  }

  private initializeWorker() {
    if (this.worker) {
      this.cleanup?.();
    }

    try {
      const workerUrl = new URL('./monitoringWorker', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });
      this.worker = Comlink.wrap<MonitoringWorker>(worker);

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'metrics') {
          this.lastMetrics = event.data.data;
          this.notifyListeners(event.data.data);
        }
      };

      worker.addEventListener('message', messageHandler);

      this.cleanup = () => {
        worker.removeEventListener('message', messageHandler);
        worker.terminate();
        this.worker = null;
        this.listeners.clear();
      };
      
      console.log('Worker de monitoramento inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar worker de monitoramento:', error);
      // Fallback para métricas simuladas
      this.setupSimulatedMetrics();
    }
  }

  public startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    if (this.isDesktopApp && this.worker) {
      // Usar worker no Electron
      this.worker.startMonitoring();
      console.log('Monitoramento iniciado via worker');
    } else {
      // Simulação para ambiente web
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      
      this.updateInterval = window.setInterval(() => {
        this.updateSimulatedMetrics();
      }, 1000);
      
      console.log('Monitoramento simulado iniciado');
    }
  }

  public stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.isDesktopApp && this.worker) {
      this.worker.stopMonitoring();
      console.log('Monitoramento via worker interrompido');
    } else {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      console.log('Monitoramento simulado interrompido');
    }
  }

  private updateSimulatedMetrics() {
    // Gerar métricas simuladas para ambiente web
    const metrics: SystemMetrics = {
      cpu: {
        usage: 30 + Math.random() * 40, // 30-70%
        temperature: 50 + Math.random() * 30, // 50-80°C
        frequency: 2000 + Math.random() * 1000, // 2-3 GHz
        processes: this.generateSimulatedProcesses()
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
    
    this.lastMetrics = metrics;
    this.notifyListeners(metrics);
  }
  
  private generateSimulatedProcesses() {
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

  public subscribe(callback: (metrics: SystemMetrics) => void) {
    this.listeners.add(callback);
    
    // Enviar métricas atuais imediatamente se disponíveis
    if (this.lastMetrics) {
      callback(this.lastMetrics);
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(metrics: SystemMetrics) {
    this.listeners.forEach(listener => listener(metrics));
  }

  public async getMetrics(): Promise<SystemMetrics | null> {
    if (this.isDesktopApp && this.worker) {
      try {
        return await this.worker.getMetrics();
      } catch (error) {
        console.error('Erro ao obter métricas do worker:', error);
      }
    }
    
    // Fallback para métricas simuladas ou últimas métricas conhecidas
    if (this.lastMetrics) {
      return this.lastMetrics;
    }
    
    // Gerar métricas simuladas se não houver nenhuma disponível
    const metrics: SystemMetrics = {
      cpu: {
        usage: 30 + Math.random() * 40,
        temperature: 50 + Math.random() * 30,
        frequency: 2000 + Math.random() * 1000,
        processes: this.generateSimulatedProcesses()
      },
      memory: {
        used: 4000 + Math.random() * 8000,
        available: 16384,
        swapUsage: Math.random() * 1024
      },
      gpu: {
        usage: 20 + Math.random() * 60,
        temperature: 60 + Math.random() * 20,
        memoryUsed: Math.random() * 4096,
        memoryTotal: 8192
      },
      network: {
        latency: 10 + Math.random() * 40,
        bandwidth: 100 + Math.random() * 900,
        packetLoss: Math.random() * 0.5
      }
    };
    
    return metrics;
  }

  public destroy() {
    this.stopMonitoring();
    this.cleanup?.();
  }
}

export const monitoringService = MonitoringService.getInstance();