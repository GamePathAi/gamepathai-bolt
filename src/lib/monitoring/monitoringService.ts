import * as Comlink from 'comlink';
import type { MonitoringWorker } from './monitoringWorker';
import type { SystemMetrics } from '../systemOptimization/optimizer';

class MonitoringService {
  private static instance: MonitoringService;
  private worker: Comlink.Remote<MonitoringWorker> | null = null;
  private listeners: Set<(metrics: SystemMetrics) => void> = new Set();

  private constructor() {
    this.initializeWorker();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeWorker() {
    const workerUrl = new URL('./monitoringWorker', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });
    this.worker = Comlink.wrap<MonitoringWorker>(worker);

    worker.addEventListener('message', (event) => {
      if (event.data.type === 'metrics') {
        this.notifyListeners(event.data.data);
      }
    });
  }

  public startMonitoring() {
    this.worker?.startMonitoring();
  }

  public stopMonitoring() {
    this.worker?.stopMonitoring();
  }

  public subscribe(callback: (metrics: SystemMetrics) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(metrics: SystemMetrics) {
    this.listeners.forEach(listener => listener(metrics));
  }

  public async getMetrics(): Promise<SystemMetrics | null> {
    if (!this.worker) return null;
    return await this.worker.getMetrics();
  }
}

export const monitoringService = MonitoringService.getInstance();