interface ElectronAPI {
  // Game functions
  scanGames: () => Promise<{
    steam: any[];
    epic: any[];
    xbox: any[];
  }>;
  launchGame: (game: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  optimizeGame: (game: any, profile: string, settings?: any) => Promise<{
    success: boolean;
    improvements: {
      fps: number;
      latency: number;
      stability: number;
    };
    appliedSettings: Record<string, any>;
    error?: string;
  }>;
  
  // System functions
  getSystemInfo: () => Promise<{
    cpu: {
      usage: number;
      temperature: number;
      frequency: number;
      processes: any[];
    };
    memory: {
      used: number;
      available: number;
      swapUsage: number;
    };
    gpu: {
      usage: number;
      temperature: number;
      memoryUsed: number;
      memoryTotal: number;
    };
    network: {
      latency: number;
      bandwidth: number;
      packetLoss: number;
    };
  }>;
  
  // Optimization functions
  optimizeCPU: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    error?: string;
  }>;
  optimizeMemory: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    error?: string;
  }>;
  optimizeGPU: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    error?: string;
  }>;
  optimizeNetwork: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    error?: string;
  }>;
  
  // Network functions
  measureNetworkPerformance: () => Promise<{
    latency: number;
    jitter: number;
    packetLoss: number;
    bandwidth: number;
    routeHops: any[];
  }>;
  getAvailableRoutes: () => Promise<any[]>;
  connectToRoute: (route: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  disconnectFromRoute: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // VPN functions
  connectToVpn: (server: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  disconnectFromVpn: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}