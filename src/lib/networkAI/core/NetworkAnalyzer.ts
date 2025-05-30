// src/lib/networkAI/core/NetworkAnalyzer.ts

import { NetworkAnalysis, ServerInfo, NetworkDiagnostics, NetworkIssue, NetworkRegion } from '../models/types';

export class NetworkAnalyzer {
  private cache: Map<string, { data: NetworkAnalysis; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute

  async analyzeConnection(targetServer: string): Promise<NetworkAnalysis> {
    const cached = this.getFromCache(targetServer);
    if (cached) return cached;

    const latency = await this.measureLatency({ testUrl: targetServer } as NetworkRegion);
    
    const analysis: NetworkAnalysis = {
      latency,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      route: [],
      timestamp: new Date()
    };

    this.cache.set(targetServer, {
      data: analysis,
      timestamp: Date.now()
    });

    return analysis;
  }

  async findBestServer(servers: ServerInfo[]): Promise<ServerInfo> {
    const results = await Promise.all(
      servers.map(async (server) => {
        const latency = await this.measureLatency({ testUrl: server.ip } as NetworkRegion);
        return {
          ...server,
          latency,
          quality: this.calculateServerQuality(server, {
            latency,
            jitter: 0,
            packetLoss: 0,
            bandwidth: 0,
            route: [],
            timestamp: new Date()
          })
        };
      })
    );

    results.sort((a, b) => b.quality - a.quality);
    return results[0];
  }

  private calculateServerQuality(server: ServerInfo, analysis: NetworkAnalysis): number {
    let score = 100;

    if (analysis.latency < 20) score -= 0;
    else if (analysis.latency < 50) score -= 10;
    else if (analysis.latency < 100) score -= 30;
    else score -= 50;

    if (analysis.jitter > 10) score -= 20;
    else if (analysis.jitter > 5) score -= 10;

    score -= analysis.packetLoss * 10;

    const loadRatio = server.players / server.maxPlayers;
    if (loadRatio > 0.9) score -= 20;
    else if (loadRatio > 0.7) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  async measureLatency(region: NetworkRegion): Promise<number> {
    try {
      const testUrl = region.testUrl || 'https://www.google.com';
      const samples = 5;
      let results: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          await fetch(testUrl, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const latency = Date.now() - start;
          results.push(latency);
        } catch (error) {
          results.push(999);
        }
        
        if (i < samples - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (!Array.isArray(results) || results.length === 0) {
        return 999;
      }
      
      const sorted = [...results].sort((a, b) => a - b);
      const trimmed = sorted.slice(1, -1);
      
      if (trimmed.length === 0) {
        return sorted[0] || 999;
      }
      
      return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
    } catch (error) {
      console.error('Error measuring latency:', error);
      return 999;
    }
  }

  private getFromCache(key: string): NetworkAnalysis | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }
}
