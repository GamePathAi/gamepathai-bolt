// System monitoring service - sem import de isElectron

class SystemMonitoringService {
  private interval: NodeJS.Timeout | null = null;
  private listeners: ((data: any) => void)[] = [];

  private isElectron() {
    return typeof window !== 'undefined' && window.electronAPI;
  }

  start(intervalMs: number = 1000) {
    if (!this.isElectron()) {
      console.log('System monitoring not available outside Electron');
      return;
    }

    if (this.interval) {
      this.stop();
    }

    this.interval = setInterval(async () => {
      try {
        const data = await window.electronAPI.system.getSystemStats();
        this.notifyListeners(data);
      } catch (error) {
        console.error('Error getting system stats:', error);
      }
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  subscribe(listener: (data: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }
}

export const systemMonitoringService = new SystemMonitoringService();
