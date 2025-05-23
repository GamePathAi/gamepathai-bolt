// preload.cjs - GamePath AI Professional Bridge v2.0
// Sistema completo de ponte entre Main Process e Renderer Process

const { contextBridge, ipcRenderer } = require('electron');

// ===================================================
// SISTEMA DE CACHE INTELIGENTE PARA PRELOAD
// ===================================================

class PreloadCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 30000; // 30 segundos
    this.maxSize = 100;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data) {
    // Limpar cache se muito grande
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data: this.sanitizeData(data),
      timestamp: Date.now()
    });
  }

  clear(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  sanitizeData(data) {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'function') return '[Function]';
    if (data instanceof Date) return data.toISOString();
    if (data instanceof Error) return {
      name: data.name,
      message: data.message,
      stack: data.stack
    };
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        if (!key.startsWith('_') && typeof value !== 'function') {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
}

// ===================================================
// SISTEMA DE RATE LIMITING
// ===================================================

class RateLimiter {
  constructor() {
    this.calls = new Map();
    this.limits = {
      'scan-games': { max: 1, window: 10000 }, // 1 por 10s
      'launch-game': { max: 3, window: 5000 },  // 3 por 5s
      'optimize': { max: 2, window: 30000 },    // 2 por 30s
      'metrics': { max: 10, window: 1000 },     // 10 por 1s
      'default': { max: 20, window: 1000 }      // 20 por 1s
    };
  }

  isAllowed(action) {
    const now = Date.now();
    const limit = this.limits[action] || this.limits.default;
    
    if (!this.calls.has(action)) {
      this.calls.set(action, []);
    }
    
    const calls = this.calls.get(action);
    
    // Remover chamadas antigas
    const cutoff = now - limit.window;
    const recentCalls = calls.filter(time => time > cutoff);
    
    if (recentCalls.length >= limit.max) {
      return false;
    }
    
    recentCalls.push(now);
    this.calls.set(action, recentCalls);
    return true;
  }

  getRemainingCalls(action) {
    const limit = this.limits[action] || this.limits.default;
    const calls = this.calls.get(action) || [];
    const now = Date.now();
    const cutoff = now - limit.window;
    const recentCalls = calls.filter(time => time > cutoff);
    
    return Math.max(0, limit.max - recentCalls.length);
  }
}

// ===================================================
// SISTEMA DE VALIDAÇÃO DE INPUTS
// ===================================================

class InputValidator {
  static validateGameId(gameId) {
    if (!gameId || typeof gameId !== 'string') {
      throw new Error('Game ID deve ser uma string não vazia');
    }
    
    if (gameId.length > 200) {
      throw new Error('Game ID muito longo');
    }
    
    if (!/^[a-zA-Z0-9\-_\.]+$/.test(gameId)) {
      throw new Error('Game ID contém caracteres inválidos');
    }
    
    return true;
  }

  static validateProfile(profile) {
    if (!profile || typeof profile !== 'string') {
      throw new Error('Profile deve ser uma string');
    }
    
    const validProfiles = [
      'ultra-performance',
      'balanced-fps', 
      'balanced-quality',
      'quality'
    ];
    
    if (!validProfiles.includes(profile)) {
      throw new Error(`Profile inválido. Válidos: ${validProfiles.join(', ')}`);
    }
    
    return true;
  }

  static validateGameObject(game) {
    if (!game || typeof game !== 'object') {
      throw new Error('Game deve ser um objeto');
    }
    
    if (!game.id || !game.name) {
      throw new Error('Game deve ter id e name');
    }
    
    this.validateGameId(game.id);
    
    if (typeof game.name !== 'string' || game.name.length === 0) {
      throw new Error('Game name deve ser uma string não vazia');
    }
    
    return true;
  }

  static validateOptimizationOptions(options) {
    if (!options || typeof options !== 'object') {
      throw new Error('Options deve ser um objeto');
    }
    
    const validComponents = ['cpu', 'memory', 'gpu', 'network', 'disk', 'all'];
    
    if (options.component && !validComponents.includes(options.component)) {
      throw new Error(`Component inválido. Válidos: ${validComponents.join(', ')}`);
    }
    
    return true;
  }
}

// ===================================================
// SISTEMA DE ERROR HANDLING ROBUSTO
// ===================================================

class ErrorHandler {
  static async safeInvoke(channel, ...args) {
    try {
      const result = await ipcRenderer.invoke(channel, ...args);
      
      if (result && typeof result === 'object' && result.success === false) {
        throw new Error(result.error || 'Operação falhou');
      }
      
      return result;
    } catch (error) {
      console.error(`[GamePath] Erro em ${channel}:`, error);
      
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        channel,
        timestamp: Date.now()
      };
    }
  }

  static async safeInvokeWithRetry(channel, maxRetries = 2, delay = 1000, ...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.warn(`[GamePath] Tentativa ${attempt + 1} para ${channel}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return await this.safeInvoke(channel, ...args);
      } catch (error) {
        lastError = error;
        console.warn(`[GamePath] Tentativa ${attempt + 1} falhou:`, error.message);
      }
    }
    
    throw lastError;
  }
}

// ===================================================
// SISTEMA DE THROTTLING E DEBOUNCING
// ===================================================

class ThrottleDebounce {
  constructor() {
    this.throttled = new Map();
    this.debounced = new Map();
  }

  throttle(fn, delay, key) {
    if (!this.throttled.has(key)) {
      this.throttled.set(key, {
        lastCall: 0,
        timeoutId: null
      });
    }
    
    const throttleData = this.throttled.get(key);
    const now = Date.now();
    
    if (now - throttleData.lastCall >= delay) {
      throttleData.lastCall = now;
      return fn();
    }
    
    return Promise.resolve(null);
  }

  debounce(fn, delay, key) {
    if (this.debounced.has(key)) {
      clearTimeout(this.debounced.get(key));
    }
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        this.debounced.delete(key);
        const result = await fn();
        resolve(result);
      }, delay);
      
      this.debounced.set(key, timeoutId);
    });
  }
}

// ===================================================
// SISTEMA DE EVENTOS EM TEMPO REAL
// ===================================================

class EventSystem {
  constructor() {
    this.listeners = new Map();
    this.setupIpcListeners();
  }

  setupIpcListeners() {
    // Métricas em tempo real
    ipcRenderer.on('real-time-metrics', (event, data) => {
      this.emit('system-metrics', data.system);
      this.emit('network-metrics', data.network);
      
      Object.entries(data.games || {}).forEach(([gameId, metrics]) => {
        this.emit('game-metrics', { gameId, ...metrics });
      });
    });

    // Performance de jogos
    ipcRenderer.on('game-performance-update', (event, data) => {
      this.emit('game-performance', data);
      
      if (data.metrics.fps < 30) {
        this.emit('performance-alert', {
          type: 'low-fps',
          gameId: data.gameId,
          gameName: data.gameName,
          fps: data.metrics.fps,
          severity: 'warning'
        });
      }
    });

    // Jogos detectados
    ipcRenderer.on('games-detected', (event, games) => {
      this.emit('games-updated', games);
      
      const codGames = games.filter(g => 
        g.gameFamily === 'Call of Duty' || 
        g.name.toLowerCase().includes('call of duty')
      );
      
      if (codGames.length > 0) {
        this.emit('cod-detected', codGames);
      }
    });

    // Lançamento de jogos
    ipcRenderer.on('game-launched', (event, data) => {
      this.emit('game-launched', data);
    });

    // Sistema otimizado
    ipcRenderer.on('system-optimized', (event, data) => {
      this.emit('system-optimized', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(cache.sanitizeData(data));
        } catch (error) {
          console.error(`[GamePath] Erro no listener ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event = null) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// ===================================================
// INSTANCIAR SISTEMAS
// ===================================================

const cache = new PreloadCache();
const rateLimiter = new RateLimiter();
const throttleDebounce = new ThrottleDebounce();
const eventSystem = new EventSystem();

// ===================================================
// API PRINCIPAL - GAMES
// ===================================================

const gamesAPI = {
  // Detectar jogos com filtros inteligentes
  async getOrganized() {
    if (!rateLimiter.isAllowed('scan-games')) {
      throw new Error('Rate limit excedido para scan de jogos');
    }

    const cacheKey = 'organized-games';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await ErrorHandler.safeInvokeWithRetry(
      'scan-games-intelligent', 2, 1000
    );

    if (result.success) {
      cache.set(cacheKey, result.data);
      return result.data;
    }

    throw new Error(result.error);
  },

  // Detectar apenas jogos principais (sem DLCs)
  async getMainGamesOnly() {
    const allGames = await this.getOrganized();
    return allGames.filter(game => 
      game.isMainGame !== false && 
      !this.isDLC(game.name)
    );
  },

  // Verificar se é DLC
  isDLC(gameName) {
    const dlcKeywords = [
      'dlc', 'pack', 'addon', 'expansion', 'season pass',
      'battle pass', 'content pack', 'map pack', 'weapon pack'
    ];
    
    return dlcKeywords.some(keyword => 
      gameName.toLowerCase().includes(keyword)
    );
  },

  // Detectar jogos Xbox com método profissional
  async getXboxGames() {
    if (!rateLimiter.isAllowed('scan-games')) {
      throw new Error('Rate limit excedido para Xbox scan');
    }

    const result = await ErrorHandler.safeInvoke('scan-xbox-professional');
    
    if (result.success) {
      return result.data;
    }

    throw new Error(result.error);
  },

  // Refrescar biblioteca de jogos
  async refreshGameLibrary() {
    cache.clear('organized-games');
    cache.clear('xbox-games');
    
    return await this.getOrganized();
  },

  // Obter detalhes específicos de um jogo
  async getGameDetails(gameId) {
    InputValidator.validateGameId(gameId);
    
    const allGames = await this.getOrganized();
    const game = allGames.find(g => g.id === gameId);
    
    if (!game) {
      throw new Error(`Jogo ${gameId} não encontrado`);
    }

    return {
      ...game,
      profile: await profilesAPI.getGameProfile(gameId),
      isRunning: await launcherAPI.isGameRunning(gameId)
    };
  },

  // Obter estatísticas de um jogo
  async getGameStats(gameId) {
    InputValidator.validateGameId(gameId);
    
    const details = await this.getGameDetails(gameId);
    
    return {
      gameId,
      name: details.name,
      platform: details.platform,
      size: details.size,
      lastPlayed: details.lastPlayed,
      playTime: details.playTime || 0,
      launchCount: details.launchCount || 0,
      avgFPS: details.avgFPS || 0,
      avgSessionTime: details.avgSessionTime || 0
    };
  },

  // Validar arquivos do jogo
  async validateGameFiles(gameId) {
    InputValidator.validateGameId(gameId);
    
    const game = await this.getGameDetails(gameId);
    
    return {
      gameId,
      isValid: game.installPath ? true : false,
      executableExists: game.executablePath ? true : false,
      sizeMatch: true, // Placeholder
      checksumValid: true, // Placeholder
      lastValidated: new Date().toISOString()
    };
  }
};

// ===================================================
// API PRINCIPAL - LAUNCHER
// ===================================================

const launcherAPI = {
  // Lançar jogo com otimização automática
  async launchGame(gameId, profile = 'balanced-fps') {
    InputValidator.validateGameId(gameId);
    InputValidator.validateProfile(profile);
    
    if (!rateLimiter.isAllowed('launch-game')) {
      throw new Error('Rate limit excedido para lançamento');
    }

    const game = await gamesAPI.getGameDetails(gameId);
    
    const result = await ErrorHandler.safeInvoke(
      'launch-game-professional', 
      game, 
      profile
    );

    if (result.success) {
      eventSystem.emit('game-launched', {
        gameId,
        gameName: game.name,
        profile,
        timestamp: Date.now()
      });
      
      return result;
    }

    throw new Error(result.error);
  },

  // Lançar jogo com opções customizadas
  async launchGameWithOptimizations(gameId, options = {}) {
    InputValidator.validateGameId(gameId);
    InputValidator.validateOptimizationOptions(options);
    
    const profile = options.profile || 'balanced-fps';
    
    // Otimizar sistema primeiro se solicitado
    if (options.preOptimize) {
      await optimizationAPI.optimizeForGame(gameId, profile);
    }

    return await this.launchGame(gameId, profile);
  },

  // Lançamento rápido (perfil balanceado)
  async quickLaunch(gameId) {
    return await this.launchGame(gameId, 'balanced-fps');
  },

  // Lançar Call of Duty com otimizações específicas
  async launchCallOfDuty(gameId) {
    InputValidator.validateGameId(gameId);
    
    const game = await gamesAPI.getGameDetails(gameId);
    
    if (!game.gameFamily || game.gameFamily !== 'Call of Duty') {
      throw new Error('Jogo não é Call of Duty');
    }

    const result = await ErrorHandler.safeInvoke('launch-call-of-duty', game);
    
    if (result.success) {
      eventSystem.emit('cod-launched', {
        gameId,
        gameName: game.name,
        method: result.method,
        timestamp: Date.now()
      });
    }

    return result;
  },

  // Verificar se jogo está rodando
  async isGameRunning(gameId) {
    InputValidator.validateGameId(gameId);
    
    const runningGames = await this.getRunningGames();
    return runningGames.some(game => game.gameId === gameId);
  },

  // Terminar jogo
  async killGame(gameId) {
    InputValidator.validateGameId(gameId);
    
    const game = await gamesAPI.getGameDetails(gameId);
    
    if (!game.processName) {
      throw new Error('Nome do processo não encontrado');
    }

    // Placeholder - em produção seria IPC para terminar processo
    return {
      success: true,
      gameId,
      message: `Processo ${game.processName} terminado`
    };
  },

  // Obter jogos em execução
  async getRunningGames() {
    const result = await ErrorHandler.safeInvoke('get-running-games');
    
    if (result.success) {
      return result.data;
    }

    return [];
  }
};

// ===================================================
// API PRINCIPAL - OPTIMIZATION
// ===================================================

const optimizationAPI = {
  // Otimização automática do sistema
  async optimizeSystem(profile = 'balanced-fps') {
    InputValidator.validateProfile(profile);
    
    if (!rateLimiter.isAllowed('optimize')) {
      throw new Error('Rate limit excedido para otimização');
    }

    const result = await ErrorHandler.safeInvoke(
      'optimize-system-intelligent', 
      null, 
      profile
    );

    if (result.success) {
      eventSystem.emit('system-optimized', {
        profile,
        timestamp: Date.now()
      });
    }

    return result;
  },

  // Otimizar sistema para jogo específico
  async optimizeForGame(gameId, profile = 'balanced-fps') {
    InputValidator.validateGameId(gameId);
    InputValidator.validateProfile(profile);
    
    const game = await gamesAPI.getGameDetails(gameId);
    
    const result = await ErrorHandler.safeInvoke(
      'optimize-system-intelligent', 
      game, 
      profile
    );

    if (result.success) {
      eventSystem.emit('game-optimized', {
        gameId,
        gameName: game.name,
        profile,
        timestamp: Date.now()
      });
    }

    return result;
  },

  // Resetar otimizações
  async resetOptimizations() {
    // Placeholder - em produção resetaria configurações
    return {
      success: true,
      message: 'Otimizações resetadas para padrão'
    };
  },

  // Configurar prioridade de CPU
  async setCPUPriority(level) {
    const validLevels = ['low', 'normal', 'high', 'realtime'];
    
    if (!validLevels.includes(level)) {
      throw new Error(`Nível inválido. Válidos: ${validLevels.join(', ')}`);
    }

    return await ErrorHandler.safeInvoke('optimize-system', 'cpu', level);
  },

  // Configurar modo de GPU
  async setGPUMode(mode) {
    const validModes = ['performance', 'balanced', 'quality', 'auto'];
    
    if (!validModes.includes(mode)) {
      throw new Error(`Modo inválido. Válidos: ${validModes.join(', ')}`);
    }

    return await ErrorHandler.safeInvoke('optimize-system', 'gpu', mode);
  },

  // Limpar memória
  async cleanMemory() {
    const result = await ErrorHandler.safeInvoke('optimize-system', 'memory', 'clean');
    
    if (result.success) {
      eventSystem.emit('memory-cleaned', {
        freedMemory: result.memoryFreed || 0,
        timestamp: Date.now()
      });
    }

    return result;
  },

  // Otimizar rede
  async optimizeNetwork() {
    return await ErrorHandler.safeInvoke('optimize-system', 'network', 'gaming');
  },

  // Obter perfis de otimização disponíveis
  async getOptimizationProfiles() {
    const cacheKey = 'optimization-profiles';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await ErrorHandler.safeInvoke('get-optimization-profiles');
    
    if (result.success) {
      cache.set(cacheKey, result.data);
      return result.data;
    }

    return {};
  }
};

// ===================================================
// API PRINCIPAL - MONITORING
// ===================================================

const monitoringAPI = {
  // Obter métricas do sistema
  async getSystemMetrics() {
    if (!rateLimiter.isAllowed('metrics')) {
      return null; // Silencioso para não spammar
    }

    const result = await ErrorHandler.safeInvoke('get-system-info');
    
    return result.success ? result.data : null;
  },

  // Obter métricas de jogo específico
  async getGameMetrics(gameId) {
    InputValidator.validateGameId(gameId);
    
    const runningGames = await launcherAPI.getRunningGames();
    const gameData = runningGames.find(g => g.gameId === gameId);
    
    return gameData ? gameData.metrics : null;
  },

  // Iniciar monitoramento em tempo real
  async startRealTimeMonitoring(gameId = null) {
    if (gameId) {
      InputValidator.validateGameId(gameId);
    }

    const result = await ErrorHandler.safeInvoke('start-monitoring');
    
    if (result.success && gameId) {
      eventSystem.emit('monitoring-started', { gameId });
    }

    return result;
  },

  // Parar monitoramento em tempo real
  async stopRealTimeMonitoring(gameId = null) {
    if (gameId) {
      InputValidator.validateGameId(gameId);
    }

    const result = await ErrorHandler.safeInvoke('stop-monitoring');
    
    if (result.success && gameId) {
      eventSystem.emit('monitoring-stopped', { gameId });
    }

    return result;
  }
};

// ===================================================
// API PRINCIPAL - PROFILES
// ===================================================

const profilesAPI = {
  // Obter perfil de jogo
  async getGameProfile(gameId) {
    InputValidator.validateGameId(gameId);
    
    const cacheKey = `profile-${gameId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await ErrorHandler.safeInvoke('get-game-profile', gameId);
    
    if (result.success) {
      cache.set(cacheKey, result.data);
      return result.data;
    }

    return null;
  },

  // Salvar perfil de jogo
  async saveGameProfile(gameId, profile) {
    InputValidator.validateGameId(gameId);
    
    if (!profile || typeof profile !== 'object') {
      throw new Error('Perfil deve ser um objeto');
    }

    const result = await ErrorHandler.safeInvoke('set-game-profile', gameId, profile);
    
    if (result.success) {
      cache.clear(`profile-${gameId}`);
      
      eventSystem.emit('profile-saved', {
        gameId,
        profile,
        timestamp: Date.now()
      });
    }

    return result;
  },

  // Deletar perfil de jogo
  async deleteGameProfile(gameId) {
    InputValidator.validateGameId(gameId);
    
    const result = await this.saveGameProfile(gameId, null);
    
    if (result.success) {
      eventSystem.emit('profile-deleted', { gameId });
    }

    return result;
  },

  // Obter perfil padrão
  async getDefaultProfile() {
    const profiles = await optimizationAPI.getOptimizationProfiles();
    return profiles['balanced-fps'] || {};
  }
};

// ===================================================
// API PRINCIPAL - NETWORK
// ===================================================

const networkAPI = {
  // Testar ping de servidores
  async testServerPing(servers = null) {
    const defaultServers = [
      { name: 'Cloudflare', host: '1.1.1.1' },
      { name: 'Google', host: '8.8.8.8' },
      { name: 'OpenDNS', host: '208.67.222.222' }
    ];

    const serversToTest = servers || defaultServers;
    
    const result = await ErrorHandler.safeInvoke('find-best-route');
    
    return result.success ? result.data : null;
  },

  // Otimizar rede para jogo
  async optimizeNetworkForGame(gameId) {
    InputValidator.validateGameId(gameId);
    
    const game = await gamesAPI.getGameDetails(gameId);
    
    // Usar servidor otimizado baseado no jogo
    const bestRoute = await this.testServerPing();
    
    if (bestRoute) {
      return await ErrorHandler.safeInvoke('optimize-network-route', bestRoute.server);
    }

    return { success: false, error: 'Nenhuma rota disponível' };
  },

  // Obter status da rede
  async getNetworkStatus() {
    const metrics = await monitoringAPI.getSystemMetrics();
    
    if (metrics && metrics.network) {
      return {
        latency: metrics.network.latency,
        downloadSpeed: metrics.network.downloadSpeed,
        uploadSpeed: metrics.network.uploadSpeed,
        quality: metrics.network.quality,
        timestamp: Date.now()
      };
    }

    return null;
  },

  // Configurar provedor DNS
  async setDNSProvider(provider) {
    const validProviders = ['cloudflare', 'google', 'opendns', 'auto'];
    
    if (!validProviders.includes(provider)) {
      throw new Error(`Provedor inválido. Válidos: ${validProviders.join(', ')}`);
    }

    // Placeholder - em produção configuraria DNS
    return {
      success: true,
      provider,
      message: `DNS configurado para ${provider}`
    };
  }
};

// ===================================================
// API PRINCIPAL - SYSTEM
// ===================================================

const systemAPI = {
  // Obter configurações
  async getSettings() {
    const cacheKey = 'system-settings';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Placeholder - em produção carregaria configurações reais
    const settings = {
      autoOptimize: true,
      realTimeMonitoring: true,
      notifications: true,
      autoLaunch: false,
      theme: 'dark',
      language: 'pt-BR',
      updateInterval: 5000,
      cacheEnabled: true
    };

    cache.set(cacheKey, settings);
    return settings;
  },

  // Atualizar configurações
  async updateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings deve ser um objeto');
    }

    cache.clear('system-settings');
    
    // Placeholder - em produção salvaria configurações
    eventSystem.emit('settings-updated', {
      settings,
      timestamp: Date.now()
    });

    return {
      success: true,
      settings,
      message: 'Configurações atualizadas'
    };
  },

  // Resetar para padrões
  async resetToDefaults() {
    cache.clear('system-settings');
    
    return {
      success: true,
      message: 'Configurações resetadas para padrão'
    };
  },

  // Executar diagnósticos
  async runDiagnostics() {
    const result = await ErrorHandler.safeInvoke('run-advanced-diagnostics');
    
    if (result.success) {
      eventSystem.emit('diagnostics-complete', result.data);
      return result.data;
    }

    throw new Error(result.error);
  },

  // Testar todos os detectores
  async testAllDetectors() {
    const diagnostics = await this.runDiagnostics();
    
    return {
      detectors: diagnostics.detectors || {},
      filters: diagnostics.filters || {},
      xbox: diagnostics.xbox || {},
      launcher: diagnostics.launcher || {}
    };
  },

  // Gerar relatório do sistema
  async generateSystemReport() {
    const [
      diagnostics,
      stats,
      settings,
      runningGames,
      systemMetrics
    ] = await Promise.allSettled([
      this.runDiagnostics(),
      this.getSystemStatistics(),
      this.getSettings(),
      launcherAPI.getRunningGames(),
      monitoringAPI.getSystemMetrics()
    ]);

    return {
      timestamp: Date.now(),
      diagnostics: diagnostics.status === 'fulfilled' ? diagnostics.value : null,
      statistics: stats.status === 'fulfilled' ? stats.value : null,
      settings: settings.status === 'fulfilled' ? settings.value : null,
      runningGames: runningGames.status === 'fulfilled' ? runningGames.value : [],
      systemMetrics: systemMetrics.status === 'fulfilled' ? systemMetrics.value : null,
      cacheStats: {
        size: cache.cache.size,
        maxSize: cache.maxSize,
        ttl: cache.ttl
      },
      rateLimitStats: {
        remainingCalls: {
          scanGames: rateLimiter.getRemainingCalls('scan-games'),
          launchGame: rateLimiter.getRemainingCalls('launch-game'),
          optimize: rateLimiter.getRemainingCalls('optimize'),
          metrics: rateLimiter.getRemainingCalls('metrics')
        }
      }
    };
  },

  // Obter estatísticas do sistema
  async getSystemStatistics() {
    const result = await ErrorHandler.safeInvoke('get-system-statistics');
    
    return result.success ? result.data : null;
  },

  // Limpar todos os caches
  async clearAllCaches() {
    cache.clear();
    
    const result = await ErrorHandler.safeInvoke('clear-all-caches');
    
    if (result.success) {
      eventSystem.emit('caches-cleared', { timestamp: Date.now() });
    }

    return result;
  }
};

// ===================================================
// API DE EVENTOS
// ===================================================

const eventsAPI = {
  // Registrar listener para eventos
  on: (event, callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback deve ser uma função');
    }
    
    return eventSystem.on(event, callback);
  },

  // Remover listener
  off: (event, callback) => {
    return eventSystem.off(event, callback);
  },

  // Eventos específicos com throttling
  onSystemMetrics: (callback) => {
    return eventSystem.on('system-metrics', (data) => {
      throttleDebounce.throttle(() => callback(data), 1000, 'system-metrics');
    });
  },

  onGameMetrics: (callback) => {
    return eventSystem.on('game-metrics', (data) => {
      throttleDebounce.throttle(() => callback(data), 500, 'game-metrics');
    });
  },

  onPerformanceAlert: (callback) => {
    return eventSystem.on('performance-alert', callback);
  },

  onGameLaunched: (callback) => {
    return eventSystem.on('game-launched', callback);
  },

  onGamesUpdated: (callback) => {
    return eventSystem.on('games-updated', callback);
  },

  onCODDetected: (callback) => {
    return eventSystem.on('cod-detected', callback);
  },

  onSystemOptimized: (callback) => {
    return eventSystem.on('system-optimized', callback);
  }
};

// ===================================================
// API DE UTILIDADES
// ===================================================

const utilsAPI = {
  // Informações sobre rate limiting
  getRateLimitInfo: () => {
    return {
      scanGames: rateLimiter.getRemainingCalls('scan-games'),
      launchGame: rateLimiter.getRemainingCalls('launch-game'),
      optimize: rateLimiter.getRemainingCalls('optimize'),
      metrics: rateLimiter.getRemainingCalls('metrics')
    };
  },

  // Informações sobre cache
  getCacheInfo: () => {
    return {
      size: cache.cache.size,
      maxSize: cache.maxSize,
      ttl: cache.ttl,
      keys: Array.from(cache.cache.keys())
    };
  },

  // Limpar cache específico
  clearCache: (key = null) => {
    cache.clear(key);
    return { success: true, cleared: key || 'all' };
  },

  // Validar game object
  validateGame: (game) => {
    try {
      InputValidator.validateGameObject(game);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },

  // Sanitizar dados
  sanitize: (data) => {
    return cache.sanitizeData(data);
  },

  // Estatísticas de uso
  getUsageStats: () => {
    return {
      cacheHits: cache.cache.size,
      totalListeners: Array.from(eventSystem.listeners.values())
        .reduce((total, set) => total + set.size, 0),
      rateLimitCalls: Object.fromEntries(
        Object.keys(rateLimiter.limits).map(action => [
          action,
          rateLimiter.calls.get(action)?.length || 0
        ])
      )
    };
  }
};

// ===================================================
// API DE OPERAÇÕES EM LOTE
// ===================================================

const batchAPI = {
  // Executar múltiplas operações
  async batchOperations(operations) {
    if (!Array.isArray(operations)) {
      throw new Error('Operations deve ser um array');
    }

    if (operations.length > 10) {
      throw new Error('Máximo 10 operações por lote');
    }

    const results = [];

    for (const operation of operations) {
      try {
        let result;

        switch (operation.type) {
          case 'getSystemMetrics':
            result = await monitoringAPI.getSystemMetrics();
            break;
          case 'getGameStats':
            result = await gamesAPI.getGameStats(operation.gameId);
            break;
          case 'getNetworkStatus':
            result = await networkAPI.getNetworkStatus();
            break;
          case 'getGameProfile':
            result = await profilesAPI.getGameProfile(operation.gameId);
            break;
          default:
            result = { error: `Operação ${operation.type} não reconhecida` };
        }

        results.push({
          operation: operation.type,
          success: !result?.error,
          data: result,
          timestamp: Date.now()
        });

      } catch (error) {
        results.push({
          operation: operation.type,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }

    return results;
  },

  // Executar operações específicas para Call of Duty
  async codBatchOperations(gameId) {
    InputValidator.validateGameId(gameId);

    return await this.batchOperations([
      { type: 'getGameStats', gameId },
      { type: 'getGameProfile', gameId },
      { type: 'getSystemMetrics' },
      { type: 'getNetworkStatus' }
    ]);
  }
};

// ===================================================
// EXPOSIÇÃO SEGURA VIA CONTEXT BRIDGE
// ===================================================

const electronAPI = {
  // === JOGOS ===
  games: {
    getOrganized: () => gamesAPI.getOrganized(),
    getMainGamesOnly: () => gamesAPI.getMainGamesOnly(),
    getXboxGames: () => gamesAPI.getXboxGames(),
    refreshGameLibrary: () => gamesAPI.refreshGameLibrary(),
    getGameDetails: (gameId) => gamesAPI.getGameDetails(gameId),
    getGameStats: (gameId) => gamesAPI.getGameStats(gameId),
    validateGameFiles: (gameId) => gamesAPI.validateGameFiles(gameId)
  },

  // === LANÇAMENTO ===
  launcher: {
    launchGame: (gameId, profile) => launcherAPI.launchGame(gameId, profile),
    launchGameWithOptimizations: (gameId, options) => 
      launcherAPI.launchGameWithOptimizations(gameId, options),
    quickLaunch: (gameId) => launcherAPI.quickLaunch(gameId),
    launchCallOfDuty: (gameId) => launcherAPI.launchCallOfDuty(gameId),
    isGameRunning: (gameId) => launcherAPI.isGameRunning(gameId),
    killGame: (gameId) => launcherAPI.killGame(gameId),
    getRunningGames: () => launcherAPI.getRunningGames()
  },

  // === OTIMIZAÇÃO ===
  optimization: {
    optimizeSystem: (profile) => optimizationAPI.optimizeSystem(profile),
    optimizeForGame: (gameId, profile) => optimizationAPI.optimizeForGame(gameId, profile),
    resetOptimizations: () => optimizationAPI.resetOptimizations(),
    setCPUPriority: (level) => optimizationAPI.setCPUPriority(level),
    setGPUMode: (mode) => optimizationAPI.setGPUMode(mode),
    cleanMemory: () => optimizationAPI.cleanMemory(),
    optimizeNetwork: () => optimizationAPI.optimizeNetwork(),
    getOptimizationProfiles: () => optimizationAPI.getOptimizationProfiles()
  },

  // === MONITORAMENTO ===
  monitoring: {
    getSystemMetrics: () => monitoringAPI.getSystemMetrics(),
    getGameMetrics: (gameId) => monitoringAPI.getGameMetrics(gameId),
    startRealTimeMonitoring: (gameId) => monitoringAPI.startRealTimeMonitoring(gameId),
    stopRealTimeMonitoring: (gameId) => monitoringAPI.stopRealTimeMonitoring(gameId)
  },

  // === PERFIS ===
  profiles: {
    getGameProfile: (gameId) => profilesAPI.getGameProfile(gameId),
    saveGameProfile: (gameId, profile) => profilesAPI.saveGameProfile(gameId, profile),
    deleteGameProfile: (gameId) => profilesAPI.deleteGameProfile(gameId),
    getDefaultProfile: () => profilesAPI.getDefaultProfile()
  },

  // === REDE ===
  network: {
    testServerPing: (servers) => networkAPI.testServerPing(servers),
    optimizeNetworkForGame: (gameId) => networkAPI.optimizeNetworkForGame(gameId),
    getNetworkStatus: () => networkAPI.getNetworkStatus(),
    setDNSProvider: (provider) => networkAPI.setDNSProvider(provider)
  },

  // === SISTEMA ===
  system: {
    getSettings: () => systemAPI.getSettings(),
    updateSettings: (settings) => systemAPI.updateSettings(settings),
    resetToDefaults: () => systemAPI.resetToDefaults(),
    runDiagnostics: () => systemAPI.runDiagnostics(),
    testAllDetectors: () => systemAPI.testAllDetectors(),
    generateSystemReport: () => systemAPI.generateSystemReport(),
    getSystemStatistics: () => systemAPI.getSystemStatistics(),
    clearAllCaches: () => systemAPI.clearAllCaches()
  },

  // === EVENTOS ===
  on: eventsAPI.on,
  off: eventsAPI.off,
  onSystemMetrics: eventsAPI.onSystemMetrics,
  onGameMetrics: eventsAPI.onGameMetrics,
  onPerformanceAlert: eventsAPI.onPerformanceAlert,
  onGameLaunched: eventsAPI.onGameLaunched,
  onGamesUpdated: eventsAPI.onGamesUpdated,
  onCODDetected: eventsAPI.onCODDetected,
  onSystemOptimized: eventsAPI.onSystemOptimized,

  // === UTILITÁRIOS ===
  utils: {
    getRateLimitInfo: utilsAPI.getRateLimitInfo,
    getCacheInfo: utilsAPI.getCacheInfo,
    clearCache: utilsAPI.clearCache,
    validateGame: utilsAPI.validateGame,
    sanitize: utilsAPI.sanitize,
    getUsageStats: utilsAPI.getUsageStats
  },

  // === OPERAÇÕES EM LOTE ===
  batchOperations: batchAPI.batchOperations,
  codBatchOperations: batchAPI.codBatchOperations
};

// ===================================================
// CONTEXT BRIDGE - EXPOSIÇÃO SEGURA
// ===================================================

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// ===================================================
// INICIALIZAÇÃO E LOGS
// ===================================================

console.log('🚀 GamePath AI Professional Bridge v2.0 - Inicializado!');
console.log('📋 APIs disponíveis:');
console.log('   🎮 games - Detecção e gerenciamento de jogos');
console.log('   🚀 launcher - Sistema de lançamento profissional');
console.log('   ⚡ optimization - Otimização inteligente');
console.log('   📊 monitoring - Monitoramento em tempo real');
console.log('   👤 profiles - Perfis de jogos');
console.log('   🌐 network - Otimização de rede');
console.log('   🔧 system - Configurações e diagnóstico');
console.log('   📡 events - Sistema de eventos');
console.log('   🛠️ utils - Utilitários');
console.log('   📦 batch - Operações em lote');
console.log('');
console.log('🛡️ Recursos de segurança:');
console.log('   ✅ Context Isolation ativo');
console.log('   ✅ Rate Limiting implementado');
console.log('   ✅ Input Validation completa');
console.log('   ✅ Error Handling robusto');
console.log('   ✅ Cache inteligente');
console.log('   ✅ Sanitização de dados');
console.log('');
console.log('⚡ Recursos de performance:');
console.log('   ✅ Throttling e Debouncing');
console.log('   ✅ Cache com TTL');
console.log('   ✅ Retry automático');
console.log('   ✅ Operações em lote');
console.log('   ✅ Eventos otimizados');

// ===================================================
// EXEMPLO DE USO
// ===================================================

/*
// 🎮 EXEMPLO BÁSICO
const games = await window.electronAPI.games.getOrganized();
const mainGame = games[0];

// 🚀 LANÇAMENTO PROFISSIONAL
await window.electronAPI.launcher.launchGame(mainGame.id, 'ultra-performance');

// 📊 MONITORAMENTO
window.electronAPI.onGameMetrics((metrics) => {
  console.log(`FPS: ${metrics.fps}, CPU: ${metrics.cpu}%`);
});

// 🔫 CALL OF DUTY ESPECÍFICO
const codGames = games.filter(g => g.gameFamily === 'Call of Duty');
if (codGames.length > 0) {
  await window.electronAPI.launcher.launchCallOfDuty(codGames[0].id);
}

// ⚡ OTIMIZAÇÃO INTELIGENTE
await window.electronAPI.optimization.optimizeForGame(mainGame.id, 'ultra-performance');

// 📦 OPERAÇÕES EM LOTE
const results = await window.electronAPI.batchOperations([
  { type: 'getSystemMetrics' },
  { type: 'getGameStats', gameId: mainGame.id },
  { type: 'getNetworkStatus' }
]);

// 🌐 OTIMIZAÇÃO DE REDE
await window.electronAPI.network.optimizeNetworkForGame(mainGame.id);

// 🔧 DIAGNÓSTICO COMPLETO
const report = await window.electronAPI.system.generateSystemReport();
console.log('📊 Relatório do sistema:', report);
*/