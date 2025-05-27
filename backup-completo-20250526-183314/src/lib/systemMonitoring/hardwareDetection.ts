import { isElectron } from '../gameDetection/isElectron';

export interface CPUInfo {
  name: string;
  cores: number;
  threads: number;
  baseSpeed: number;
  currentSpeed: number;
  usage: number;
  temperature?: number;
}

export interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  usage: number;
}

export interface GPUInfo {
  name: string;
  vendor: string;
  driverVersion?: string;
  memory: {
    total: number;
    used: number;
  };
  usage: number;
  temperature?: number;
}

export interface SystemInfo {
  os: string;
  manufacturer: string;
  model: string;
  version: string;
  uptime: number;
}

export interface HardwareInfo {
  cpu: CPUInfo;
  memory: MemoryInfo;
  gpu: GPUInfo;
  system: SystemInfo;
}

/**
 * Hardware detection class for retrieving system information
 */
class HardwareDetector {
  private static instance: HardwareDetector;
  private isElectronEnv: boolean;

  private constructor() {
    this.isElectronEnv = isElectron();
    console.log(`HardwareDetector initialized, Electron environment: ${this.isElectronEnv}`);
  }

  public static getInstance(): HardwareDetector {
    if (!HardwareDetector.instance) {
      HardwareDetector.instance = new HardwareDetector();
    }
    return HardwareDetector.instance;
  }

  /**
   * Get CPU information
   */
  public async getCPUInfo(): Promise<CPUInfo> {
    try {
      if (this.isElectronEnv && window.electronAPI) {
        // Get CPU info from Electron
        const systemInfo = await window.electronAPI.monitoring?.getSystemMetrics();
        
        if (systemInfo?.success && systemInfo.data?.cpu) {
          const cpuData = systemInfo.data.cpu;
          return {
            name: cpuData.model || 'Unknown CPU',
            cores: cpuData.cores || 0,
            threads: cpuData.threads || 0,
            baseSpeed: cpuData.baseSpeed || 0,
            currentSpeed: cpuData.speed || 0,
            usage: cpuData.usage || 0,
            temperature: cpuData.temperature
          };
        }
      }
      
      // Fallback to simulated data
      return this.getSimulatedCPUInfo();
    } catch (error) {
      console.error('Error getting CPU info:', error);
      return this.getSimulatedCPUInfo();
    }
  }

  /**
   * Get memory information
   */
  public async getMemoryInfo(): Promise<MemoryInfo> {
    try {
      if (this.isElectronEnv && window.electronAPI) {
        // Get memory info from Electron
        const systemInfo = await window.electronAPI.monitoring?.getSystemMetrics();
        
        if (systemInfo?.success && systemInfo.data?.memory) {
          const memData = systemInfo.data.memory;
          return {
            total: memData.total || 0,
            available: memData.available || 0,
            used: memData.used || 0,
            usage: memData.usedPercent || 0
          };
        }
      }
      
      // Fallback to simulated data
      return this.getSimulatedMemoryInfo();
    } catch (error) {
      console.error('Error getting memory info:', error);
      return this.getSimulatedMemoryInfo();
    }
  }

  /**
   * Get GPU information
   */
  public async getGPUInfo(): Promise<GPUInfo> {
    try {
      if (this.isElectronEnv && window.electronAPI) {
        // Get GPU info from Electron
        const systemInfo = await window.electronAPI.monitoring?.getSystemMetrics();
        
        if (systemInfo?.success && systemInfo.data?.gpu) {
          const gpuData = systemInfo.data.gpu;
          return {
            name: gpuData.model || 'Unknown GPU',
            vendor: gpuData.vendor || 'Unknown',
            driverVersion: gpuData.driverVersion,
            memory: {
              total: gpuData.memoryTotal || 0,
              used: gpuData.memoryUsed || 0
            },
            usage: gpuData.usage || 0,
            temperature: gpuData.temperature
          };
        }
      }
      
      // Fallback to simulated data
      return this.getSimulatedGPUInfo();
    } catch (error) {
      console.error('Error getting GPU info:', error);
      return this.getSimulatedGPUInfo();
    }
  }

  /**
   * Get system information
   */
  public async getSystemInfo(): Promise<SystemInfo> {
    try {
      if (this.isElectronEnv && window.electronAPI) {
        // Get system info from Electron
        const systemInfo = await window.electronAPI.monitoring?.getSystemMetrics();
        
        if (systemInfo?.success && systemInfo.data?.os) {
          const osData = systemInfo.data.os;
          return {
            os: osData.platform || 'Unknown OS',
            manufacturer: osData.manufacturer || 'Unknown',
            model: osData.model || 'Unknown',
            version: osData.release || 'Unknown',
            uptime: osData.uptime || 0
          };
        }
      }
      
      // Fallback to simulated data
      return this.getSimulatedSystemInfo();
    } catch (error) {
      console.error('Error getting system info:', error);
      return this.getSimulatedSystemInfo();
    }
  }

  /**
   * Get all hardware information
   */
  public async getHardwareInfo(): Promise<HardwareInfo> {
    const [cpu, memory, gpu, system] = await Promise.all([
      this.getCPUInfo(),
      this.getMemoryInfo(),
      this.getGPUInfo(),
      this.getSystemInfo()
    ]);

    return {
      cpu,
      memory,
      gpu,
      system
    };
  }

  /**
   * Get simulated CPU information
   */
  private getSimulatedCPUInfo(): CPUInfo {
    return {
      name: 'Intel Core i9-13900H',
      cores: 14,
      threads: 20,
      baseSpeed: 2600,
      currentSpeed: 2600 + Math.random() * 1400, // 2.6-4.0 GHz
      usage: 10 + Math.random() * 40, // 10-50%
      temperature: 40 + Math.random() * 20 // 40-60°C
    };
  }

  /**
   * Get simulated memory information
   */
  private getSimulatedMemoryInfo(): MemoryInfo {
    const total = 32 * 1024 * 1024 * 1024; // 32 GB in bytes
    const used = Math.floor(total * (0.3 + Math.random() * 0.3)); // 30-60% usage
    return {
      total,
      available: total - used,
      used,
      usage: (used / total) * 100
    };
  }

  /**
   * Get simulated GPU information
   */
  private getSimulatedGPUInfo(): GPUInfo {
    const total = 8 * 1024 * 1024 * 1024; // 8 GB VRAM in bytes
    const used = Math.floor(total * (0.2 + Math.random() * 0.5)); // 20-70% usage
    return {
      name: 'NVIDIA GeForce RTX 4070',
      vendor: 'NVIDIA',
      driverVersion: '546.33',
      memory: {
        total,
        used
      },
      usage: 10 + Math.random() * 60, // 10-70%
      temperature: 50 + Math.random() * 20 // 50-70°C
    };
  }

  /**
   * Get simulated system information
   */
  private getSimulatedSystemInfo(): SystemInfo {
    return {
      os: 'Windows 11 Home',
      manufacturer: 'Acer',
      model: 'Nitro ANV15-51',
      version: 'Build 26100',
      uptime: Math.floor(Math.random() * 86400) // 0-24 hours in seconds
    };
  }

  /**
   * Detect GPU using WMIC (Windows Management Instrumentation Command-line)
   * This is a Windows-specific method that would be used in the Electron main process
   */
  public async detectGPUWithWMIC(): Promise<GPUInfo | null> {
    // This would be implemented in the main process and called via IPC
    // For now, we'll just return simulated data
    return this.getSimulatedGPUInfo();
  }
}

export const hardwareDetector = HardwareDetector.getInstance();