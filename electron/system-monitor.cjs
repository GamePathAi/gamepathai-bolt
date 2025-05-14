const os = require('os');
const si = require('systeminformation');
const osUtils = require('node-os-utils');

class SystemMonitor {
  constructor() {
    this.lastMetrics = null;
    this.history = [];
    this.maxHistoryLength = 100;
    this.gameProcessPatterns = [
      /steam\.exe$/i,
      /epicgameslauncher\.exe$/i,
      /league of legends\.exe$/i,
      /valorant\.exe$/i,
      /csgo\.exe$/i,
      /dota2\.exe$/i,
      /gta5\.exe$/i,
      /cyberpunk2077\.exe$/i,
      /fortnite\.exe$/i,
      /rocketleague\.exe$/i,
      /overwatch\.exe$/i,
      /minecraft\.exe$/i,
      /apex\.exe$/i,
      /cod\.exe$/i,
      /warzone\.exe$/i
    ];
  }

  /**
   * Obtém informações completas do sistema
   */
  async getSystemInfo() {
    try {
      const [cpu, mem, gpu, temps, processes, osInfo, diskLayout, networkStats] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.cpuTemperature(),
        si.processes(),
        si.osInfo(),
        si.diskLayout(),
        si.networkStats()
      ]);
      
      // Filtrar processos para jogos
      const gameProcesses = processes.list.filter(process => {
        return this.isGameProcess(process.name);
      });
      
      // Calcular uso de CPU
      const cpuUsage = await this.getCpuUsage();
      
      // Calcular uso de GPU
      const gpuUsage = gpu.controllers.length > 0 ? (gpu.controllers[0].utilizationGpu || 0) : 0;
      
      // Calcular uso de memória
      const memoryUsage = (mem.used / mem.total) * 100;
      
      // Calcular uso de disco
      const diskUsage = await this.getDiskUsage();
      
      // Calcular uso de rede
      const networkUsage = this.calculateNetworkUsage(networkStats);
      
      const metrics = {
        cpu: {
          usage: cpuUsage,
          model: cpu.brand,
          cores: cpu.cores,
          threads: cpu.threads,
          speed: cpu.speed,
          temperature: temps.main || 0,
          processes: gameProcesses.map(p => ({
            pid: p.pid,
            name: p.name,
            cpuUsage: p.cpu,
            memoryUsage: p.mem,
            priority: 0
          }))
        },
        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          usedPercent: memoryUsage,
          swapTotal: mem.swaptotal,
          swapUsed: mem.swapused,
          swapUsage: mem.swaptotal > 0 ? (mem.swapused / mem.swaptotal) * 100 : 0
        },
        gpu: {
          model: gpu.controllers.length > 0 ? gpu.controllers[0].model : 'Unknown',
          vram: gpu.controllers.length > 0 ? gpu.controllers[0].vram : 0,
          usage: gpuUsage,
          temperature: gpu.controllers.length > 0 ? (gpu.controllers[0].temperatureGpu || 0) : 0,
          memoryUsed: gpu.controllers.length > 0 ? (gpu.controllers[0].memoryUsed || 0) : 0,
          memoryTotal: gpu.controllers.length > 0 ? (gpu.controllers[0].memoryTotal || 0) : 0
        },
        disk: {
          layout: diskLayout,
          usage: diskUsage
        },
        network: {
          interfaces: os.networkInterfaces(),
          usage: networkUsage
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch
        },
        timestamp: Date.now()
      };
      
      this.lastMetrics = metrics;
      this.addToHistory(metrics);
      
      return metrics;
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      return {
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Verifica se um processo é um jogo
   */
  isGameProcess(processName) {
    return this.gameProcessPatterns.some(pattern => pattern.test(processName));
  }
  
  /**
   * Obtém o uso de CPU
   */
  async getCpuUsage() {
    try {
      const cpuUsage = await osUtils.cpu.usage();
      return cpuUsage;
    } catch (error) {
      console.error('Erro ao obter uso de CPU:', error);
      return 0;
    }
  }
  
  /**
   * Obtém o uso de disco
   */
  async getDiskUsage() {
    try {
      const drives = await si.fsSize();
      return drives.map(drive => ({
        fs: drive.fs,
        type: drive.type,
        size: drive.size,
        used: drive.used,
        available: drive.available,
        usedPercent: drive.use,
        mount: drive.mount
      }));
    } catch (error) {
      console.error('Erro ao obter uso de disco:', error);
      return [];
    }
  }
  
  /**
   * Calcula o uso de rede
   */
  calculateNetworkUsage(networkStats) {
    if (!networkStats || !Array.isArray(networkStats)) {
      return {
        interfaces: [],
        totalRx: 0,
        totalTx: 0
      };
    }
    
    let totalRx = 0;
    let totalTx = 0;
    
    const interfaces = networkStats.map(iface => {
      totalRx += iface.rx_bytes;
      totalTx += iface.tx_bytes;
      
      return {
        interface: iface.iface,
        rx: iface.rx_bytes,
        tx: iface.tx_bytes,
        rxSec: iface.rx_sec,
        txSec: iface.tx_sec
      };
    });
    
    return {
      interfaces,
      totalRx,
      totalTx
    };
  }
  
  /**
   * Adiciona métricas ao histórico
   */
  addToHistory(metrics) {
    this.history.push({
      timestamp: metrics.timestamp,
      cpu: {
        usage: metrics.cpu.usage,
        temperature: metrics.cpu.temperature
      },
      memory: {
        usedPercent: metrics.memory.usedPercent,
        swapUsage: metrics.memory.swapUsage
      },
      gpu: {
        usage: metrics.gpu.usage,
        temperature: metrics.gpu.temperature
      }
    });
    
    // Limitar tamanho do histórico
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }
  
  /**
   * Obtém o histórico de métricas
   */
  getHistory() {
    return this.history;
  }
  
  /**
   * Obtém as últimas métricas
   */
  getLastMetrics() {
    return this.lastMetrics;
  }
  
  /**
   * Monitora um processo específico
   */
  async monitorProcess(pid) {
    try {
      const processInfo = await si.processLoad(pid);
      return {
        pid,
        cpu: processInfo.cpu,
        memory: processInfo.mem,
        uptime: processInfo.uptime
      };
    } catch (error) {
      console.error(`Erro ao monitorar processo ${pid}:`, error);
      return {
        pid,
        error: error.message
      };
    }
  }
  
  /**
   * Otimiza o sistema para jogos
   */
  async optimizeForGaming() {
    try {
      // Implementação real dependeria de APIs específicas do sistema operacional
      // Esta é uma simulação
      
      // Simular otimização de processos
      const optimizedProcesses = await this.optimizeProcesses();
      
      // Simular otimização de memória
      const optimizedMemory = await this.optimizeMemory();
      
      // Simular otimização de disco
      const optimizedDisk = await this.optimizeDisk();
      
      return {
        success: true,
        optimizations: {
          processes: optimizedProcesses,
          memory: optimizedMemory,
          disk: optimizedDisk
        }
      };
    } catch (error) {
      console.error('Erro ao otimizar sistema para jogos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Otimiza processos em segundo plano
   */
  async optimizeProcesses() {
    // Simulação - em um app real, ajustaria prioridades de processos
    console.log('Otimizando processos em segundo plano...');
    return {
      success: true,
      processesOptimized: 12
    };
  }
  
  /**
   * Otimiza uso de memória
   */
  async optimizeMemory() {
    // Simulação - em um app real, liberaria memória
    console.log('Otimizando uso de memória...');
    return {
      success: true,
      memoryFreed: 1024 * 1024 * 512 // 512 MB
    };
  }
  
  /**
   * Otimiza uso de disco
   */
  async optimizeDisk() {
    // Simulação - em um app real, otimizaria cache de disco
    console.log('Otimizando uso de disco...');
    return {
      success: true,
      cacheOptimized: true
    };
  }
}

module.exports = new SystemMonitor();