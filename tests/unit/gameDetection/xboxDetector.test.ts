import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useXboxDetector } from '../../../src/hooks/detectors/useXboxDetector';
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

// Mock the getXboxGames function
vi.mock('../../../src/lib/gameDetection/platforms/getXboxGames', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue([
    {
      id: 'xbox-callofduty',
      name: 'Call of Duty',
      platform: 'Xbox',
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.CallofDuty',
      executablePath: 'C:\\Program Files\\WindowsApps\\Microsoft.CallofDuty\\ModernWarfare.exe',
      process_name: 'ModernWarfare.exe',
      size: 120 * 1024,
      icon_url: 'https://store-images.s-microsoft.com/image/apps.52300.13809253608509332.c7976381-1225-4b5a-9f1e-5f3d97c20809.be6d75e9-e8c5-4de9-9b6c-8a0b2f79e56a',
      optimized: false
    }
  ]),
}));

describe('Xbox Detector', () => {
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

  it('should detect Xbox games', async () => {
    const { result } = renderHook(() => useXboxDetector());
    
    let detectionResult;
    
    await act(async () => {
      detectionResult = await result.current.detect();
    });
    
    expect(detectionResult).toBeDefined();
    expect(detectionResult.platform).toBe('Xbox');
    expect(detectionResult.games).toHaveLength(1);
    expect(detectionResult.games[0].name).toBe('Call of Duty');
  });

  it('should use cache when available', async () => {
    // Override the mock to return cached data
    vi.mocked(require('../../../src/hooks/useLocalStorage').useLocalStorage).mockReturnValue({
      getItem: vi.fn().mockResolvedValue([
        {
          id: 'xbox-cached',
          name: 'Cached Xbox Game',
          platform: 'Xbox',
        }
      ]),
      setItem: vi.fn().mockResolvedValue(true),
      removeItem: vi.fn().mockResolvedValue(true),
      error: null,
    });
    
    const { result } = renderHook(() => useXboxDetector());
    
    let detectionResult;
    
    await act(async () => {
      detectionResult = await result.current.detect();
    });
    
    expect(detectionResult.games[0].name).toBe('Cached Xbox Game');
  });

  it('should handle errors gracefully', async () => {
    // Override the getXboxGames mock to throw an error
    vi.mocked(require('../../../src/lib/gameDetection/platforms/getXboxGames').default).mockRejectedValueOnce(
      new Error('Test error')
    );
    
    const { result } = renderHook(() => useXboxDetector());
    
    let detectionResult;
    
    await act(async () => {
      detectionResult = await result.current.detect();
    });
    
    expect(detectionResult.error).toBe('Test error');
    expect(detectionResult.games).toHaveLength(0);
  });
});