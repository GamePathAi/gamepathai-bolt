// src/lib/networkAI/utils/networkHelpers.ts

import { RouteNode } from '../models/types';

// Platform-specific imports handled in runtime
const isElectron = typeof window !== 'undefined' && window.electronAPI;

export async function ping(host: string, count: number = 4): Promise<number[]> {
  if (isElectron) {
    return window.electronAPI.ping(host, count);
  }
  
  // Web fallback - use fetch timing
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    try {
      await fetch(`https://${host}`, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      const end = performance.now();
      results.push(end - start);
    } catch {
      results.push(-1); // Failed ping
    }
  }
  return results;
}

export async function traceroute(host: string): Promise<RouteNode[]> {
  if (isElectron) {
    return window.electronAPI.traceroute(host);
  }
  
  // Web fallback - limited functionality
  console.warn('Traceroute not available in web environment');
  return [];
}

export async function getDNSServers(): Promise<string[]> {
  if (isElectron) {
    return window.electronAPI.getDNSServers();
  }
  
  // Default DNS servers for web
  return ['8.8.8.8', '8.8.4.4'];
}

export async function setDNSServers(primary: string, secondary: string): Promise<boolean> {
  if (isElectron) {
    return window.electronAPI.setDNSServers(primary, secondary);
  }
  
  console.warn('Cannot set DNS servers in web environment');
  return false;
}

export function calculateJitter(latencies: number[]): number {
  if (latencies.length < 2) return 0;
  
  const differences: number[] = [];
  for (let i = 1; i < latencies.length; i++) {
    differences.push(Math.abs(latencies[i] - latencies[i - 1]));
  }
  
  return differences.reduce((a, b) => a + b, 0) / differences.length;
}

export function calculatePacketLoss(results: number[]): number {
  const failed = results.filter(r => r < 0).length;
  return (failed / results.length) * 100;
}

// Game server endpoints for popular games
export const gameServerEndpoints = {
  'Counter-Strike 2': {
    regions: {
      'US East': ['162.254.192.0/24', '162.254.193.0/24'],
      'US West': ['162.254.194.0/24', '162.254.195.0/24'],
      'EU West': ['146.66.152.0/24', '146.66.153.0/24'],
      'EU East': ['146.66.155.0/24', '185.25.182.0/24'],
      'Asia': ['103.28.54.0/24', '103.10.124.0/24']
    },
    ports: [27015, 27016, 27017, 27018, 27019, 27020]
  },
  'Valorant': {
    regions: {
      'NA': ['valorant.na.pvp.net'],
      'EU': ['valorant.eu.pvp.net'],
      'APAC': ['valorant.apac.pvp.net'],
      'KR': ['valorant.kr.pvp.net']
    },
    ports: [8393, 8394, 8395]
  },
  'League of Legends': {
    regions: {
      'NA1': ['104.160.131.0/24', '104.160.141.0/24'],
      'EUW1': ['104.160.141.0/24', '104.160.142.0/24'],
      'EUNE1': ['104.160.142.0/24'],
      'BR1': ['104.160.152.0/24']
    },
    ports: [5222, 5223, 8393, 8394]
  },
  'Overwatch 2': {
    regions: {
      'Americas': ['24.105.30.129', '24.105.62.129'],
      'Europe': ['185.60.112.157', '185.60.114.159'],
      'Asia': ['121.254.206.1', '182.162.132.1']
    },
    ports: [3724, 1119, 6112]
  },
  'Fortnite': {
    regions: {
      'NAE': ['3.80.0.0/16', '52.200.0.0/16'],
      'NAW': ['52.52.0.0/16', '54.153.0.0/16'],
      'EU': ['52.16.0.0/16', '54.72.0.0/16'],
      'BR': ['18.228.0.0/16', '54.207.0.0/16']
    },
    ports: [5222, 5795, 5800, 5847]
  }
};

// Bandwidth test helper
export async function measureBandwidth(testUrl: string = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'): Promise<number> {
  try {
    const startTime = performance.now();
    const response = await fetch(testUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) throw new Error('Download failed');
    
    const data = await response.blob();
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // seconds
    const sizeInBits = data.size * 8;
    const speedBps = sizeInBits / duration;
    const speedMbps = speedBps / 1000000;
    
    return Math.round(speedMbps * 10) / 10;
  } catch (error) {
    console.error('Bandwidth test failed:', error);
    return 0;
  }
}