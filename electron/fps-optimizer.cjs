const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

class FpsOptimizer {
  constructor() {
    this.optimizationProfiles = {
      balanced: {
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
      },
      performance: {
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
      },
      extreme: {
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
    };
    
    this.gameConfigPaths = {
      'Steam': {
        'Counter-Strike 2': {
          configPath: 'Steam/userdata/{userid}/730/local/cfg/config.cfg',
          optimizations: {
            'cl_interp': '0',
            'cl_interp_ratio': '1',
            'cl_updaterate': '128',
            'cl_cmdrate': '128',
            'fps_max': '0',
            'r_dynamic': '0',
            'mat_queue_mode': '2'
          }
        },
        'Dota 2': {
          configPath: 'Steam/userdata/{userid}/570/remote/cfg/autoexec.cfg',
          optimizations: {
            'fps_max': '240',
            'dota_cheap_water': '1',
            'dota_embers': '0',
            'r_deferred_height_fog': '0',
            'r_deferred_simple_light': '1'
          }
        }
      },
      'Epic': {
        'Fortnite': {
          configPath: 'AppData/Local/FortniteGame/Saved/Config/WindowsClient/GameUserSettings.ini',
          optimizations: {
            'FrameRateLimit': '240',
            'sg.ResolutionQuality': '75',
            'sg.ViewDistanceQuality': '2',
            'sg.AntiAliasingQuality': '0',
            'sg.ShadowQuality': '0'
          }
        }
      },
      'Riot': {
        'Valorant': {
          configPath: 'AppData/Local/VALORANT/Saved/Config/GameUserSettings.ini',
          optimizations: {
            'bUseVSync': 'False',
            'MaxFPS': '0',
            'FrameRateCap': '0',
            'MaterialQuality': '0',
            'TextureQuality': '1'
          }
        },
        'League of Legends': {
          configPath: 'Riot Games/League of Legends/Config/game.cfg',
          optimizations: {
            'FrameCapType': '2',
            'GfxWaitForVSync': '0',
            'ShadowQuality': '1',
            'CharacterQuality': '1',
            'EnvironmentQuality': '1'
          }
        }
      }
    };
  }

  /**
   * Otimiza um jogo específico
   */
  async optimizeGame(game, profileId, customSettings = {}) {
    try {
      console.log(`Otimizando jogo: ${game.name} (${game.platform}) com perfil ${profileId}`);
      
      // Obter perfil de otimização
      const profile = this.optimizationProfiles[profileId];
      if (!profile) {
        throw new Error(`Perfil de otimização não encontrado: ${profileId}`);
      }
      
      // Mesclar configurações personalizadas
      const settings = {
        ...profile,
        ...customSettings
      };
      
      // Coletar métricas antes da otimização
      const preMetrics = await this.collectGameMetrics(game);
      console.log('Métricas pré-otimização:', preMetrics);
      
      // Aplicar otimizações
      const optimizationResults = await this.applyOptimizations(game, settings);
      console.log('Resultados da otimização:', optimizationResults);
      
      // Coletar métricas após a otimização
      const postMetrics = await this.collectGameMetrics(game);
      console.log('Métricas pós-otimização:', postMetrics);
      
      // Calcular melhorias
      const improvements = this.calculateImprovements(preMetrics, postMetrics);
      console.log('Melhorias calculadas:', improvements);
      
      return {
        success: true,
        improvements: {
          fps: improvements.fps,
          latency: improvements.latency,
          stability: improvements.stability
        },
        appliedSettings: settings
      };
    } catch (error) {
      console.error(`Erro ao otimizar jogo ${game.name}:`, error);
      return {
        success: false,
        improvements: { fps: 0, latency: 0, stability: 0 },
        appliedSettings: {},
        error: error.message
      };
    }
  }
  
  /**
   * Coleta métricas de desempenho do jogo
   */
  async collectGameMetrics(game) {
    // Em uma implementação real, coletaria métricas reais do jogo
    // Para esta simulação, retornamos dados fictícios
    console.log(`Coletando métricas para ${game.name}`);
    
    // Simular variação baseada na plataforma
    const platformMultiplier = 
      game.platform === 'Steam' ? 1.1 :
      game.platform === 'Epic' ? 0.9 :
      game.platform === 'Riot' ? 1.0 : 1.0;
    
    return {
      fps: 60 * platformMultiplier + Math.random() * 30,
      frameTime: 16.67 / platformMultiplier - Math.random() * 5,
      memoryUsage: 2000 * platformMultiplier + Math.random() * 1000,
      gpuUsage: 70 * platformMultiplier + Math.random() * 20,
      cpuUsage: 50 * platformMultiplier + Math.random() * 30,
      latency: 20 * (1/platformMultiplier) + Math.random() * 30,
      packetLoss: Math.random() * 2,
      stability: 85 * platformMultiplier + Math.random() * 15
    };
  }
  
  /**
   * Aplica otimizações ao jogo
   */
  async applyOptimizations(game, settings) {
    console.log(`Aplicando otimizações para ${game.name} com configurações:`, settings);
    
    // Verificar se temos configurações para este jogo
    const platformConfigs = this.gameConfigPaths[game.platform];
    if (!platformConfigs) {
      console.log(`Sem configurações específicas para plataforma ${game.platform}`);
      return this.applyGenericOptimizations(game, settings);
    }
    
    const gameConfig = platformConfigs[game.name];
    if (!gameConfig) {
      console.log(`Sem configurações específicas para jogo ${game.name}`);
      return this.applyGenericOptimizations(game, settings);
    }
    
    // Aplicar otimizações específicas do jogo
    try {
      // Substituir {userid} no caminho do config
      const configPath = gameConfig.configPath.replace('{userid}', 'CURRENT_USER');
      const fullPath = path.join(process.env.USERPROFILE || process.env.HOME, configPath);
      
      console.log(`Tentando modificar arquivo de configuração em: ${fullPath}`);
      
      // Verificar se o arquivo existe
      try {
        await fs.access(fullPath);
        console.log(`Arquivo de configuração encontrado: ${fullPath}`);
      } catch (error) {
        console.log(`Arquivo de configuração não encontrado: ${fullPath}`);
        console.log('Criando arquivo de configuração...');
        
        // Criar diretório se não existir
        const configDir = path.dirname(fullPath);
        await fs.mkdir(configDir, { recursive: true });
        
        // Criar arquivo vazio
        await fs.writeFile(fullPath, '');
      }
      
      // Ler arquivo de configuração
      let configContent = await fs.readFile(fullPath, 'utf8');
      console.log(`Lido arquivo de configuração (${configContent.length} bytes)`);
      
      // Aplicar otimizações
      for (const [key, value] of Object.entries(gameConfig.optimizations)) {
        const regex = new RegExp(`${key}\\s*=\\s*[^\\r\\n]*`, 'g');
        const replacement = `${key}=${value}`;
        
        if (configContent.match(regex)) {
          // Substituir configuração existente
          configContent = configContent.replace(regex, replacement);
          console.log(`Substituída configuração: ${key}=${value}`);
        } else {
          // Adicionar nova configuração
          configContent += `\n${replacement}`;
          console.log(`Adicionada configuração: ${key}=${value}`);
        }
      }
      
      // Salvar arquivo modificado
      await fs.writeFile(fullPath, configContent, 'utf8');
      console.log(`Salvo arquivo de configuração (${configContent.length} bytes)`);
      
      return {
        success: true,
        configPath: fullPath,
        optimizationsApplied: Object.keys(gameConfig.optimizations).length
      };
    } catch (error) {
      console.error(`Erro ao aplicar otimizações específicas para ${game.name}:`, error);
      // Fallback para otimizações genéricas
      return this.applyGenericOptimizations(game, settings);
    }
  }
  
  /**
   * Aplica otimizações genéricas ao jogo
   */
  async applyGenericOptimizations(game, settings) {
    console.log(`Aplicando otimizações genéricas para ${game.name}`);
    
    try {
      // Otimizar prioridade do processo
      if (game.process_name) {
        const priorityLevel = settings.cpu.priority;
        const priorityClass = this.getPriorityClass(priorityLevel);
        
        if (process.platform === 'win32') {
          // No Windows, usar wmic para definir prioridade
          console.log(`Definindo prioridade do processo ${game.process_name} para ${priorityClass}`);
          // Nota: Isso é apenas uma simulação, não executa realmente o comando
          console.log(`Comando simulado: wmic process where name="${game.process_name}" CALL setpriority "${priorityClass}"`);
        } else {
          // No Linux/macOS, usar renice
          console.log(`Definindo prioridade do processo ${game.process_name}`);
          // Nota: Isso é apenas uma simulação, não executa realmente o comando
          console.log(`Comando simulado: renice -n ${this.getNiceValue(priorityLevel)} -p $(pgrep ${game.process_name})`);
        }
      }
      
      // Otimizar configurações de energia
      if (settings.gpu.powerMode === 2) { // Performance
        if (process.platform === 'win32') {
          console.log('Definindo plano de energia para Alto Desempenho');
          // Nota: Isso é apenas uma simulação, não executa realmente o comando
          console.log('Comando simulado: powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c');
        }
      }
      
      // Otimizar memória
      if (settings.memory.cleanerInterval > 0) {
        console.log(`Configurando limpeza de memória a cada ${settings.memory.cleanerInterval} minutos`);
        // Simulação de limpeza de memória
        console.log('Executando limpeza de memória inicial...');
      }
      
      return {
        success: true,
        optimizationsApplied: {
          processPriority: true,
          powerPlan: settings.gpu.powerMode === 2,
          memoryCleaner: settings.memory.cleanerInterval > 0
        }
      };
    } catch (error) {
      console.error(`Erro ao aplicar otimizações genéricas para ${game.name}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Obtém a classe de prioridade do Windows com base no nível
   */
  getPriorityClass(level) {
    switch (level) {
      case 1: return 'Idle';
      case 2: return 'BelowNormal';
      case 3: return 'Normal';
      case 4: return 'AboveNormal';
      case 5: return 'High';
      case 6: return 'Realtime';
      default: return 'Normal';
    }
  }
  
  /**
   * Obtém o valor nice do Linux com base no nível
   */
  getNiceValue(level) {
    switch (level) {
      case 1: return 19;  // Lowest priority
      case 2: return 10;
      case 3: return 0;   // Default
      case 4: return -5;
      case 5: return -10;
      case 6: return -20; // Highest priority
      default: return 0;
    }
  }
  
  /**
   * Calcula melhorias com base nas métricas antes e depois
   */
  calculateImprovements(preMetrics, postMetrics) {
    // Calcular melhoria percentual de FPS
    const fpsImprovement = ((postMetrics.fps - preMetrics.fps) / preMetrics.fps) * 100;
    
    // Calcular melhoria percentual de latência (redução)
    const latencyImprovement = ((preMetrics.latency - postMetrics.latency) / preMetrics.latency) * 100;
    
    // Calcular melhoria percentual de estabilidade
    const stabilityImprovement = ((postMetrics.stability - preMetrics.stability) / preMetrics.stability) * 100;
    
    return {
      fps: Math.round(fpsImprovement * 10) / 10, // Arredondar para 1 casa decimal
      latency: Math.round(latencyImprovement * 10) / 10,
      stability: Math.round(stabilityImprovement * 10) / 10
    };
  }
  
  /**
   * Obtém os perfis de otimização disponíveis
   */
  getProfiles() {
    return this.optimizationProfiles;
  }
}

module.exports = new FpsOptimizer();