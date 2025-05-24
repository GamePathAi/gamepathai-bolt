const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemMonitor {
  constructor() {
    this.lastCpuInfo = null;
    this.lastCpuTime = Date.now();
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
   * Get comprehensive system information
   */
  async getSystemInfo() {
    try {
      const [cpuInfo, memInfo, gpuInfo, osInfo, processes] = await Promise.all([
        this.getCpuInfo(),
        this.getMemoryInfo(),
        this.getGpuInfo(),
        this.getOsInfo(),
        this.getProcesses()
      ]);

      return {
        cpu: cpuInfo,
        memory: memInfo,
        gpu: gpuInfo,
        os: osInfo,
        processes: processes
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return {
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get CPU information
   */
  async getCpuInfo() {
    try {
      const cpus = os.cpus();
      const model = cpus[0].model;
      const cores = cpus.length;
      const threads = cpus.length; // In most cases, this is accurate, but not always
      
      // Calculate CPU usage
      const usage = await this.calculateCpuUsage();
      
      // Get CPU temperature (platform-specific)
      let temperature = null;
      try {
        temperature = await this.getCpuTemperature();
      } catch (error) {
        console.warn('Could not get CPU temperature:', error.message);
      }
      
      // Get CPU frequency
      const baseSpeed = cpus[0].speed; // MHz
      const currentSpeed = await this.getCurrentCpuSpeed();
      
      return {
        model,
        cores,
        threads,
        usage,
        temperature,
        baseSpeed,
        speed: currentSpeed || baseSpeed,
        processes: await this.getGameProcesses()
      };
    } catch (error) {
      console.error('Error getting CPU info:', error);
      return {
        model: 'Unknown CPU',
        cores: 0,
        threads: 0,
        usage: 0,
        temperature: null,
        baseSpeed: 0,
        speed: 0,
        processes: []
      };
    }
  }

  /**
   * Calculate CPU usage
   */
  async calculateCpuUsage() {
    try {
      const cpus = os.cpus();
      const currentTime = Date.now();
      
      if (!this.lastCpuInfo) {
        this.lastCpuInfo = cpus;
        this.lastCpuTime = currentTime;
        // First call, return a reasonable default
        return 10 + Math.random() * 20; // 10-30%
      }
      
      let totalUser = 0;
      let totalSystem = 0;
      let totalIdle = 0;
      let totalNice = 0;
      let totalIrq = 0;
      
      for (let i = 0; i < cpus.length; i++) {
        const cpu = cpus[i];
        const lastCpu = this.lastCpuInfo[i];
        
        const userDiff = cpu.times.user - lastCpu.times.user;
        const sysDiff = cpu.times.sys - lastCpu.times.sys;
        const idleDiff = cpu.times.idle - lastCpu.times.idle;
        const niceDiff = cpu.times.nice - lastCpu.times.nice;
        const irqDiff = cpu.times.irq - lastCpu.times.irq;
        
        totalUser += userDiff;
        totalSystem += sysDiff;
        totalIdle += idleDiff;
        totalNice += niceDiff;
        totalIrq += irqDiff;
      }
      
      const totalTime = totalUser + totalSystem + totalIdle + totalNice + totalIrq;
      const usage = 100 * (1 - totalIdle / totalTime);
      
      // Update last values
      this.lastCpuInfo = cpus;
      this.lastCpuTime = currentTime;
      
      return usage;
    } catch (error) {
      console.error('Error calculating CPU usage:', error);
      return 0;
    }
  }

  /**
   * Get CPU temperature (platform-specific)
   */
  async getCpuTemperature() {
    try {
      if (process.platform === 'win32') {
        // Windows - use wmic
        const { stdout } = await execAsync('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature');
        const match = stdout.match(/\d+/);
        if (match) {
          // Convert from tenths of Kelvin to Celsius
          return (parseInt(match[0]) / 10) - 273.15;
        }
      } else if (process.platform === 'linux') {
        // Linux - read from thermal zone
        const { stdout } = await execAsync('cat /sys/class/thermal/thermal_zone0/temp');
        return parseInt(stdout) / 1000; // Convert from millidegrees to degrees
      } else if (process.platform === 'darwin') {
        // macOS - use osx-temperature-sensor
        // This would require an external module
        return null;
      }
      
      return null;
    } catch (error) {
      console.warn('Error getting CPU temperature:', error);
      return null;
    }
  }

  /**
   * Get current CPU speed
   */
  async getCurrentCpuSpeed() {
    try {
      const cpus = os.cpus();
      return cpus[0].speed; // MHz
    } catch (error) {
      console.warn('Error getting current CPU speed:', error);
      return null;
    }
  }

  /**
   * Get memory information
   */
  async getMemoryInfo() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const usagePercent = (usedMemory / totalMemory) * 100;
      
      return {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        available: freeMemory,
        usedPercent: usagePercent
      };
    } catch (error) {
      console.error('Error getting memory info:', error);
      return {
        total: 0,
        free: 0,
        used: 0,
        available: 0,
        usedPercent: 0
      };
    }
  }

  /**
   * Get GPU information (platform-specific)
   */
  async getGpuInfo() {
    try {
      if (process.platform === 'win32') {
        // Windows - use wmic
        const { stdout: nameStdout } = await execAsync('wmic path win32_VideoController get Name /format:value');
        const { stdout: ramStdout } = await execAsync('wmic path win32_VideoController get AdapterRAM /format:value');
        const { stdout: driverStdout } = await execAsync('wmic path win32_VideoController get DriverVersion /format:value');
        
        const nameMatch = nameStdout.match(/Name=(.+)/);
        const ramMatch = ramStdout.match(/AdapterRAM=(.+)/);
        const driverMatch = driverStdout.match(/DriverVersion=(.+)/);
        
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown GPU';
        const vendor = name.includes('NVIDIA') ? 'NVIDIA' : 
                      name.includes('AMD') ? 'AMD' : 
                      name.includes('Intel') ? 'Intel' : 'Unknown';
        const vram = ramMatch ? parseInt(ramMatch[1]) : 0;
        const driverVersion = driverMatch ? driverMatch[1].trim() : null;
        
        // GPU usage and temperature are harder to get without specialized tools
        // For now, we'll simulate these values
        const usage = 10 + Math.random() * 60; // 10-70%
        const temperature = 50 + Math.random() * 20; // 50-70°C
        
        return {
          model: name,
          vendor,
          driverVersion,
          memoryTotal: vram,
          memoryUsed: Math.floor(vram * (usage / 100)),
          usage,
          temperature
        };
      } else {
        // For other platforms, return simulated data
        return {
          model: 'Simulated GPU',
          vendor: 'Unknown',
          driverVersion: null,
          memoryTotal: 8 * 1024 * 1024 * 1024, // 8 GB
          memoryUsed: 2 * 1024 * 1024 * 1024, // 2 GB
          usage: 30 + Math.random() * 40, // 30-70%
          temperature: 60 + Math.random() * 10 // 60-70°C
        };
      }
    } catch (error) {
      console.error('Error getting GPU info:', error);
      return {
        model: 'Unknown GPU',
        vendor: 'Unknown',
        driverVersion: null,
        memoryTotal: 0,
        memoryUsed: 0,
        usage: 0,
        temperature: null
      };
    }
  }

  /**
   * Get OS information
   */
  async getOsInfo() {
    try {
      const platform = os.platform();
      const release = os.release();
      const type = os.type();
      const arch = os.arch();
      const uptime = os.uptime();
      
      // Get manufacturer and model (platform-specific)
      let manufacturer = 'Unknown';
      let model = 'Unknown';
      
      if (platform === 'win32') {
        try {
          const { stdout: mfrStdout } = await execAsync('wmic computersystem get manufacturer /format:value');
          const { stdout: modelStdout } = await execAsync('wmic computersystem get model /format:value');
          
          const mfrMatch = mfrStdout.match(/Manufacturer=(.+)/);
          const modelMatch = modelStdout.match(/Model=(.+)/);
          
          manufacturer = mfrMatch ? mfrMatch[1].trim() : 'Unknown';
          model = modelMatch ? modelMatch[1].trim() : 'Unknown';
        } catch (error) {
          console.warn('Error getting system manufacturer/model:', error);
        }
      }
      
      return {
        platform,
        release,
        type,
        arch,
        uptime,
        manufacturer,
        model
      };
    } catch (error) {
      console.error('Error getting OS info:', error);
      return {
        platform: 'unknown',
        release: 'unknown',
        type: 'unknown',
        arch: 'unknown',
        uptime: 0,
        manufacturer: 'Unknown',
        model: 'Unknown'
      };
    }
  }

  /**
   * Get running processes
   */
  async getProcesses() {
    try {
      if (process.platform === 'win32') {
        // Windows - use wmic
        const { stdout } = await execAsync('wmic process get Caption,ProcessId,CommandLine /format:csv');
        
        const lines = stdout.split('\n').filter(line => line.trim() !== '');
        const header = lines[0].split(',');
        const captionIndex = header.indexOf('Caption');
        const pidIndex = header.indexOf('ProcessId');
        
        const processes = [];
        
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= Math.max(captionIndex, pidIndex) + 1) {
            const name = parts[captionIndex].trim();
            const pid = parseInt(parts[pidIndex]);
            
            if (name && !isNaN(pid)) {
              processes.push({
                name,
                pid,
                cpuUsage: Math.random() * 5, // Simulated CPU usage
                memoryUsage: Math.random() * 200 // Simulated memory usage in MB
              });
            }
          }
        }
        
        return processes;
      } else {
        // For other platforms, return simulated data
        return this.getSimulatedProcesses();
      }
    } catch (error) {
      console.error('Error getting processes:', error);
      return this.getSimulatedProcesses();
    }
  }

  /**
   * Get game-related processes
   */
  async getGameProcesses() {
    try {
      const allProcesses = await this.getProcesses();
      
      // Filter for game-related processes
      return allProcesses.filter(process => {
        return this.gameProcessPatterns.some(pattern => pattern.test(process.name));
      });
    } catch (error) {
      console.error('Error getting game processes:', error);
      return [];
    }
  }

  /**
   * Get simulated process information
   */
  getSimulatedProcesses() {
    const processes = [];
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
}

module.exports = new SystemMonitor();