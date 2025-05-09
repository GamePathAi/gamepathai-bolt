import { supabase } from '../supabase';

export interface GameMetrics {
  userId: string;
  gameId: string;
  timestamp: number;
  metrics: {
    mouse: MouseMetrics;
    keyboard: KeyboardMetrics;
    performance: PerformanceMetrics;
    network: NetworkMetrics;
  };
}

interface MouseMetrics {
  movements: {
    x: number;
    y: number;
    timestamp: number;
    velocity: number;
    acceleration: number;
  }[];
  clicks: {
    x: number;
    y: number;
    timestamp: number;
    type: 'left' | 'right';
    target: string;
  }[];
}

interface KeyboardMetrics {
  keyPresses: {
    key: string;
    timestamp: number;
    duration: number;
  }[];
  combinations: {
    keys: string[];
    timestamp: number;
    duration: number;
  }[];
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
}

interface NetworkMetrics {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  jitter: number;
}

class DataCollector {
  private static instance: DataCollector;
  private isCollecting: boolean = false;
  private batchSize: number = 100;
  private flushInterval: number = 5000; // 5 seconds
  private metricsBuffer: GameMetrics[] = [];
  private lastFlush: number = Date.now();

  private constructor() {
    this.setupFlushInterval();
  }

  public static getInstance(): DataCollector {
    if (!DataCollector.instance) {
      DataCollector.instance = new DataCollector();
    }
    return DataCollector.instance;
  }

  private setupFlushInterval() {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics();
      }
    }, this.flushInterval);
  }

  public startCollection() {
    if (this.isCollecting) return;
    this.isCollecting = true;
    this.setupEventListeners();
  }

  public stopCollection() {
    if (!this.isCollecting) return;
    this.isCollecting = false;
    this.removeEventListeners();
    this.flushMetrics(); // Flush remaining metrics
  }

  private setupEventListeners() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('click', this.handleClick);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private removeEventListeners() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('click', this.handleClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.isCollecting) return;

    const metrics: GameMetrics = {
      userId: this.getCurrentUserId(),
      gameId: this.getCurrentGameId(),
      timestamp: Date.now(),
      metrics: {
        mouse: {
          movements: [{
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now(),
            velocity: this.calculateVelocity(event),
            acceleration: this.calculateAcceleration(event)
          }],
          clicks: []
        },
        keyboard: { keyPresses: [], combinations: [] },
        performance: this.collectPerformanceMetrics(),
        network: this.collectNetworkMetrics()
      }
    };

    this.addMetricsToBatch(metrics);
  };

  private handleClick = (event: MouseEvent) => {
    if (!this.isCollecting) return;

    const metrics: GameMetrics = {
      userId: this.getCurrentUserId(),
      gameId: this.getCurrentGameId(),
      timestamp: Date.now(),
      metrics: {
        mouse: {
          movements: [],
          clicks: [{
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now(),
            type: event.button === 0 ? 'left' : 'right',
            target: (event.target as HTMLElement).tagName
          }]
        },
        keyboard: { keyPresses: [], combinations: [] },
        performance: this.collectPerformanceMetrics(),
        network: this.collectNetworkMetrics()
      }
    };

    this.addMetricsToBatch(metrics);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    // Implementation for keyboard metrics collection
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    // Implementation for keyboard metrics collection
  };

  private collectPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: this.calculateFPS(),
      frameTime: performance.now(),
      cpuUsage: this.estimateCPUUsage(),
      memoryUsage: performance.memory?.usedJSHeapSize || 0,
      gpuUsage: this.estimateGPUUsage()
    };
  }

  private collectNetworkMetrics(): NetworkMetrics {
    return {
      latency: this.measureLatency(),
      packetLoss: this.calculatePacketLoss(),
      bandwidth: this.estimateBandwidth(),
      jitter: this.calculateJitter()
    };
  }

  private addMetricsToBatch(metrics: GameMetrics) {
    this.metricsBuffer.push(metrics);

    if (this.metricsBuffer.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const { error } = await supabase
        .from('game_metrics')
        .insert(this.metricsBuffer);

      if (error) throw error;

      this.metricsBuffer = [];
      this.lastFlush = Date.now();
    } catch (error) {
      console.error('Error flushing metrics:', error);
      // Implement retry logic here
    }
  }

  // Utility methods
  private calculateVelocity(event: MouseEvent): number {
    // Implementation for mouse velocity calculation
    return 0;
  }

  private calculateAcceleration(event: MouseEvent): number {
    // Implementation for mouse acceleration calculation
    return 0;
  }

  private calculateFPS(): number {
    // Implementation for FPS calculation
    return 60;
  }

  private estimateCPUUsage(): number {
    // Implementation for CPU usage estimation
    return 0;
  }

  private estimateGPUUsage(): number {
    // Implementation for GPU usage estimation
    return 0;
  }

  private measureLatency(): number {
    // Implementation for latency measurement
    return 0;
  }

  private calculatePacketLoss(): number {
    // Implementation for packet loss calculation
    return 0;
  }

  private estimateBandwidth(): number {
    // Implementation for bandwidth estimation
    return 0;
  }

  private calculateJitter(): number {
    // Implementation for jitter calculation
    return 0;
  }

  private getCurrentUserId(): string {
    return supabase.auth.getUser()?.data?.user?.id || '';
  }

  private getCurrentGameId(): string {
    // Implementation to get current game ID
    return '';
  }
}

export const dataCollector = DataCollector.getInstance();