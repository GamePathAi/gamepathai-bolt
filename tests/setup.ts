// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    fs: {
      exists: vi.fn().mockResolvedValue(true),
      readDir: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(''),
      stat: vi.fn().mockResolvedValue({}),
      getSystemPaths: vi.fn().mockResolvedValue({
        home: '/home/user',
        appData: '/home/user/AppData',
        userData: '/home/user/AppData/Roaming',
      }),
      getEnvVars: vi.fn().mockResolvedValue({
        LOCALAPPDATA: '/home/user/AppData/Local',
        USERPROFILE: '/home/user',
      }),
    },
    registry: {
      getValue: vi.fn().mockResolvedValue(null),
      enumerateValues: vi.fn().mockResolvedValue([]),
      enumerateKeys: vi.fn().mockResolvedValue([]),
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
      launch: vi.fn().mockResolvedValue({ success: true }),
    },
    monitoring: {
      getSystemMetrics: vi.fn().mockResolvedValue({ success: true, data: {} }),
      runDiagnostics: vi.fn().mockResolvedValue({ success: true, data: {} }),
    },
    events: {
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      removeAll: vi.fn(),
    },
    tray: {
      updateGames: vi.fn().mockReturnValue({ success: true }),
    },
    utils: {
      validateGame: vi.fn(),
      validateGameId: vi.fn(),
      sanitizeResult: vi.fn(),
      throttle: vi.fn(),
      debounce: vi.fn(),
      formatBytes: vi.fn(),
      formatDuration: vi.fn(),
      log: {
        info: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
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
      getStatus: vi.fn().mockResolvedValue({}),
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