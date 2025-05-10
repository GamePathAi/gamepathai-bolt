import * as si from 'systeminformation';
import { supabase } from '../supabase';

interface GameProcess {
  pid: number;
  name: string;
  path: string;
  cpu: number;
  memory: number;
}

export class ProcessScanner {
  private static instance: ProcessScanner;
  private knownGameProcesses: Map<string, RegExp> = new Map([
    ['Steam', /steam\.exe$/i],
    ['Epic Games', /EpicGamesLauncher\.exe$/i],
    ['Battle.net', /Battle\.net\.exe$/i],
    ['League of Legends', /LeagueClient\.exe$/i],
    ['Valorant', /VALORANT\.exe$/i],
    ['Counter-Strike 2', /cs2\.exe$/i],
  ]);

  private constructor() {
    this.loadKnownProcesses();
  }

  public static getInstance(): ProcessScanner {
    if (!ProcessScanner.instance) {
      ProcessScanner.instance = new ProcessScanner();
    }
    return ProcessScanner.instance;
  }

  private async loadKnownProcesses(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('process_name');
      
      if (error) throw error;

      data?.forEach(game => {
        if (game.process_name) {
          this.knownGameProcesses.set(
            game.process_name,
            new RegExp(game.process_name, 'i')
          );
        }
      });
    } catch (error) {
      console.error('Error loading known processes:', error);
    }
  }

  public async scanForGames(): Promise<GameProcess[]> {
    try {
      const processes = await si.processes();
      const gameProcesses: GameProcess[] = [];

      for (const proc of processes.list) {
        if (this.isGameProcess(proc.name)) {
          const gameProcess: GameProcess = {
            pid: proc.pid,
            name: proc.name,
            path: proc.path || '',
            cpu: proc.cpu || 0,
            memory: proc.memRss || 0,
          };
          gameProcesses.push(gameProcess);
        }
      }

      return gameProcesses;
    } catch (error) {
      console.error('Error scanning for games:', error);
      return [];
    }
  }

  private isGameProcess(processName: string): boolean {
    for (const [, pattern] of this.knownGameProcesses) {
      if (pattern.test(processName)) {
        return true;
      }
    }
    return false;
  }

  public async getGameDetails(process: GameProcess): Promise<any> {
    try {
      const processInfo = await si.processLoad(process.pid);
      const usage = {
        cpu: processInfo.cpu,
        memory: processInfo.mem,
        uptime: processInfo.uptime,
      };

      return {
        ...process,
        usage,
      };
    } catch (error) {
      console.error('Error getting game details:', error);
      return process;
    }
  }
}

export const processScanner = ProcessScanner.getInstance();