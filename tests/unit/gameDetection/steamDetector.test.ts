import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSteamDetector } from '../../../src/hooks/detectors/useSteamDetector';
import { renderHook, act } from '@testing-library/react';

// Mock the localStorage hook
vi.mock('../../../src/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(true),
    removeItem: vi.fn().mockResolvedValue(true),
    error: null,
  }),
}));

// Mock the getSteamGames function
vi.mock('../../../src/lib/gameDetection/platforms/getSteamGames', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue([
    {
      id: 'steam-1174180',
      name: 'Red Dead Redemption 2',
      platform: 'Steam',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Red Dead Redemption 2',
      executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Red Dead Redemption 2\\RDR2.exe',
      process_name: 'RDR2.exe',
      size: 150 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
      optimized: false
    }
  ]),
}));

describe('Steam Detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: {
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
      },
      writable: true,
    });
  });

  it('should detect Steam games', async () => {
    const { result } = renderHook(() => useSteamDetector());
    
    let detectionResult;
    
    await act(async () => {
      detectionResult = await result.current.detect();
    });
    
    expect(detectionResult).toBeDefined();
    expect(detectionResult.platform).toBe('Steam');
    expect(detectionResult.games).toHaveLength(1);
    expect(detectionResult.games[0].name).toBe('Red Dead Redemption 2');
  });

  it('should use cache when available', async () => {
    // Override the mock to return cached data
    vi.mocked(require('../../../src/hooks/useLocalStorage').useLocalStorage).mockReturnValue({
      getItem: vi.fn().mockResolvedValue([
        {
          id: 'steam-cached',
          name: 'Cached Game',
          platform: 'Steam',
        }
      ]),
      setItem: vi.fn().mockResolvedValue(true),
      removeItem: vi.fn().mockResolvedValue(true),
      error: null,
    });
    
    const { result } = renderHook(() => useSteamDetector());
    
    let detectionResult;
    
    await act(async () => {
      detectionResult = await result.current.detect();
    });
    
    expect(detectionResult.games[0].name).toBe('Cached Game');
  });

  it('should handle errors gracefully', async () => {
    // Override the getSteamGames mock to throw an error
    vi.mocked(require('../../../src/lib/gameDetection/platforms/getSteamGames').default).mockRejectedValueOnce(
      new Error('Test error')
    );
    
    const { result } = renderHook(() => useSteamDetector());
    
    let detectionResult;
    
    await act(async () => {
      detectionResult = await result.current.detect();
    });
    
    expect(detectionResult.error).toBe('Test error');
    expect(detectionResult.games).toHaveLength(0);
  });
});