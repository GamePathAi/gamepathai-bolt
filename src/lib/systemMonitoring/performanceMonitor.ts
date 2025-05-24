import { hardwareDetector, HardwareInfo } from './hardwareDetection';

export interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    temperature?: number;
  };
  memory: {
    usage: number;
  };
  gpu: {
    usage: number;
    temperature?: number;
  };
  network?: {
    download: number;
    upload: number;
    latency: number;
  };
  fps?: number;
  frametime?: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  priority: number;
}

export interface MonitoringOptions {
  interval?: number;
  historySize?: number;
  includeProcesses?: boolean;
  includeNetwork?: boolean;
}

/**
 * Performance monitoring class for real-time system metrics
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize: number = 60; // Default to 60 data points
  private monitoringInterval: number | null = null;
  private updateInterval: number = 1000; // Default to 1 second
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private lastHardwareInfo: HardwareInfo | null = null;
  private isElectronEnv: boolean;

  private constructor() {
    this.isElectronEnv = typeof window !== 'undefined' && window.electronAPI !== undefined;
    console.log(`PerformanceMonitor initialized, Electron environment: ${this.isElectronEnv}`);
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring system performance
   */
  public startMonitoring(options?: MonitoringOptions): void {
    if (this.monitoringInterval !== null) {
      this.stopMonitoring();
    }

    // Apply options
    if (options) {
      if (options.interval) this.updateInterval = options.interval;
      if (options.historySize) this.maxHistorySize = options.historySize;
    }

    console.log(`Starting performance monitoring with interval: ${this.updateInterval}ms`);

    this.monitoringInterval = window.setInterval(async () => {
      await this.updateMetrics();
    }, this.updateInterval);

    // Initial update
    this.updateMetrics();
  }

  /**
   * Stop monitoring system performance
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Performance monitoring stopped');
    }
  }

  /**
   * Update system metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Get hardware info
      this.lastHardwareInfo = await hardwareDetector.getHardwareInfo();
      
      // Create performance metrics
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        cpu: {
          usage: this.lastHardwareInfo.cpu.usage,
          temperature: this.lastHardwareInfo.cpu.temperature
        },
        memory: {
          usage: this.lastHardwareInfo.memory.usage
        },
        gpu: {
          usage: this.lastHardwareInfo.gpu.usage,
          temperature: this.lastHardwareInfo.gpu.temperature
        }
      };

      // Add to history
      this.metricsHistory.push(metrics);
      
      // Trim history if needed
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }

      // Notify listeners
      this.notifyListeners(metrics);
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  /**
   * Get the current hardware information
   */
  public async getHardwareInfo(): Promise<HardwareInfo> {
    if (this.lastHardwareInfo) {
      return this.lastHardwareInfo;
    }
    return await hardwareDetector.getHardwareInfo();
  }

  /**
   * Get the current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  /**
   * Get the performance metrics history
   */
  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Subscribe to metrics updates
   */
  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(callback);
    
    // If we have metrics, immediately notify the new listener
    const currentMetrics = this.getCurrentMetrics();
    if (currentMetrics) {
      callback(currentMetrics);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of new metrics
   */
  private notifyListeners(metrics: PerformanceMetrics): void {
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in performance metrics listener:', error);
      }
    });
  }

  /**
   * Get running processes
   */
  public async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      if (this.isElectronEnv && window.electronAPI?.monitoring?.getSystemMetrics) {
        const systemInfo = await window.electronAPI.monitoring.getSystemMetrics();
        
        if (systemInfo?.success && systemInfo.data?.cpu?.processes) {
          return systemInfo.data.cpu.processes;
        }
      }
      
      // Fallback to simulated data
      return this.getSimulatedProcesses();
    } catch (error) {
      console.error('Error getting running processes:', error);
      return this.getSimulatedProcesses();
    }
  }

  /**
   * Get simulated process information
   */
  private getSimulatedProcesses(): ProcessInfo[] {
    const processes: ProcessInfo[] = [];
    const processNames = [
      'chrome.exe', 'explorer.exe', 'svchost.exe', 'csrss.exe', 'dwm.exe',
      'GamePathAI.exe', 'steam.exe', 'Discord.exe', 'Spotify.exe', 'Code.exe'
    ];
    
    for (let i = 0; i < 10; i++) {
      processes.push({
        pid: 1000 + i,
        name: processNames[i],
        cpuUsage: Math.random() * 10,
        memoryUsage: Math.random() * 500,
        priority: Math.floor(Math.random() * 5)
      });
    }
    
    return processes;
  }

  /**
   * Get network performance
   */
  public async getNetworkPerformance(): Promise<{ download: number; upload: number; latency: number }> {
    try {
      if (this.isElectronEnv && window.electronAPI?.monitoring?.getSystemMetrics) {
        const systemInfo = await window.electronAPI.monitoring.getSystemMetrics();
        
        if (systemInfo?.success && systemInfo.data?.network) {
          const netData = systemInfo.data.network;
          return {
            download: netData.download || 0,
            upload: netData.upload || 0,
            latency: netData.latency || 0
          };
        }
      }
      
      // Fallback to simulated data
      return {
        download: 10 + Math.random() * 90, // 10-100 Mbps
        upload: 5 + Math.random() * 25, // 5-30 Mbps
        latency: 10 + Math.random() * 40 // 10-50 ms
      };
    } catch (error) {
      console.error('Error getting network performance:', error);
      return {
        download: 50,
        upload: 10,
        latency: 30
      };
    }
  }

  /**
   * Calculate FPS (frames per second)
   * This uses requestAnimationFrame to measure actual rendering performance
   */
  public calculateFPS(callback: (fps: number) => void, duration: number = 1000): void {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const countFrames = (time: number) => {
      frameCount++;
      
      const elapsed = time - lastTime;
      if (elapsed >= duration) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        callback(fps);
        
        frameCount = 0;
        lastTime = time;
      }
      
      rafId = requestAnimationFrame(countFrames);
    };

    rafId = requestAnimationFrame(countFrames);

    // Return a function to stop measuring FPS
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }

  /**
   * Calculate frame time (milliseconds per frame)
   * This is the inverse of FPS and provides more granular performance data
   */
  public calculateFrameTime(callback: (frameTime: number) => void): void {
    let lastTime = performance.now();
    let rafId: number;

    const measureFrameTime = (time: number) => {
      const frameTime = time - lastTime;
      lastTime = time;
      
      callback(frameTime);
      rafId = requestAnimationFrame(measureFrameTime);
    };

    rafId = requestAnimationFrame(measureFrameTime);

    // Return a function to stop measuring frame time
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();