// tests/setup.ts
import '@testing-library/jest-dom';

// Mock Electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    fs: {
      exists: jest.fn().mockResolvedValue(true),
      readDir: jest.fn().mockResolvedValue([]),
      readFile: jest.fn().mockResolvedValue(''),
      stat: jest.fn().mockResolvedValue({}),
      getSystemPaths: jest.fn().mockResolvedValue({
        home: '/home/user',
        appData: '/home/user/AppData',
        userData: '/home/user/AppData/Roaming',
      }),
      getEnvVars: jest.fn().mockResolvedValue({
        LOCALAPPDATA: '/home/user/AppData/Local',
        USERPROFILE: '/home/user',
      }),
    },
    registry: {
      getValue: jest.fn().mockResolvedValue(null),
      enumerateValues: jest.fn().mockResolvedValue([]),
      enumerateKeys: jest.fn().mockResolvedValue([]),
    },
    Registry: {
      HKEY: {
        CLASSES_ROOT: 0,
        CURRENT_USER: 1,
        LOCAL_MACHINE: 2,
        USERS: 3,
        CURRENT_CONFIG: 4,
      },
    },
    game: {
      launch: jest.fn().mockResolvedValue({ success: true }),
    },
    monitoring: {
      getSystemMetrics: jest.fn().mockResolvedValue({ success: true, data: {} }),
      runDiagnostics: jest.fn().mockResolvedValue({ success: true, data: {} }),
    },
    events: {
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAll: jest.fn(),
    },
    tray: {
      updateGames: jest.fn().mockReturnValue({ success: true }),
    },
    utils: {
      validateGame: jest.fn(),
      validateGameId: jest.fn(),
      sanitizeResult: jest.fn(),
      throttle: jest.fn(),
      debounce: jest.fn(),
      formatBytes: jest.fn(),
      formatDuration: jest.fn(),
      log: {
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
    },
    system: {
      version: '3.0.0',
      platform: 'win32',
      build: {
        electron: '29.4.6',
        node: '18.16.0',
        chrome: '123.0.0',
      },
      getStatus: jest.fn().mockResolvedValue({}),
    },
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});