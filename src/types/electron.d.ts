interface ElectronAPI {
  // Game functions
  scanGames: () => Promise<{
    success: boolean;
    data: GameInfo[];
    errors: string[];
  }>;
  getInstalledGames?: () => Promise<GameInfo[]>;
  validateGameFiles?: (gameId: string) => Promise<boolean>;
  launchGame?: (gameId: string) => Promise<boolean>;
  optimizeGame?: (gameId: string, profile?: string, settings?: any) => Promise<boolean>;
  
  // Tray functions
  updateTrayGames: (games: GameInfo[]) => Promise<GameInfo[]>;
  getGamesForTray: () => Promise<GameInfo[]>;
  
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
    actions: string[];
    error?: string;
  }>;
  optimizeMemory: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    actions: string[];
    error?: string;
  }>;
  optimizeGPU: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    actions: string[];
    error?: string;
  }>;
  optimizeNetwork: (options: any) => Promise<{
    success: boolean;
    improvement: number;
    actions: string[];
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
  getVpnServers: () => Promise<any[]>;
  connectToVpn: (server: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  disconnectFromVpn: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  getVpnStatus: () => Promise<{
    isConnected: boolean;
    server?: any;
    connectionTime?: Date;
    metrics?: {
      download: number;
      upload: number;
      latency: number;
      uptime: string;
    };
  }>;
  testVpnSpeed: () => Promise<{
    download: number;
    upload: number;
    latency: number;
  }>;
  
  // Notification function
  showNotification: (options: {
    title?: string;
    body?: string;
    icon?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // Diagnostic function
  listDetectedGames: () => Promise<{
    totalGames: number;
    detailedResults: Record<string, any[]>;
    error?: string;
  }>;
  
  // Test function
  testElectronAPI: () => Promise<{
    success: boolean;
    message: string;
  }>;
}

interface IpcRenderer {
  on: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
  ipcRenderer?: IpcRenderer;
}