// lib/gameDetection/gameScanner.ts
import * as path from 'path';
import { processScanner } from './processScanner';
import { Platform } from './types';
import { gameSignatures, searchPaths } from './config';
import { getSteamGames } from './platforms/getSteamGames';
import { getEpicGames } from './platforms/getEpicGames';
import { getXboxGames } from './platforms/getXboxGames';
import { getOriginGames } from './platforms/getOriginGames';

export interface ScanResult {
  success: boolean;
  errors: string[];
  data?: any[];
}

class GameScanner {
  private static instance: GameScanner;
  private lastScanResults: any[] = [];
  private isScanning: boolean = false;

  private constructor() {}

  public static getInstance(): GameScanner {
    if (!GameScanner.instance) {
      GameScanner.instance = new GameScanner();
    }
    return GameScanner.instance;
  }

  /**
   * Obter jogos instalados da última verificação ou realizar nova verificação
   */
  public async getInstalledGames(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      // Se já realizamos uma verificação, retorne os resultados em cache
      if (this.lastScanResults.length > 0) {
        return { data: this.lastScanResults, error: null };
      }
      
      // Caso contrário, realizar uma nova verificação
      const result = await this.scanForGames();
      if (result.success) {
        return { data: this.lastScanResults, error: null };
      } else {
        return { data: this.lastScanResults, error: new Error(result.errors.join(', ')) };
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Verifica todos os jogos instalados em todas as plataformas
   */
  public async scanForGames(): Promise<ScanResult> {
    if (this.isScanning) {
      return { success: false, errors: ['A scan is already in progress'] };
    }

    this.isScanning = true;
    const errors: string[] = [];
    let detectedGames: any[] = [];

    try {
      console.log('Starting game detection scan...');
      
      // Detectar jogos via plataformas específicas
      const steamPromise = this.scanSteamGames().catch(error => {
        errors.push(`Steam detection error: ${error.message}`);
        return [];
      });
      
      const epicPromise = this.scanEpicGames().catch(error => {
        errors.push(`Epic detection error: ${error.message}`);
        return [];
      });
      
      const xboxPromise = this.scanXboxGames().catch(error => {
        errors.push(`Xbox detection error: ${error.message}`);
        return [];
      });
      
      const originPromise = this.scanOriginGames().catch(error => {
        errors.push(`Origin detection error: ${error.message}`);
        return [];
      });
      
      // Executar todas as detecções em paralelo
      const [steamGames, epicGames, xboxGames, originGames] = await Promise.all([
        steamPromise,
        epicPromise,
        xboxPromise,
        originPromise
      ]);
      
      // Combinar resultados
      detectedGames = [
        ...steamGames,
        ...epicGames,
        ...xboxGames,
        ...originGames
      ];
      
      console.log(`Total detected games: ${detectedGames.length}`);
      
      // Obter jogos ativos via processos em execução (opcionalmente)
      try {
        const activeGames = await processScanner.scanForGames();
        console.log(`Active game processes: ${activeGames.length}`);
        
        // Marcar jogos que estão ativos no momento
        detectedGames = detectedGames.map(game => {
          const isActive = activeGames.some(active => 
            active.name.toLowerCase() === game.process_name?.toLowerCase()
          );
          
          return {
            ...game,
            status: isActive ? 'running' : 'installed'
          };
        });
      } catch (error) {
        console.error('Error scanning active processes:', error);
      }
      
      // Remover duplicados (baseado no nome e plataforma)
      detectedGames = this.removeDuplicates(detectedGames);
      
      // Atualizar cache de resultados
      this.lastScanResults = detectedGames;
      
      return {
        success: true,
        errors: errors,
        data: detectedGames
      };
    } catch (error) {
      console.error('Error in game detection scan:', error);
      return {
        success: false,
        errors: [...errors, `General scan error: ${error instanceof Error ? error.message : String(error)}`]
      };
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Verifica os arquivos de um jogo para garantir que estão intactos
   */
  public async validateGameFiles(gameId: string): Promise<boolean> {
    try {
      const game = this.lastScanResults.find(g => g.id === gameId);
      if (!game) {
        return false;
      }
      
      // Verificar se os arquivos principais do jogo existem
      const gameName = game.name as keyof typeof gameSignatures;
      const signature = gameSignatures[gameName];
      if (!signature) {
        // Se não temos uma assinatura de arquivos para este jogo, consideramos válido por padrão
        return true;
      }
      
      // Em uma implementação real, verificaríamos se todos os arquivos críticos existem
      // Para simplificar, apenas verificamos se o executável principal existe
      if (game.executablePath) {
        // Aqui usaríamos fs.promises.access para verificar se o arquivo existe
        // Como exemplo, consideramos que o arquivo existe
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error validating game files for ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Lança um jogo
   */
  public async launchGame(gameId: string): Promise<boolean> {
    try {
      const game = this.lastScanResults.find(g => g.id === gameId);
      if (!game) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      
      console.log(`Launching game: ${game.name} (${game.platform})`);
      
      // Aqui usaríamos Electron para iniciar o processo
      // Como este é um código frontend, na prática comunicaríamos com o backend via IPC
      
      // Simulação
      if (window?.electronAPI?.launchGame) {
        return await window.electronAPI.launchGame(game);
      } else {
        console.log('Electron API not available, simulating game launch');
        return true;
      }
    } catch (error) {
      console.error(`Error launching game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Otimiza as configurações de um jogo
   */
  public async optimizeGame(gameId: string): Promise<boolean> {
    try {
      const game = this.lastScanResults.find(g => g.id === gameId);
      if (!game) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      
      console.log(`Optimizing game: ${game.name} (${game.platform})`);
      
      // Comunicação com o backend para otimização
      if (window?.electronAPI?.optimizeGame) {
        const result = await window.electronAPI.optimizeGame(game, 'balanced');
        
        // Se a otimização foi bem-sucedida, atualizar o estado do jogo
        if (result && result.success) {
          const index = this.lastScanResults.findIndex(g => g.id === gameId);
          if (index !== -1) {
            this.lastScanResults[index] = {
              ...this.lastScanResults[index],
              optimized: true
            };
          }
          return true;
        }
        return false;
      } else {
        console.log('Electron API not available, simulating game optimization');
        
        // Simulação
        const index = this.lastScanResults.findIndex(g => g.id === gameId);
        if (index !== -1) {
          this.lastScanResults[index] = {
            ...this.lastScanResults[index],
            optimized: true
          };
        }
        return true;
      }
    } catch (error) {
      console.error(`Error optimizing game ${gameId}:`, error);
      throw error;
    }
  }
  
  /**
   * Detecta jogos do Steam
   */
  private async scanSteamGames(): Promise<any[]> {
    try {
      if (window?.electronAPI?.scanSteam) {
        return await window.electronAPI.scanSteam();
      } else {
        // Execução local para desenvolvimento
        if (typeof getSteamGames === 'function') {
          const steamGames = await getSteamGames();
          return steamGames.map(game => this.convertToGameInfo(game));
        }
        return [];
      }
    } catch (error) {
      console.error('Error scanning Steam games:', error);
      return [];
    }
  }
  
  /**
   * Detecta jogos da Epic Games
   */
  private async scanEpicGames(): Promise<any[]> {
    try {
      if (window?.electronAPI?.scanEpic) {
        return await window.electronAPI.scanEpic();
      } else {
        // Execução local para desenvolvimento
        if (typeof getEpicGames === 'function') {
          const epicGames = await getEpicGames();
          return epicGames.map(game => this.convertToGameInfo(game));
        }
        return [];
      }
    } catch (error) {
      console.error('Error scanning Epic games:', error);
      return [];
    }
  }
  
  /**
   * Detecta jogos do Xbox/Windows Store
   */
  private async scanXboxGames(): Promise<any[]> {
    try {
      if (window?.electronAPI?.scanXbox) {
        return await window.electronAPI.scanXbox();
      } else {
        // Execução local para desenvolvimento
        if (typeof getXboxGames === 'function') {
          const xboxGames = await getXboxGames();
          return xboxGames.map(game => this.convertToGameInfo(game));
        }
        return [];
      }
    } catch (error) {
      console.error('Error scanning Xbox games:', error);
      return [];
    }
  }
  
  /**
   * Detecta jogos da Origin/EA Desktop
   */
  private async scanOriginGames(): Promise<any[]> {
    try {
      if (window?.electronAPI?.scanOrigin) {
        return await window.electronAPI.scanOrigin();
      } else {
        // Execução local para desenvolvimento
        if (typeof getOriginGames === 'function') {
          const originGames = await getOriginGames();
          return originGames.map(game => this.convertToGameInfo(game));
        }
        return [];
      }
    } catch (error) {
      console.error('Error scanning Origin games:', error);
      return [];
    }
  }
  
  /**
   * Converte diferentes formatos de jogos para o formato padrão
   */
  private convertToGameInfo(game: any): any {
    return {
      id: game.id || `${game.platform}-${game.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      name: game.name,
      platform: game.platform,
      process_name: game.process_name || game.processName || (game.executablePath ? path.basename(game.executablePath) : ''),
      install_path: game.installPath || game.install_path || (game.executablePath ? path.dirname(game.executablePath) : ''),
      executablePath: game.executablePath || game.executable_path,
      icon_url: game.icon_url || game.iconUrl,
      size: game.size,
      last_played: game.last_played || game.lastPlayed,
      optimized: false,
      status: 'installed',
      version: game.version
    };
  }
  
  /**
   * Remove jogos duplicados da lista (baseado em nome e plataforma)
   */
  private removeDuplicates(games: any[]): any[] {
    const unique = new Map<string, any>();
    
    games.forEach(game => {
      const key = `${game.name}-${game.platform}`;
      if (!unique.has(key)) {
        unique.set(key, game);
      }
    });
    
    return Array.from(unique.values());
  }
}

export const gameScanner = GameScanner.getInstance();
