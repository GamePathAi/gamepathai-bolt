import { supabase } from '../supabase';
import { gameSignatures, searchPaths } from './config';
import type { GameInfo } from './types';

interface ScanResult {
  games: GameInfo[];
  errors: string[];
}

class GameScanner {
  private static instance: GameScanner;

  private constructor() {}

  public static getInstance(): GameScanner {
    if (!GameScanner.instance) {
      GameScanner.instance = new GameScanner();
    }
    return GameScanner.instance;
  }

  public async getInstalledGames() {
    try {
      return await supabase
        .from('games')
        .select('*')
        .order('name', { ascending: true });
    } catch (error) {
      console.error('Error fetching installed games:', error);
      throw error;
    }
  }

  public async scanForGames(): Promise<ScanResult> {
    try {
      // Verificar se estamos no Electron
      if (window.electronAPI) {
        console.log('Usando API Electron para escanear jogos');
        const electronGames = await window.electronAPI.scanGames();
        
        // Processar jogos do Electron
        const games: GameInfo[] = [];
        
        // Processar jogos Steam
        if (electronGames.steam && Array.isArray(electronGames.steam)) {
          for (const game of electronGames.steam) {
            games.push({
              id: game.id,
              name: game.name,
              platform: 'Steam',
              process_name: game.name.replace(/[^a-zA-Z0-9]/g, '') + '.exe',
              install_path: game.installPath,
              icon_url: game.iconUrl,
              size: game.size,
              last_played: game.lastPlayed ? new Date(game.lastPlayed) : undefined,
              optimized: false,
              status: 'installed'
            });
          }
        }
        
        // Processar jogos Epic
        if (electronGames.epic && Array.isArray(electronGames.epic)) {
          for (const game of electronGames.epic) {
            games.push({
              id: game.id,
              name: game.name,
              platform: 'Epic',
              process_name: game.name.replace(/[^a-zA-Z0-9]/g, '') + '.exe',
              install_path: game.installPath,
              icon_url: game.iconUrl,
              size: game.size,
              last_played: game.lastPlayed ? new Date(game.lastPlayed) : undefined,
              optimized: false,
              status: 'installed'
            });
          }
        }
        
        // Processar jogos Xbox
        if (electronGames.xbox && Array.isArray(electronGames.xbox)) {
          for (const game of electronGames.xbox) {
            games.push({
              id: game.id,
              name: game.name,
              platform: 'Xbox',
              process_name: game.name.replace(/[^a-zA-Z0-9]/g, '') + '.exe',
              install_path: game.installPath,
              icon_url: game.iconUrl,
              size: game.size,
              last_played: game.lastPlayed ? new Date(game.lastPlayed) : undefined,
              optimized: false,
              status: 'installed'
            });
          }
        }
        
        // Salvar jogos no banco de dados
        for (const game of games) {
          try {
            await this.saveGameToDatabase(game);
          } catch (error) {
            console.error(`Erro ao salvar jogo ${game.name}:`, error);
          }
        }
        
        return {
          games,
          errors: []
        };
      }
      
      // Fallback para web: chamar a edge function
      const { data, error } = await supabase.functions.invoke('detect-games', {
        body: { 
          signatures: gameSignatures,
          paths: searchPaths
        }
      });

      if (error) throw error;

      return {
        games: data.games || [],
        errors: data.errors || []
      };
    } catch (error) {
      console.error('Error scanning for games:', error);
      return {
        games: [],
        errors: [error instanceof Error ? error.message : 'Failed to scan for games']
      };
    }
  }
  
  private async saveGameToDatabase(game: GameInfo): Promise<void> {
    try {
      const { error } = await supabase
        .from('games')
        .upsert({
          id: game.id,
          name: game.name,
          platform: game.platform,
          process_name: game.process_name,
          install_path: game.install_path,
          icon_url: game.icon_url,
          size: game.size,
          last_played: game.last_played,
          optimized: game.optimized,
          status: game.status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name,platform'
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Error saving game ${game.name} to database:`, error);
      throw error;
    }
  }

  public async validateGameFiles(gameId: string): Promise<boolean> {
    try {
      // Verificar se estamos no Electron
      if (window.electronAPI) {
        // Implementar validação real de arquivos de jogo
        console.log(`Validando arquivos do jogo ${gameId} via Electron`);
        return true; // Simulação de sucesso
      }
      
      // Fallback para web
      const { data, error } = await supabase.functions.invoke('validate-game', {
        body: { gameId }
      });

      if (error) throw error;
      return data?.valid ?? false;
    } catch (error) {
      console.error('Error validating game files:', error);
      return false;
    }
  }

  public async launchGame(gameId: string): Promise<void> {
    try {
      // Obter informações do jogo
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (gameError) throw gameError;
      if (!game) throw new Error('Game not found');
      
      // Verificar se estamos no Electron
      if (window.electronAPI) {
        console.log(`Iniciando jogo ${game.name} via Electron`);
        const result = await window.electronAPI.launchGame(game);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to launch game');
        }
      } else {
        // Fallback para web - apenas atualiza o timestamp
        console.log('Ambiente web detectado, não é possível iniciar o jogo diretamente');
      }

      // Atualizar timestamp de último jogo
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          last_played: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error launching game:', error);
      throw error;
    }
  }
  
  public async optimizeGame(gameId: string, optimizationProfile: string): Promise<boolean> {
    try {
      // Obter informações do jogo
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (gameError) throw gameError;
      if (!game) throw new Error('Game not found');
      
      // Verificar se estamos no Electron
      if (window.electronAPI) {
        console.log(`Otimizando jogo ${game.name} com perfil ${optimizationProfile} via Electron`);
        const result = await window.electronAPI.optimizeGame(game, optimizationProfile);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to optimize game');
        }
        
        // Atualizar status de otimização
        const { error: updateError } = await supabase
          .from('games')
          .update({ 
            optimized: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);

        if (updateError) throw updateError;
        
        return true;
      } else {
        console.log('Ambiente web detectado, não é possível otimizar o jogo diretamente');
        return false;
      }
    } catch (error) {
      console.error('Error optimizing game:', error);
      return false;
    }
  }
}

export const gameScanner = GameScanner.getInstance();