interface ElectronAPI {
  // Game functions
  games: {
    scan: () => Promise<{
      success: boolean;
      data: any[];
      errors?: string[];
    }>;
    scanXbox: () => Promise<{
      success: boolean;
      data: any[];
      errors?: string[];
    }>;
    validate: (gameId: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    clearCache: () => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
  
  // Launcher functions
  launcher: {
    launch: (game: any, profile?: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    launchStandard: (game: any, profile?: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    quickLaunch: (gameId: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    getRunning: () => Promise<{
      success: boolean;
      data: any[];
      error?: string;
    }>;
  };
  
  // Optimization functions
  optimization: {
    optimizeForGame: (game: any, profile?: string) => Promise<{
      success: boolean;
      improvements?: {
        fps: number;
        latency: number;
        stability: number;
      };
      error?: string;
    }>;
    optimizeSystem: (profile?: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    getProfiles: () => Promise<{
      success: boolean;
      data: any[];
      error?: string;
    }>;
  };
  
  // Monitoring functions
  monitoring: {
    getSystemMetrics: () => Promise<{
      success: boolean;
      data: any;
      error?: string;
    }>;
    runDiagnostics: () => Promise<{
      success: boolean;
      data: any;
      error?: string;
    }>;
  };
  
  // Profile functions
  profiles: {
    get: (gameId: string) => Promise<{
      success: boolean;
      data: any;
      error?: string;
    }>;
    save: (gameId: string, profile: any) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
  
  // Backup functions
  backup: {
    create: () => Promise<{
      success: boolean;
      error?: string;
    }>;
    list: () => Promise<{
      success: boolean;
      data: any[];
      error?: string;
    }>;
  };
  
  // Event system
  events: {
    on: (event: string, callback: (data: any) => void) => void;
    once: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
    emit: (event: string, data: any) => void;
    removeAll: (event?: string) => void;
  };
  
  // Tray functions
  tray: {
    updateGames: (games: any[]) => {
      success: boolean;
      error?: string;
    };
  };
  
  // Utility functions
  utils: {
    validateGame: (gameData: any) => any;
    validateGameId: (gameId: string) => string | null;
    sanitizeResult: (result: any) => any;
    throttle: (key: string, fn: () => Promise<any>, delay?: number) => Promise<any>;
    debounce: (key: string, fn: () => Promise<any>, delay?: number) => Promise<any>;
    formatBytes: (bytes: number, decimals?: number) => string;
    formatDuration: (ms: number) => string;
    log: {
      info: (message: string, data?: any) => void;
      success: (message: string, data?: any) => void;
      warn: (message: string, data?: any) => void;
      error: (message: string, data?: any) => void;
      debug: (message: string, data?: any) => void;
    };
  };
  
  // System information
  system: {
    version: string;
    platform: string;
    build: {
      electron: string;
      node: string;
      chrome: string;
    };
    getStatus: () => Promise<any>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
  gamePathAI?: ElectronAPI; // Alias
  ipcRenderer?: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };
}