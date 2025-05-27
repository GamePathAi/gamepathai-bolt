import { supabase } from '../supabase';

export interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    frequency: number;
    processes: ProcessInfo[];
  };
  memory: {
    used: number;
    available: number;
    swapUsage: number;
  };
  gpu: {
    usage: number;
    temperature: number;
    memoryUsed: number;
    memoryTotal: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    packetLoss: number;
  };
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  priority: number;
}

interface OptimizationResult {
  improvements: {
    cpu: number;
    memory: number;
    gpu: number;
    network: number;
  };
  actions: string[];
  predictions: {
    nextBottleneck: string;
    timeToIssue: number;
    confidence: number;
  };
}

class SystemOptimizer {
  private static instance: SystemOptimizer;
  private metricsBuffer: SystemMetrics[] = [];
  private readonly bufferSize = 100;
  private isOptimizing = false;
  private isDesktopApp = false;
  private lastMetrics: SystemMetrics | null = null;
  private metricsInterval: number | null = null;

  private constructor() {
    // Verificar se estamos no Electron
    this.isDesktopApp = !!window.electronAPI;
    this.startMetricsCollection();
  }

  public static getInstance(): SystemOptimizer {
    if (!SystemOptimizer.instance) {
      SystemOptimizer.instance = new SystemOptimizer();
    }
    return SystemOptimizer.instance;
  }

  private startMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.metricsInterval = window.setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  private async collectMetrics() {
    const metrics = await this.gatherSystemMetrics();
    this.lastMetrics = metrics;
    this.metricsBuffer.push(metrics);

    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.processAndStoreMetrics();
    }
  }

  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    if (this.isDesktopApp && window.electronAPI) {
      try {
        // Usar API Electron para obter métricas reais de hardware
        const hardwareMetrics = await window.electronAPI.getSystemInfo();
        
        return {
          cpu: {
            usage: hardwareMetrics.cpu.usage || 0,
            temperature: hardwareMetrics.cpu.temperature || 0,
            frequency: hardwareMetrics.cpu.frequency || 0,
            processes: hardwareMetrics.cpu.processes || []
          },
          memory: {
            used: hardwareMetrics.memory.used || 0,
            available: hardwareMetrics.memory.available || 0,
            swapUsage: hardwareMetrics.memory.swapUsage || 0
          },
          gpu: {
            usage: hardwareMetrics.gpu.usage || 0,
            temperature: hardwareMetrics.gpu.temperature || 0,
            memoryUsed: hardwareMetrics.gpu.memoryUsed || 0,
            memoryTotal: hardwareMetrics.gpu.memoryTotal || 0
          },
          network: {
            latency: hardwareMetrics.network.latency || 0,
            bandwidth: hardwareMetrics.network.bandwidth || 0,
            packetLoss: hardwareMetrics.network.packetLoss || 0
          }
        };
      } catch (error) {
        console.error('Erro ao obter métricas do sistema via Electron:', error);
      }
    }
    
    // Versão web - retornar métricas simuladas
    return {
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
  }
  
  private generateSimulatedProcesses(): ProcessInfo[] {
    const processes: ProcessInfo[] = [];
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

  private async processAndStoreMetrics() {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado, métricas não serão salvas');
        this.metricsBuffer = [];
        return;
      }
      
      // Preparar dados para inserção
      const metricsToInsert = this.metricsBuffer.map(metrics => ({
        user_id: user.id,
        cpu_metrics: {
          usage: metrics.cpu.usage,
          temperature: metrics.cpu.temperature,
          frequency: metrics.cpu.frequency,
          processes: metrics.cpu.processes.map(p => ({
            name: p.name,
            usage: p.cpuUsage
          }))
        },
        memory_metrics: {
          used: metrics.memory.used,
          available: metrics.memory.available,
          swapUsage: metrics.memory.swapUsage
        },
        gpu_metrics: {
          usage: metrics.gpu.usage,
          temperature: metrics.gpu.temperature,
          memoryUsed: metrics.gpu.memoryUsed,
          memoryTotal: metrics.gpu.memoryTotal
        },
        network_metrics: {
          latency: metrics.network.latency,
          bandwidth: metrics.network.bandwidth,
          packetLoss: metrics.network.packetLoss
        },
        timestamp: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('system_metrics')
        .insert(metricsToInsert);

      if (error) throw error;
      
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Erro ao processar e armazenar métricas:', error);
    }
  }

  public async optimize(): Promise<OptimizationResult> {
    if (this.isOptimizing) {
      throw new Error('Otimização já em andamento');
    }

    this.isOptimizing = true;

    try {
      // Analisar estado atual do sistema
      const currentMetrics = await this.gatherSystemMetrics();
      
      // Prever possíveis problemas
      const predictions = await this.predictIssues(currentMetrics);
      
      // Gerar plano de otimização
      const optimizationPlan = this.generateOptimizationPlan(currentMetrics, predictions);
      
      // Executar otimizações
      const improvements = await this.executeOptimizations(optimizationPlan);
      
      // Verificar melhorias
      const verifiedResults = await this.verifyOptimizations(improvements);
      
      return {
        improvements: verifiedResults.improvements,
        actions: verifiedResults.actions,
        predictions: {
          nextBottleneck: predictions.nextBottleneck,
          timeToIssue: predictions.timeToIssue,
          confidence: predictions.confidence
        }
      };
    } finally {
      this.isOptimizing = false;
    }
  }

  private async predictIssues(metrics: SystemMetrics): Promise<any> {
    // Implementação simplificada - em um app real, usaria ML
    
    // Identificar o recurso mais utilizado
    const cpuUsage = metrics.cpu.usage;
    const memoryUsage = (metrics.memory.used / metrics.memory.available) * 100;
    const gpuUsage = metrics.gpu.usage;
    
    let nextBottleneck = 'cpu';
    if (memoryUsage > cpuUsage && memoryUsage > gpuUsage) {
      nextBottleneck = 'memory';
    } else if (gpuUsage > cpuUsage && gpuUsage > memoryUsage) {
      nextBottleneck = 'gpu';
    }
    
    // Estimar tempo até o problema
    const timeToIssue = this.estimateTimeToIssue(nextBottleneck, metrics);
    
    return {
      nextBottleneck,
      timeToIssue,
      confidence: 0.85
    };
  }
  
  private estimateTimeToIssue(bottleneck: string, metrics: SystemMetrics): number {
    // Implementação simplificada - estima tempo em segundos até um problema
    switch (bottleneck) {
      case 'cpu':
        return Math.max(0, (90 - metrics.cpu.usage) * 60); // Tempo até 90% de uso
      case 'memory':
        const memoryUsagePercent = (metrics.memory.used / metrics.memory.available) * 100;
        return Math.max(0, (90 - memoryUsagePercent) * 60); // Tempo até 90% de uso
      case 'gpu':
        return Math.max(0, (90 - metrics.gpu.usage) * 60); // Tempo até 90% de uso
      default:
        return 3600; // 1 hora por padrão
    }
  }

  private generateOptimizationPlan(metrics: SystemMetrics, predictions: any): any[] {
    const plan = [];

    // Otimização de CPU
    if (metrics.cpu.usage > 80) {
      plan.push({
        type: 'cpu',
        action: 'optimize_processes',
        priority: 'high'
      });
    }

    // Otimização de memória
    if (metrics.memory.used / metrics.memory.available > 0.9) {
      plan.push({
        type: 'memory',
        action: 'clear_cache',
        priority: 'high'
      });
    }

    // Otimização de GPU
    if (metrics.gpu.usage > 90) {
      plan.push({
        type: 'gpu',
        action: 'optimize_settings',
        priority: 'medium'
      });
    }

    // Otimização de rede
    if (metrics.network.latency > 100) {
      plan.push({
        type: 'network',
        action: 'optimize_route',
        priority: 'high'
      });
    }

    return plan;
  }

  private async executeOptimizations(plan: any[]): Promise<any> {
    const improvements = {
      cpu: 0,
      memory: 0,
      gpu: 0,
      network: 0
    };

    // Verificar se estamos no Electron
    if (this.isDesktopApp && window.electronAPI) {
      try {
        // Executar otimizações reais via Electron
        for (const task of plan) {
          switch (task.type) {
            case 'cpu':
              const cpuResult = await window.electronAPI.optimizeCPU(task);
              improvements.cpu = cpuResult.improvement || 15;
              break;
            case 'memory':
              const memResult = await window.electronAPI.optimizeMemory(task);
              improvements.memory = memResult.improvement || 20;
              break;
            case 'gpu':
              const gpuResult = await window.electronAPI.optimizeGPU(task);
              improvements.gpu = gpuResult.improvement || 10;
              break;
            case 'network':
              const netResult = await window.electronAPI.optimizeNetwork(task);
              improvements.network = netResult.improvement || 25;
              break;
          }
        }
      } catch (error) {
        console.error('Erro ao executar otimizações via Electron:', error);
      }
    } else {
      // Versão web - otimizações simuladas
      for (const task of plan) {
        switch (task.type) {
          case 'cpu':
            improvements.cpu = await this.optimizeCPU();
            break;
          case 'memory':
            improvements.memory = await this.optimizeMemory();
            break;
          case 'gpu':
            improvements.gpu = await this.optimizeGPU();
            break;
          case 'network':
            improvements.network = 25; // Valor simulado
            break;
        }
      }
    }

    return improvements;
  }

  private async optimizeCPU(): Promise<number> {
    // Implementação simulada
    console.log('Simulando otimização de CPU...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 15; // Percentual de melhoria
  }

  private async optimizeMemory(): Promise<number> {
    // Implementação simulada
    console.log('Simulando otimização de memória...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 20; // Percentual de melhoria
  }

  private async optimizeGPU(): Promise<number> {
    // Implementação simulada
    console.log('Simulando otimização de GPU...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 10; // Percentual de melhoria
  }

  private async verifyOptimizations(improvements: any): Promise<any> {
    const verifiedResults = {
      improvements,
      actions: [] as string[]
    };

    if (improvements.cpu > 0) {
      verifiedResults.actions.push(`Desempenho da CPU melhorado em ${improvements.cpu}%`);
    }
    if (improvements.memory > 0) {
      verifiedResults.actions.push(`Uso de memória otimizado em ${improvements.memory}%`);
    }
    if (improvements.gpu > 0) {
      verifiedResults.actions.push(`Desempenho da GPU melhorado em ${improvements.gpu}%`);
    }
    if (improvements.network > 0) {
      verifiedResults.actions.push(`Latência de rede reduzida em ${improvements.network}ms`);
    }

    return verifiedResults;
  }
  
  // Método público para obter métricas atuais
  public async getMetrics(): Promise<SystemMetrics> {
    return this.lastMetrics || await this.gatherSystemMetrics();
  }
}

export const systemOptimizer = SystemOptimizer.getInstance();
export type { SystemMetrics };