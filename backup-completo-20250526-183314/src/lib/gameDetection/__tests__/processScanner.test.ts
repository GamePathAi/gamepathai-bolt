import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessScanner } from '../processScanner';
import * as si from 'systeminformation';

vi.mock('systeminformation');
vi.mock('../../supabase');

describe('ProcessScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect game processes', async () => {
    const mockProcesses = {
      list: [
        { pid: 1, name: 'steam.exe', path: 'C:\\Steam\\steam.exe', cpu: 2, memRss: 1024 },
        { pid: 2, name: 'notepad.exe', path: 'C:\\Windows\\notepad.exe', cpu: 1, memRss: 512 },
        { pid: 3, name: 'LeagueClient.exe', path: 'D:\\Games\\League of Legends\\LeagueClient.exe', cpu: 5, memRss: 2048 },
      ]
    };

    vi.mocked(si.processes).mockResolvedValue(mockProcesses);

    const scanner = ProcessScanner.getInstance();
    const gameProcesses = await scanner.scanForGames();

    expect(gameProcesses).toHaveLength(2);
    expect(gameProcesses[0].name).toBe('steam.exe');
    expect(gameProcesses[1].name).toBe('LeagueClient.exe');
  });

  it('should get game process details', async () => {
    const mockProcess = {
      pid: 1,
      name: 'steam.exe',
      path: 'C:\\Steam\\steam.exe',
      cpu: 2,
      memory: 1024,
    };

    const mockProcessLoad = {
      cpu: 5,
      mem: 2048,
      uptime: 3600,
    };

    vi.mocked(si.processLoad).mockResolvedValue(mockProcessLoad);

    const scanner = ProcessScanner.getInstance();
    const details = await scanner.getGameDetails(mockProcess);

    expect(details).toHaveProperty('usage');
    expect(details.usage.cpu).toBe(5);
    expect(details.usage.memory).toBe(2048);
    expect(details.usage.uptime).toBe(3600);
  });
});