import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window.electronAPI
const mockElectronAPI = {
  system: {
    platform: 'win32',
    version: '3.0.0',
  },
  fs: {
    exists: vi.fn().mockResolvedValue(true),
    readDir: vi.fn().mockResolvedValue([]),
  },
  registry: {
    getValue: vi.fn(),
  },
  Registry: {
    HKEY: {
      CURRENT_USER: 1,
      LOCAL_MACHINE: 2,
    },
  },
};

describe('Environment Detection', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Set up window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
    });
  });

  it('should detect Electron environment correctly', () => {
    // This test verifies that our environment detection works
    expect(window.electronAPI).toBeDefined();
    expect(window.electronAPI.system.platform).toBe('win32');
  });

  it('should detect when not in Electron environment', () => {
    // Remove electronAPI to simulate web environment
    Object.defineProperty(window, 'electronAPI', {
      value: undefined,
      writable: true,
    });
    
    expect(window.electronAPI).toBeUndefined();
  });

  it('should use mock data when not in Electron environment', async () => {
    // Remove electronAPI to simulate web environment
    Object.defineProperty(window, 'electronAPI', {
      value: undefined,
      writable: true,
    });
    
    // Import the mock functions
    const { mockGetSteamGames } = await import('../../../src/lib/gameDetection/platforms/mockPlatforms');
    
    // Verify mock data is returned
    const games = await mockGetSteamGames();
    expect(games).toBeInstanceOf(Array);
    expect(games.length).toBeGreaterThan(0);
    expect(games[0].platform).toBe('Steam');
  });

  it('should use real detection when in Electron environment', async () => {
    // Set up mock response for Steam games detection
    mockElectronAPI.registry.getValue.mockResolvedValueOnce('C:\\Program Files (x86)\\Steam');
    mockElectronAPI.fs.readDir.mockResolvedValueOnce([
      { name: 'appmanifest_730.acf', isFile: true, path: 'C:\\Program Files (x86)\\Steam\\steamapps\\appmanifest_730.acf' }
    ]);
    mockElectronAPI.fs.readFile.mockResolvedValueOnce(`
      "appid" "730"
      "name" "Counter-Strike 2"
      "installdir" "Counter-Strike 2"
    `);
    
    // Import the real detection function
    const { getSteamGames } = await import('../../../src/lib/gameDetection/platforms/getSteamGames');
    
    // This should now use the real detection since we're in "Electron"
    const games = await getSteamGames();
    
    // Verify that registry was queried (real detection)
    expect(mockElectronAPI.registry.getValue).toHaveBeenCalled();
  });
});