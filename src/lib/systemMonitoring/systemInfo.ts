import { hardwareDetector, HardwareInfo } from './hardwareDetection';
import { performanceMonitor, PerformanceMetrics } from './performanceMonitor';

export interface SystemMetrics {
  hardware: HardwareInfo;
  performance: PerformanceMetrics;
  timestamp: number;
}

export interface SystemInfoOptions {
  includeHardware?: boolean;
  includePerformance?: boolean;
}

/**
 * System information class for retrieving combined system metrics
 */
class SystemInfoService {
  private static instance: SystemInfoService;

  private constructor() {}

  public static getInstance(): SystemInfoService {
    if (!SystemInfoService.instance) {
      SystemInfoService.instance = new SystemInfoService();
    }
    return SystemInfoService.instance;
  }

  /**
   * Get complete system metrics
   */
  public async getSystemMetrics(options: SystemInfoOptions = {}): Promise<SystemMetrics> {
    const includeHardware = options.includeHardware !== false;
    const includePerformance = options.includePerformance !== false;

    // Get hardware info if requested
    const hardware = includeHardware 
      ? await hardwareDetector.getHardwareInfo()
      : await this.getMinimalHardwareInfo();

    // Get performance metrics if requested
    const performance = includePerformance
      ? performanceMonitor.getCurrentMetrics() || await this.getMinimalPerformanceMetrics()
      : await this.getMinimalPerformanceMetrics();

    return {
      hardware,
      performance,
      timestamp: Date.now()
    };
  }

  /**
   * Get minimal hardware information (for when full info is not needed)
   */
  private async getMinimalHardwareInfo(): Promise<HardwareInfo> {
    return {
      cpu: {
        name: 'CPU',
        cores: 0,
        threads: 0,
        baseSpeed: 0,
        currentSpeed: 0,
        usage: 0
      },
      memory: {
        total: 0,
        available: 0,
        used: 0,
        usage: 0
      },
      gpu: {
        name: 'GPU',
        vendor: 'Unknown',
        memory: {
          total: 0,
          used: 0
        },
        usage: 0
      },
      system: {
        os: 'Unknown',
        manufacturer: 'Unknown',
        model: 'Unknown',
        version: 'Unknown',
        uptime: 0
      }
    };
  }

  /**
   * Get minimal performance metrics (for when full metrics are not needed)
   */
  private async getMinimalPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      timestamp: Date.now(),
      cpu: {
        usage: 0
      },
      memory: {
        usage: 0
      },
      gpu: {
        usage: 0
      }
    };
  }

  /**
   * Start monitoring system performance
   */
  public startMonitoring(interval?: number): void {
    performanceMonitor.startMonitoring({ interval });
  }

  /**
   * Stop monitoring system performance
   */
  public stopMonitoring(): void {
    performanceMonitor.stopMonitoring();
  }

  /**
   * Subscribe to performance metrics updates
   */
  public subscribeToMetrics(callback: (metrics: PerformanceMetrics) => void): () => void {
    return performanceMonitor.subscribe(callback);
  }

  /**
   * Get performance metrics history
   */
  public getMetricsHistory(): PerformanceMetrics[] {
    return performanceMonitor.getMetricsHistory();
  }

  /**
   * Run system diagnostics
   */
  public async runDiagnostics(): Promise<any> {
    try {
      // Get complete system information
      const hardware = await hardwareDetector.getHardwareInfo();
      const processes = await performanceMonitor.getRunningProcesses();
      const network = await performanceMonitor.getNetworkPerformance();
      
      // Check for potential issues
      const issues = this.detectSystemIssues(hardware, processes);
      
      return {
        hardware,
        processes: processes.slice(0, 10), // Limit to top 10 processes
        network,
        issues,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error running system diagnostics:', error);
      throw error;
    }
  }

  /**
   * Detect potential system issues
   */
  private detectSystemIssues(hardware: HardwareInfo, processes: any[]): any[] {
    const issues = [];
    
    // Check CPU usage
    if (hardware.cpu.usage > 80) {
      issues.push({
        component: 'CPU',
        severity: 'high',
        message: `High CPU usage (${hardware.cpu.usage.toFixed(1)}%)`,
        recommendation: 'Close unnecessary applications or optimize CPU settings'
      });
    }
    
    // Check CPU temperature
    if (hardware.cpu.temperature && hardware.cpu.temperature > 80) {
      issues.push({
        component: 'CPU',
        severity: 'critical',
        message: `High CPU temperature (${hardware.cpu.temperature.toFixed(1)}°C)`,
        recommendation: 'Check cooling system and reduce CPU load'
      });
    }
    
    // Check memory usage
    if (hardware.memory.usage > 90) {
      issues.push({
        component: 'Memory',
        severity: 'high',
        message: `High memory usage (${hardware.memory.usage.toFixed(1)}%)`,
        recommendation: 'Close memory-intensive applications or add more RAM'
      });
    }
    
    // Check GPU usage
    if (hardware.gpu.usage > 90) {
      issues.push({
        component: 'GPU',
        severity: 'medium',
        message: `High GPU usage (${hardware.gpu.usage.toFixed(1)}%)`,
        recommendation: 'Lower graphics settings in games or applications'
      });
    }
    
    // Check GPU temperature
    if (hardware.gpu.temperature && hardware.gpu.temperature > 85) {
      issues.push({
        component: 'GPU',
        severity: 'high',
        message: `High GPU temperature (${hardware.gpu.temperature.toFixed(1)}°C)`,
        recommendation: 'Improve GPU cooling or reduce graphics settings'
      });
    }
    
    return issues;
  }

  /**
   * Get detailed OS information
   */
  public async getOSInfo(): Promise<any> {
    try {
      const hardware = await hardwareDetector.getHardwareInfo();
      
      return {
        name: hardware.system.os,
        version: hardware.system.version,
        architecture: typeof process !== 'undefined' ? process.arch : 'unknown',
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
        manufacturer: hardware.system.manufacturer,
        model: hardware.system.model,
        uptime: hardware.system.uptime,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        userInfo: {
          username: 'current-user', // For security, we don't expose the actual username
          homedir: 'user-home-directory' // For security, we don't expose the actual home directory
        }
      };
    } catch (error) {
      console.error('Error getting OS info:', error);
      return {
        name: 'Unknown OS',
        version: 'Unknown',
        architecture: 'unknown',
        platform: 'unknown'
      };
    }
  }

  /**
   * Get system environment variables (safe ones only)
   */
  public async getEnvironmentVariables(): Promise<Record<string, string>> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.fs?.getEnvVars) {
        const envVars = await window.electronAPI.fs.getEnvVars();
        
        // Filter out sensitive environment variables
        const safeEnvVars: Record<string, string> = {};
        const allowedVars = [
          'LANG', 'LANGUAGE', 'LC_ALL', 'TERM', 'DISPLAY', 
          'SHELL', 'DESKTOP_SESSION', 'XDG_CURRENT_DESKTOP',
          'LOGNAME', 'USER', 'USERNAME', 'COMPUTERNAME', 'HOSTNAME'
        ];
        
        for (const key of allowedVars) {
          if (envVars[key]) {
            safeEnvVars[key] = envVars[key];
          }
        }
        
        return safeEnvVars;
      }
      
      return {};
    } catch (error) {
      console.error('Error getting environment variables:', error);
      return {};
    }
  }

  /**
   * Get system paths (safe ones only)
   */
  public async getSystemPaths(): Promise<Record<string, string>> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.fs?.getSystemPaths) {
        const paths = await window.electronAPI.fs.getSystemPaths();
        
        // Filter out sensitive paths
        const safePaths: Record<string, string> = {};
        const allowedPaths = [
          'desktop', 'documents', 'downloads', 'music', 
          'pictures', 'videos', 'temp'
        ];
        
        for (const key of allowedPaths) {
          if (paths[key]) {
            safePaths[key] = paths[key];
          }
        }
        
        return safePaths;
      }
      
      return {};
    } catch (error) {
      console.error('Error getting system paths:', error);
      return {};
    }
  }
}

export const systemInfoService = SystemInfoService.getInstance();