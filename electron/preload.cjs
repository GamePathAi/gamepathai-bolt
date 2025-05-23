// preload.cjs - GamePath AI Professional v3.0 - Bridge Completo
// Ponte segura entre Main Process (5385 linhas) e Renderer Process

const { contextBridge, ipcRenderer } = require('electron');

// ===================================================
// SISTEMA DE VALIDAÇÃO E SANITIZAÇÃO
// ===================================================

class PreloadSanitizer {
  static validateGameId(gameId) {
    if (!gameId || typeof gameId !== 'string' || gameId.length > 200) {
      throw new Error('Game ID inválido');
    }
    return gameId.trim();
  }

  static validateGameData(gameData) {
    if (!gameData || typeof gameData !== 'object') {
      throw new Error('Dados do jogo inválidos');
    }
    
    if (!gameData.name && !gameData.id) {
      throw new Error('Jogo deve ter nome ou ID');
    }
    
    return {
      id: gameData.id || 'unknown',
      name: gameData.name || 'Unknown Game',
      platform: gameData.platform || 'Unknown',
      ...gameData
    };
  }

  static validateProfile(profileName) {
    const validProfiles = ['ultra-performance', 'balanced-fps', 'balanced-quality', 'quality'];
    
    if (!profileName || !validProfiles.includes(profileName)) {
      return 'balanced-fps';
    }
    
    return profileName;
  }

  static sanitizeResult(result) {
    if (!result || typeof result !== 'object') {
      return { success: false, error: 'Resultado inválido' };
    }
    
    return {
      success: result.success || false,
      data: result.data || null,
      error: result.error || null,
      message: result.message || null,
      timestamp: Date.now()
    };
  }
}

// ===================================================
// SISTEMA DE CACHE INTELIGENTE FRONTEND
// ===================================================

class FrontendCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos
    this.maxSize = 100;
  }

  set(key, data, customTTL = null) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTTL || this.ttl
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const isExpired = (Date.now() - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const frontendCache = new FrontendCache();

// ===================================================
// SISTEMA DE EVENTOS AVANÇADO
// ===================================================

class AdvancedEventManager {
  constructor() {
    this.listeners = new Map();
    this.oneTimeListeners = new Map();
    this.setupIPCListeners();
  }

  setupIPCListeners() {
    // Eventos do tray
    ipcRenderer.on('tray-launch-game', (event, gameId) => {
      this.emit('tray:game-launch', { gameId });
    });

    ipcRenderer.on('tray-optimize-game', (event, gameId) => {
      this.emit('tray:game-optimize', { gameId });
    });

    ipcRenderer.on('tray-scan-games', () => {
      this.emit('tray:scan-games');
    });

    ipcRenderer.on('tray-optimize-system', (event, profile) => {
      this.emit('tray:system-optimize', { profile });
    });

    // Eventos de sistema
    ipcRenderer.on('system-optimized', (event, data) => {
      this.emit('system:optimized', data);
    });

    ipcRenderer.on('game-launched', (event, data) => {
      this.emit('game:launched', data);
    });

    ipcRenderer.on('game-detected', (event, data) => {
      this.emit('games:detected', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  once(event, callback) {
    if (!this.oneTimeListeners.has(event)) {
      this.oneTimeListeners.set(event, []);
    }
    this.oneTimeListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    // Listeners normais
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener do evento ${event}:`, error);
        }
      });
    }

    // Listeners uma vez
    if (this.oneTimeListeners.has(event)) {
      this.oneTimeListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no one-time listener do evento ${event}:`, error);
        }
      });
      this.oneTimeListeners.delete(event);
    }
  }

  removeAllListeners(event = null) {
    if (event) {
      this.listeners.delete(event);
      this.oneTimeListeners.delete(event);
    } else {
      this.listeners.clear();
      this.oneTimeListeners.clear();
    }
  }
}

const eventManager = new AdvancedEventManager();

// ===================================================
// SISTEMA DE THROTTLING/DEBOUNCING
// ===================================================

class RequestManager {
  constructor() {
    this.pendingRequests = new Map();
    this.throttleTimers = new Map();
  }

  // Throttle: Executa no máximo uma vez por intervalo
  throttle(key, fn, delay = 1000) {
    if (this.throttleTimers.has(key)) {
      return Promise.resolve(null);
    }

    this.throttleTimers.set(key, true);
    
    setTimeout(() => {
      this.throttleTimers.delete(key);
    }, delay);

    return fn();
  }

  // Debounce: Executa apenas após delay sem novas chamadas
  debounce(key, fn, delay = 500) {
    if (this.pendingRequests.has(key)) {
      clearTimeout(this.pendingRequests.get(key));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.pendingRequests.delete(key);
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.pendingRequests.set(key, timer);
    });
  }

  // Cancela todas as operações pendentes
  cancelAll() {
    this.pendingRequests.forEach(timer => clearTimeout(timer));
    this.pendingRequests.clear();
    this.throttleTimers.clear();
  }
}

const requestManager = new RequestManager();

// ===================================================
// API PRINCIPAL DO GAMEPATHAI
// ===================================================

const GamePathAI = {
  // ===================================================
  // SISTEMA DE JOGOS
  // ===================================================
  games: {
    // Escanear jogos com filtros inteligentes
    async scan() {
      try {
        console.log('🔍 Iniciando escaneamento inteligente...');
        
        const cached = frontendCache.get('games-scan');
        if (cached) {
          console.log('📦 Jogos carregados do cache frontend');
          return cached;
        }

        const result = await ipcRenderer.invoke('scan-games-intelligent');
        const sanitized = PreloadSanitizer.sanitizeResult(result);
        
        if (sanitized.success) {
          frontendCache.set('games-scan', sanitized);
          eventManager.emit('games:scanned', sanitized.data);
          
          // Atualizar tray menu
          ipcRenderer.send('update-tray-games', sanitized.data);
        }
        
        return sanitized;
      } catch (error) {
        console.error('Erro no escaneamento:', error);
        return { success: false, error: error.message };
      }
    },

    // Escanear apenas Xbox com detector profissional
    async scanXbox() {
      try {
        console.log('🎮 Iniciando escaneamento Xbox profissional...');
        
        const result = await ipcRenderer.invoke('scan-xbox-professional');
        const sanitized = PreloadSanitizer.sanitizeResult(result);
        
        if (sanitized.success) {
          eventManager.emit('xbox:scanned', sanitized.data);
        }
        
        return sanitized;
      } catch (error) {
        console.error('Erro no escaneamento Xbox:', error);
        return { success: false, error: error.message };
      }
    },

    // Validar arquivos de um jogo
    async validate(gameId) {
      try {
        const sanitizedId = PreloadSanitizer.validateGameId(gameId);
        
        const result = await ipcRenderer.invoke('validate-game-files', { id: sanitizedId });
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        console.error('Erro na validação:', error);
        return { success: false, error: error.message };
      }
    },

    // Limpar cache de jogos
    async clearCache() {
      try {
        frontendCache.clear();
        const result = await ipcRenderer.invoke('clear-cache');
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // SISTEMA DE LANÇAMENTO
  // ===================================================
  launcher: {
    // Lançar jogo com sistema profissional
    async launch(gameData, profileName = 'balanced-fps') {
      try {
        console.log('🚀 Lançando jogo:', gameData.name || gameData.id);
        
        const sanitizedGame = PreloadSanitizer.validateGameData(gameData);
        const sanitizedProfile = PreloadSanitizer.validateProfile(profileName);
        
        const result = await ipcRenderer.invoke('launch-game-professional', sanitizedGame, sanitizedProfile);
        const sanitized = PreloadSanitizer.sanitizeResult(result);
        
        if (sanitized.success) {
          eventManager.emit('game:launched', { game: sanitizedGame, result: sanitized });
        }
        
        return sanitized;
      } catch (error) {
        console.error('Erro no lançamento profissional:', error);
        return { success: false, error: error.message };
      }
    },

    // Lançamento padrão (fallback)
    async launchStandard(gameData, profileName = 'balanced-fps') {
      try {
        console.log('🎮 Lançamento padrão:', gameData.name || gameData.id);
        
        const sanitizedGame = PreloadSanitizer.validateGameData(gameData);
        const sanitizedProfile = PreloadSanitizer.validateProfile(profileName);
        
        const result = await ipcRenderer.invoke('launch-game', sanitizedGame, sanitizedProfile);
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        console.error('Erro no lançamento padrão:', error);
        return { success: false, error: error.message };
      }
    },

    // Lançamento rápido (sem otimizações)
    async quickLaunch(gameId) {
      try {
        const sanitizedId = PreloadSanitizer.validateGameId(gameId);
        
        return await this.launchStandard({ id: sanitizedId });
      } catch (error) {
        console.error('Erro no lançamento rápido:', error);
        return { success: false, error: error.message };
      }
    },

    // Obter jogos em execução
    async getRunning() {
      try {
        const result = await ipcRenderer.invoke('get-running-games');
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // SISTEMA DE OTIMIZAÇÃO
  // ===================================================
  optimization: {
    // Otimizar sistema para jogo específico
    async optimizeForGame(gameData, profileName = 'balanced-fps') {
      try {
        console.log('⚡ Otimizando sistema para:', gameData.name || gameData.id);
        
        const sanitizedGame = PreloadSanitizer.validateGameData(gameData);
        const sanitizedProfile = PreloadSanitizer.validateProfile(profileName);
        
        const result = await ipcRenderer.invoke('optimize-system-intelligent', sanitizedGame, sanitizedProfile);
        const sanitized = PreloadSanitizer.sanitizeResult(result);
        
        if (sanitized.success) {
          eventManager.emit('system:optimized', { game: sanitizedGame, profile: sanitizedProfile });
        }
        
        return sanitized;
      } catch (error) {
        console.error('Erro na otimização:', error);
        return { success: false, error: error.message };
      }
    },

    // Otimizar sistema geral
    async optimizeSystem(profileName = 'balanced-fps') {
      try {
        console.log('⚡ Otimizando sistema geral com perfil:', profileName);
        
        const sanitizedProfile = PreloadSanitizer.validateProfile(profileName);
        
        const result = await ipcRenderer.invoke('optimize-system-intelligent', null, sanitizedProfile);
        const sanitized = PreloadSanitizer.sanitizeResult(result);
        
        if (sanitized.success) {
          eventManager.emit('system:optimized', { profile: sanitizedProfile });
        }
        
        return sanitized;
      } catch (error) {
        console.error('Erro na otimização geral:', error);
        return { success: false, error: error.message };
      }
    },

    // Obter perfis de otimização disponíveis
    async getProfiles() {
      try {
        const result = await ipcRenderer.invoke('get-optimization-profiles');
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // SISTEMA DE MONITORAMENTO
  // ===================================================
  monitoring: {
    // Obter métricas do sistema
    async getSystemMetrics() {
      try {
        return await requestManager.throttle('system-metrics', async () => {
          const result = await ipcRenderer.invoke('get-system-info');
          return PreloadSanitizer.sanitizeResult(result);
        }, 2000);
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    // Iniciar monitoramento em tempo real
    startRealTime(callback, interval = 5000) {
      const timer = setInterval(async () => {
        try {
          const metrics = await this.getSystemMetrics();
          if (metrics.success) {
            callback(metrics.data);
          }
        } catch (error) {
          console.error('Erro no monitoramento em tempo real:', error);
        }
      }, interval);

      return () => clearInterval(timer);
    },

    // Executar diagnóstico avançado
    async runDiagnostics() {
      try {
        console.log('🔍 Executando diagnóstico avançado...');
        
        const result = await ipcRenderer.invoke('run-advanced-diagnostics');
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        console.error('Erro no diagnóstico:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // SISTEMA DE PERFIS
  // ===================================================
  profiles: {
    // Obter perfil de um jogo
    async get(gameId) {
      try {
        const sanitizedId = PreloadSanitizer.validateGameId(gameId);
        
        const result = await ipcRenderer.invoke('get-game-profile', sanitizedId);
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    // Salvar perfil de um jogo
    async save(gameId, profile) {
      try {
        const sanitizedId = PreloadSanitizer.validateGameId(gameId);
        
        if (!profile || typeof profile !== 'object') {
          throw new Error('Perfil inválido');
        }
        
        const result = await ipcRenderer.invoke('set-game-profile', sanitizedId, profile);
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // SISTEMA DE BACKUP
  // ===================================================
  backup: {
    // Criar backup manual
    async create() {
      try {
        console.log('💾 Criando backup...');
        
        const result = await ipcRenderer.invoke('create-backup');
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    // Listar backups disponíveis
    async list() {
      try {
        const result = await ipcRenderer.invoke('list-backups');
        return PreloadSanitizer.sanitizeResult(result);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // SISTEMA DE EVENTOS
  // ===================================================
  events: {
    // Registrar listener
    on(event, callback) {
      eventManager.on(event, callback);
    },

    // Registrar listener uma vez
    once(event, callback) {
      eventManager.once(event, callback);
    },

    // Remover listener
    off(event, callback) {
      eventManager.off(event, callback);
    },

    // Emitir evento
    emit(event, data) {
      eventManager.emit(event, data);
    },

    // Remover todos os listeners
    removeAll(event = null) {
      eventManager.removeAllListeners(event);
    }
  },

  // ===================================================
  // SISTEMA TRAY
  // ===================================================
  tray: {
    // Atualizar menu do tray com jogos
    updateGames(games) {
      try {
        if (!Array.isArray(games)) {
          throw new Error('Lista de jogos deve ser um array');
        }
        
        ipcRenderer.send('update-tray-games', games);
        console.log('🎯 Menu do tray atualizado com', games.length, 'jogos');
        
        return { success: true };
      } catch (error) {
        console.error('Erro ao atualizar tray:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // ===================================================
  // UTILITÁRIOS
  // ===================================================
  utils: {
    // Validar dados de jogo
    validateGame(gameData) {
      try {
        return PreloadSanitizer.validateGameData(gameData);
      } catch (error) {
        return null;
      }
    },

    // Validar ID de jogo
    validateGameId(gameId) {
      try {
        return PreloadSanitizer.validateGameId(gameId);
      } catch (error) {
        return null;
      }
    },

    // Sanitizar resultado
    sanitizeResult(result) {
      return PreloadSanitizer.sanitizeResult(result);
    },

    // Throttle função
    throttle(key, fn, delay = 1000) {
      return requestManager.throttle(key, fn, delay);
    },

    // Debounce função
    debounce(key, fn, delay = 500) {
      return requestManager.debounce(key, fn, delay);
    },

    // Formatar bytes
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    },

    // Formatar duração
    formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    },

    // Log avançado
    log: {
      info: (message, data) => console.log(`ℹ️ ${message}`, data || ''),
      success: (message, data) => console.log(`✅ ${message}`, data || ''),
      warn: (message, data) => console.warn(`⚠️ ${message}`, data || ''),
      error: (message, data) => console.error(`❌ ${message}`, data || ''),
      debug: (message, data) => console.debug(`🔍 ${message}`, data || '')
    }
  },

  // ===================================================
  // INFORMAÇÕES DO SISTEMA
  // ===================================================
  system: {
    // Versão do GamePath AI
    version: '3.0.0',
    
    // Plataforma
    platform: process.platform,
    
    // Informações de build
    build: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome
    },

    // Status da aplicação
    async getStatus() {
      try {
        const diagnostics = await GamePathAI.monitoring.runDiagnostics();
        return diagnostics.success ? diagnostics.data : null;
      } catch (error) {
        return null;
      }
    }
  }
};

// ===================================================
// EXPOSIÇÃO SEGURA DA API
// ===================================================

try {
  contextBridge.exposeInMainWorld('electronAPI', GamePathAI);
  contextBridge.exposeInMainWorld('gamePathAI', GamePathAI); // Alias
  
  console.log('🚀 GamePath AI Bridge carregado com sucesso!');
  console.log('📋 APIs disponíveis:', Object.keys(GamePathAI));
  console.log('🔧 Versão:', GamePathAI.system.version);
  
} catch (error) {
  console.error('❌ Erro ao expor APIs:', error);
}

// ===================================================
// LIMPEZA AUTOMÁTICA
// ===================================================

window.addEventListener('beforeunload', () => {
  try {
    requestManager.cancelAll();
    eventManager.removeAllListeners();
    frontendCache.clear();
    console.log('🧹 Limpeza do preload concluída');
  } catch (error) {
    console.error('Erro na limpeza:', error);
  }
});

// ===================================================
// TESTES AUTOMÁTICOS (DESENVOLVIMENTO)
// ===================================================

if (process.env.NODE_ENV === 'development') {
  setTimeout(async () => {
    try {
      console.log('🧪 Executando testes do preload...');
      
      // Teste de validação
      const validGame = GamePathAI.utils.validateGame({ name: 'Test Game', platform: 'Steam' });
      console.log('✅ Teste validação:', validGame ? 'OK' : 'FALHA');
      
      // Teste de cache
      frontendCache.set('test', { data: 'test' });
      const cached = frontendCache.get('test');
      console.log('✅ Teste cache:', cached ? 'OK' : 'FALHA');
      
      // Teste de eventos
      let eventFired = false;
      GamePathAI.events.once('test-event', () => { eventFired = true; });
      GamePathAI.events.emit('test-event');
      console.log('✅ Teste eventos:', eventFired ? 'OK' : 'FALHA');
      
      console.log('🎉 Testes do preload concluídos!');
      
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
    }
  }, 1000);
}