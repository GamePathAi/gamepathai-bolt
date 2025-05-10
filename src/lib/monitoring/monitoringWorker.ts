import * as Comlink from 'comlink';
import { processScanner } from '../gameDetection/processScanner';
import type { SystemMetrics } from '../systemOptimization/optimizer';

interface MonitoringWorker {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getMetrics: () => Promise<SystemMetrics>;
}

let monitoringInterval: number | null = null;
const MONITORING_INTERVAL = 100; // 100ms for real-time updates

const worker: MonitoringWorker = {
  startMonitoring() {
    if (monitoringInterval) return;

    monitoringInterval = setInterval(async () => {
      const metrics = await this.getMetrics();
      // @ts-ignore
      postMessage({ type: 'metrics', data: metrics });
    }, MONITORING_INTERVAL);
  },

  stopMonitoring() {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  },

  async getMetrics(): Promise<SystemMetrics> {
    const gameProcesses = await processScanner.scanForGames();
    const metrics: SystemMetrics = {
      cpu: {
        usage: 0,
        temperature: 0,
        frequency: 0,
        processes: []
      },
      memory: {
        used: 0,
        available: 0,
        swapUsage: 0
      },
      gpu: {
        usage: 0,
        temperature: 0,
        memoryUsed: 0,
        memoryTotal: 0
      },
      network: {
        latency: 0,
        bandwidth: 0,
        packetLoss: 0
      }
    };

    // Update metrics with real process data
    for (const process of gameProcesses) {
      const details = await processScanner.getGameDetails(process);
      metrics.cpu.processes.push({
        pid: process.pid,
        name: process.name,
        cpuUsage: details.usage.cpu,
        memoryUsage: details.usage.memory,
        priority: 0
      });
    }

    return metrics;
  }
};

Comlink.expose(worker);

export type { MonitoringWorker };