import { supabase } from '../supabase';

interface OptimizationProfile {
  id: string;
  name: string;
  description: string;
  settings: {
    cpu: {
      priority: number;
      threadOptimization: boolean;
    };
    memory: {
      cleanerInterval: number;
      pageFileOptimization: number;
    };
    gpu: {
      powerMode: number;
      shaderCache: boolean;
    };
    input: {
      processing: number;
      pollingRate: number;
    };
  };
}

interface GameSettings {
  gameId: string;
  profile: string;
  customSettings: Record<string, any>;
  lastOptimized: string;
}

interface OptimizationResult {
  success: boolean;
  improvements: {
    fps: number;
    latency: number;
    stability: number;
  };
  appliedSettings: Record<string, any>;
  error?: string;
}

class FpsOptimizer {
  private static instance: FpsOptimizer;
  private isOptimizing: boolean = false;
  private profiles: OptimizationProfile[] = [];
  private gameSettings: Map<string, GameSettings> = new Map();
  private isDesktopApp: boolean = false;

  private constructor() {
    // Verificar se estamos no Electron
    this.isDesktopApp = !!window.electronAPI;
    this.initializeProfiles();
  }

  public static getInstance(): FpsOptimizer {
    if (!FpsOptimizer.instance) {
      FpsOptimizer.instance = new FpsOptimizer();
    }
    return FpsOptimizer.instance;
  }

  private initializeProfiles() {
    // Perfis de otimização predefinidos
    this.profiles = [
      {
        id: 'balanced',
        name: 'Balanceado',
        description: 'Equilíbrio entre desempenho e estabilidade',
        settings: {
          cpu: {
            priority: 3, // Normal
            threadOptimization: true
          },
          memory: {
            cleanerInterval: 5, // 5 minutos
            pageFileOptimization: 1 // Auto
          },
          gpu: {
            powerMode: 0, // Balanceado
            shaderCache: true
          },
          input: {
            processing: 1, // Standard
            pollingRate: 1 // 250Hz
          }
        }
      },
      {
        id: 'performance',
        name: 'Desempenho',
        description: 'Foco em FPS máximo para jogos competitivos',
        settings: {
          cpu: {
            priority: 4, // High
            threadOptimization: true
          },
          memory: {
            cleanerInterval: 3, // 3 minutos
            pageFileOptimization: 2 // Dynamic
          },
          gpu: {
            powerMode: 2, // Performance
            shaderCache: true
          },
          input: {
            processing: 2, // High
            pollingRate: 2 // 500Hz
          }
        }
      },
      {
        id: 'extreme',
        name: 'Extremo',
        description: 'Desempenho máximo a todo custo',
        settings: {
          cpu: {
            priority: 5, // Real-time
            threadOptimization: true
          },
          memory: {
            cleanerInterval: 2, // 2 minutos
            pageFileOptimization: 2 // Dynamic
          },
          gpu: {
            powerMode: 2, // Performance
            shaderCache: true
          },
          input: {
            processing: 3, // Ultra
            pollingRate: 3 // 1000Hz
          }
        }
      }
    ];
  }

  public async optimizeGame(gameId: string, profileId: string, customSettings?: Record<string, any>): Promise<OptimizationResult> {
    if (this.isOptimizing) {
      return {
        success: false,
        improvements: { fps: 0, latency: 0, stability: 0 },
        appliedSettings: {},
        error: 'Já existe uma otimização em andamento'
      };
    }

    this.isOptimizing = true;

    try {
      // Obter informações do jogo
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (gameError) throw gameError;
      if (!game) throw new Error('Jogo não encontrado');
      
      // Obter perfil de otimização
      const profile = this.profiles.find(p => p.id === profileId);
      if (!profile) throw new Error('Perfil de otimização não encontrado');
      
      // Mesclar configurações personalizadas
      const settings = {
        ...profile.settings,
        ...(customSettings || {})
      };
      
      // Coletar métricas antes da otimização
      const preMetrics = await this.collectGameMetrics(gameId);
      
      // Aplicar otimizações
      let result: OptimizationResult;
      
      if (this.isDesktopApp && window.electronAPI) {
        // Aplicar otimizações reais via Electron
        console.log(`Otimizando jogo ${game.name} com perfil ${profileId} via Electron`);
        try {
          const electronResult = await window.electronAPI.optimizeGame(game, profileId, settings);
          result = electronResult;
        } catch (error) {
          console.error('Erro ao otimizar jogo via Electron:', error);
          throw error;
        }
      } else {
        // Simulação de otimização para ambiente web
        console.log(`Simulando otimização do jogo ${game.name} com perfil ${profileId}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular tempo de processamento
        
        // Gerar melhorias simuladas
        const fpsImprovement = profileId === 'balanced' ? 15 : profileId === 'performance' ? 27 : 35;
        const latencyImprovement = profileId === 'balanced' ? 10 : profileId === 'performance' ? 18 : 25;
        const stabilityImprovement = profileId === 'balanced' ? 20 : profileId === 'performance' ? 15 : 10;
        
        result = {
          success: true,
          improvements: {
            fps: fpsImprovement,
            latency: latencyImprovement,
            stability: stabilityImprovement
          },
          appliedSettings: settings
        };
      }
      
      // Coletar métricas após a otimização
      const postMetrics = await this.collectGameMetrics(gameId);
      
      // Salvar configurações aplicadas
      this.gameSettings.set(gameId, {
        gameId,
        profile: profileId,
        customSettings: customSettings || {},
        lastOptimized: new Date().toISOString()
      });
      
      // Registrar otimização no banco de dados
      await this.recordOptimization(gameId, profileId, preMetrics, postMetrics, result);
      
      // Atualizar status do jogo
      await supabase
        .from('games')
        .update({
          optimized: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);
      
      return result;
    } catch (error) {
      console.error('Erro ao otimizar jogo:', error);
      return {
        success: false,
        improvements: { fps: 0, latency: 0, stability: 0 },
        appliedSettings: {},
        error: error instanceof Error ? error.message : 'Erro desconhecido durante a otimização'
      };
    } finally {
      this.isOptimizing = false;
    }
  }
  
  private async collectGameMetrics(gameId: string): Promise<any> {
    // Em uma implementação real, coletaria métricas reais do jogo
    // Para esta simulação, retornamos dados fictícios
    return {
      fps: 60 + Math.random() * 30,
      frameTime: 16.67 - Math.random() * 5,
      memoryUsage: 2000 + Math.random() * 1000,
      gpuUsage: 70 + Math.random() * 20,
      cpuUsage: 50 + Math.random() * 30,
      latency: 20 + Math.random() * 30,
      packetLoss: Math.random() * 2,
      stability: 85 + Math.random() * 15
    };
  }
  
  private async recordOptimization(
    gameId: string, 
    profileId: string, 
    preMetrics: any, 
    postMetrics: any, 
    result: OptimizationResult
  ): Promise<void> {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado, otimização não será registrada');
        return;
      }
      
      // Calcular melhoria percentual
      const improvementPercentage = this.calculateImprovement(preMetrics, postMetrics);
      
      // Registrar otimização
      const { error } = await supabase
        .from('optimization_metrics')
        .insert({
          game_id: gameId,
          user_id: user.id,
          timestamp: new Date().toISOString(),
          pre_metrics: preMetrics,
          post_metrics: postMetrics,
          improvement_percentage: improvementPercentage,
          optimization_type: profileId,
          changes_applied: result.appliedSettings,
          status: 'completed'
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar otimização:', error);
    }
  }
  
  private calculateImprovement(preMetrics: any, postMetrics: any): number {
    // Calcular melhoria percentual ponderada
    const fpsImprovement = (postMetrics.fps - preMetrics.fps) / preMetrics.fps;
    const memoryImprovement = (preMetrics.memoryUsage - postMetrics.memoryUsage) / preMetrics.memoryUsage;
    const loadTimeImprovement = (preMetrics.frameTime - postMetrics.frameTime) / preMetrics.frameTime;
    const latencyImprovement = (preMetrics.latency - postMetrics.latency) / preMetrics.latency;
    const packetLossImprovement = (preMetrics.packetLoss - postMetrics.packetLoss) / (preMetrics.packetLoss || 0.01);
    const stabilityImprovement = (postMetrics.stability - preMetrics.stability) / preMetrics.stability;

    // Média ponderada (pesos devem somar 1)
    const weightedImprovement = 
      fpsImprovement * 0.3 + 
      memoryImprovement * 0.15 + 
      loadTimeImprovement * 0.15 + 
      latencyImprovement * 0.2 + 
      packetLossImprovement * 0.1 + 
      stabilityImprovement * 0.1;

    // Converter para percentual e arredondar para 2 casas decimais
    return Math.round(weightedImprovement * 100 * 100) / 100;
  }
  
  public getProfiles(): OptimizationProfile[] {
    return this.profiles;
  }
  
  public getGameSettings(gameId: string): GameSettings | undefined {
    return this.gameSettings.get(gameId);
  }
}

export const fpsOptimizer = FpsOptimizer.getInstance();