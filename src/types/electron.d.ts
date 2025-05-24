interface ElectronAPI {
  // File System API
  fs: {
    exists: (path: string) => Promise<boolean>;
    readDir: (path: string) => Promise<{
      name: string;
      isDirectory: boolean;
      isFile: boolean;
      path: string;
    }[]>;
    readFile: (path: string, encoding?: string) => Promise<string>;
    stat: (path: string) => Promise<{
      size: number;
      isDirectory: boolean;
      isFile: boolean;
      created: Date;
      modified: Date;
      accessed: Date;
    } | null>;
    getSystemPaths: () => Promise<{
      home: string;
      appData: string;
      userData: string;
      temp: string;
      desktop: string;
      documents: string;
      downloads: string;
      music: string;
      pictures: string;
      videos: string;
      logs: string;
      crashDumps: string;
    }>;
    getEnvVars: () => Promise<Record<string, string>>;
  };

  // Registry API
  registry: {
    getValue: (hive: number, key: string, valueName: string) => Promise<any>;
    enumerateValues: (hive: number, key: string) => Promise<any[]>;
    enumerateKeys: (hive: number, key: string) => Promise<string[]>;
  };

  // Registry constants
  Registry: {
    HKEY: {
      CLASSES_ROOT: number;
      CURRENT_USER: number;
      LOCAL_MACHINE: number;
      USERS: number;
      CURRENT_CONFIG: number;
    };
  };

  // Game API
  game: {
    launch: (executablePath: string, args?: string[]) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };

  // Monitoring functions
  monitoring?: {
    getSystemMetrics?: () => Promise<{
      success: boolean;
      data: any;
      error?: string;
    }>;
    runDiagnostics?: () => Promise<{
      success: boolean;
      data: any;
      error?: string;
    }>;
  };

  // Event system
  events?: {
    on?: (event: string, callback: (data: any) => void) => void;
    once?: (event: string, callback: (data: any) => void) => void;
    off?: (event: string, callback: (data: any) => void) => void;
    emit?: (event: string, data: any) => void;
    removeAll?: (event?: string) => void;
  };

  // Tray functions
  tray?: {
    updateGames?: (games: any[]) => {
      success: boolean;
      error?: string;
    };
  };

  // Utility functions
  utils?: {
    validateGame?: (gameData: any) => any;
    validateGameId?: (gameId: string) => string | null;
    sanitizeResult?: (result: any) => any;
    throttle?: (key: string, fn: () => Promise<any>, delay?: number) => Promise<any>;
    debounce?: (key: string, fn: () => Promise<any>, delay?: number) => Promise<any>;
    formatBytes?: (bytes: number, decimals?: number) => string;
    formatDuration?: (ms: number) => string;
    log?: {
      info: (message: string, data?: any) => void;
      success: (message: string, data?: any) => void;
      warn: (message: string, data?: any) => void;
      error: (message: string, data?: any) => void;
      debug: (message: string, data?: any) => void;
    };
  };

  // System information
  system?: {
    version: string;
    platform: string;
    build: {
      electron: string;
      node: string;
      chrome: string;
    };
    getStatus?: () => Promise<any>;
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