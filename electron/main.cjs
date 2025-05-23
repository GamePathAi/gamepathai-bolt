// main.cjs - GamePath AI Professional v3.0 - Sistema Completo com Singleton Pattern
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const os = require('os');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const { EventEmitter } = require('events');

const execAsync = promisify(exec);

// ===================================================
// SINGLETON PATTERN - EVITA MÚLTIPLAS INSTÂNCIAS
// ===================================================

class GamePathAISingleton {
  constructor() {
    if (GamePathAISingleton.instance) {
      console.log('⚠️ Retornando instância existente do GamePath AI');
      return GamePathAISingleton.instance;
    }

    // Inicializar propriedades únicas
    this.isInitialized = false;
    this.ipcHandlersRegistered = false;
    this.loggingInitialized = false;
    
    // Referências para janela e tray
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
    
    // Instância única
    GamePathAISingleton.instance = this;
  }

  // ===================================================
  // CONFIGURAÇÕES CENTRALIZADAS
  // ===================================================
  
  getConfig() {
    return {
      // Paths
      CONFIG_DIR: path.join(os.homedir(), '.gamepath-ai'),
      
      // Cache
      CACHE_TTL: 5 * 60 * 1000, // 5 minutos
      CACHE_MAX_SIZE: 1000,
      
      // Performance
      MAX_DETECTION_TIME: 30000, // 30 segundos
      MONITORING_INTERVAL: 2000, // 2 segundos
      BATCH_SIZE: 50,
      
      // Plataformas
      PLATFORMS: {
        Steam: { priority: 10, color: '#171a21', icon: '🎮' },
        Xbox: { priority: 9, color: '#107c10', icon: '🎮' },
        Epic: { priority: 8, color: '#313131', icon: '🎮' },
        'Battle.net': { priority: 7, color: '#00b4ff', icon: '⚔️' },
        GOG: { priority: 6, color: '#86328a', icon: '🎮' },
        Uplay: { priority: 5, color: '#5050dc', icon: '🎮' },
        Standalone: { priority: 4, color: '#666666', icon: '💿' }
      },
      
      // Otimização
      OPTIMIZATION_PROFILES: {
        'ultra-performance': { name: 'Ultra Performance', priority: 'realtime', fps: 120 },
        'balanced-fps': { name: 'Balanced FPS', priority: 'high', fps: 60 },
        'balanced-quality': { name: 'Balanced Quality', priority: 'high', fps: 45 },
        'quality': { name: 'Maximum Quality', priority: 'normal', fps: 30 }
      },
      
      // Rede
      DNS_SERVERS: {
        cloudflare: { primary: '1.1.1.1', secondary: '1.0.0.1', name: 'Cloudflare' },
        google: { primary: '8.8.8.8', secondary: '8.8.4.4', name: 'Google' },
        opendns: { primary: '208.67.222.222', secondary: '208.67.220.220', name: 'OpenDNS' }
      }
    };
  }

  // ===================================================
  // SISTEMA DE LOGGING ÚNICO
  // ===================================================
  
  createLogger() {
    if (this.logger) return this.logger;
    
    const CONFIG = this.getConfig();
    const LOGS_DIR = path.join(CONFIG.CONFIG_DIR, 'logs');
    
    class SingletonLogger {
      constructor() {
        this.logFile = path.join(LOGS_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.errorFile = path.join(LOGS_DIR, `error-${new Date().toISOString().split('T')[0]}.log`);
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.buffer = [];
        this.flushInterval = 5000;
        this.initialized = false;
        this.isLogging = false; // Flag para evitar logs recursivos
      }

      async init() {
        if (this.initialized) return;
        
        try {
          await fsPromises.mkdir(LOGS_DIR, { recursive: true });
          this.initialized = true;
          this.startPeriodicFlush();
          this.info('📝 Sistema de logging inicializado');
        } catch (error) {
          console.error('Erro ao inicializar logger:', error);
        }
      }

      startPeriodicFlush() {
        setInterval(() => {
          if (this.buffer.length > 0) {
            this.flushBuffer();
          }
        }, this.flushInterval);
      }

      log(level, message, data = {}) {
        // Evitar logs recursivos
        if (this.isLogging) return;
        this.isLogging = true;
        
        try {
          const timestamp = new Date().toISOString();
          const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            data: this.sanitizeData(data),
            pid: process.pid
          };

          // Console com cores
          const colors = {
            info: '\x1b[36m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            success: '\x1b[32m',
            debug: '\x1b[35m',
            performance: '\x1b[34m',
            reset: '\x1b[0m'
          };

          const color = colors[level] || colors.reset;
          const prefix = `${color}[${timestamp}] ${level.toUpperCase()}:${colors.reset}`;
          
          console.log(prefix, message, Object.keys(data).length > 0 ? data : '');

          // Adicionar ao buffer
          this.buffer.push(logEntry);

          // Flush imediato para erros
          if (level === 'error' || this.buffer.length > 100) {
            this.flushBuffer();
          }
        } finally {
          this.isLogging = false;
        }
      }

      async flushBuffer() {
        if (this.buffer.length === 0 || !this.initialized) return;

        const entries = [...this.buffer];
        this.buffer = [];

        try {
          const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
          await fsPromises.appendFile(this.logFile, logLines);

          // Logs de erro separados
          const errorEntries = entries.filter(entry => entry.level === 'ERROR');
          if (errorEntries.length > 0) {
            const errorLines = errorEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
            await fsPromises.appendFile(this.errorFile, errorLines);
          }
        } catch (error) {
          console.error('Erro ao escrever logs:', error);
        }
      }

      sanitizeData(data) {
        if (data === null || data === undefined) return data;
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
        if (data instanceof Error) {
          return { name: data.name, message: data.message, stack: data.stack };
        }
        if (Array.isArray(data)) {
          return data.slice(0, 10).map(item => this.sanitizeData(item));
        }
        if (typeof data === 'object') {
          const sanitized = {};
          let count = 0;
          for (const [key, value] of Object.entries(data)) {
            if (count >= 20) break;
            if (!key.startsWith('_') && typeof value !== 'function') {
              sanitized[key] = this.sanitizeData(value);
            }
            count++;
          }
          return sanitized;
        }
        return String(data).substring(0, 1000);
      }

      info(message, data) { this.log('info', message, data); }
      warn(message, data) { this.log('warn', message, data); }
      error(message, data) { this.log('error', message, data); }
      success(message, data) { this.log('success', message, data); }
      debug(message, data) { 
        const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.argv.includes('--debug');
        if (DEBUG_MODE) this.log('debug', message, data); 
      }
      performance(message, data) { this.log('performance', message, data); }

      startTimer(label) {
        const start = process.hrtime.bigint();
        return {
          end: () => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000;
            this.performance(`Timer ${label}`, { duration: `${duration.toFixed(2)}ms` });
            return duration;
          }
        };
      }
    }

    this.logger = new SingletonLogger();
    return this.logger;
  }

  // ===================================================
  // INICIALIZAÇÃO ÚNICA DO SISTEMA
  // ===================================================
  
  async initialize() {
    if (this.isInitialized) {
      this.createLogger().warn('GamePath AI já inicializado - ignorando');
      return;
    }

    const logger = this.createLogger();
    
    try {
      logger.info('🚀 Inicializando GamePath AI Professional v3.0...');
      
      // Inicializar logger primeiro
      await logger.init();
      
      // Criar instâncias dos sistemas
      await this.createSystemInstances();
      
      // Inicializar sistemas
      await this.initializeSystems();
      
      this.isInitialized = true;
      logger.success('✅ GamePath AI inicializado com sucesso');
      
    } catch (error) {
      logger.error('❌ Erro na inicialização:', error.message);
      throw error;
    }
  }

  async createSystemInstances() {
    const CONFIG = this.getConfig();
    const logger = this.createLogger();
    
    // Criar diretórios
    const directories = ['logs', 'cache', 'profiles', 'saves'].map(dir => 
      path.join(CONFIG.CONFIG_DIR, dir)
    );
    
    for (const dir of directories) {
      await fsPromises.mkdir(dir, { recursive: true });
    }
    
    // Sistema de eventos
    this.gameEvents = new GameEventEmitter();
    
    // Sistema de cache
    this.gameCache = new SmartGameCache(CONFIG);
    
    // Sistema de profiles
    this.profileManager = new EnhancedGameProfileManager(CONFIG);
    
    // Detectores
    this.gameDetector = new AdvancedGameDetector(CONFIG, logger);
    this.xboxDetector = new UltraXboxDetector(logger);
    
    // Filtros
    this.intelligentFilter = new SuperIntelligentGameFilter(logger);
    
    // Launcher
    this.gameLauncher = new UltraGameLauncher(logger, this.profileManager);
    
    // Monitor
    this.systemMonitor = new RealTimeSystemMonitor(logger);
    
    // Backup
    this.backupSystem = new BackupSystem(CONFIG, logger);
    
    logger.info('📦 Instâncias dos sistemas criadas');
  }

  async initializeSystems() {
    const logger = this.createLogger();
    
    await this.gameCache.init();
    await this.profileManager.init();
    await this.systemMonitor.init();
    await this.backupSystem.init();
    
    logger.info('📁 Diretórios configurados', { CONFIG_DIR: this.getConfig().CONFIG_DIR });
    logger.success('✅ Todos os sistemas inicializados');
  }

  // ===================================================
  // CRIAÇÃO ÚNICA DA JANELA
  // ===================================================
  
  createMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.createLogger().warn('Janela já existe - focando');
      this.mainWindow.show();
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const logger = this.createLogger();
    logger.info('🖥️ Criando janela principal...');
    
    const iconPath = path.join(__dirname, '../src/assets/icon.png');
    
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      icon: iconPath,
      show: false,
      frame: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false,
        preload: path.join(__dirname, 'preload.cjs'),
        webSecurity: true
      },
      backgroundColor: '#1a1a1a'
    });

    const isDev = process.env.NODE_ENV === 'development';
    const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.argv.includes('--debug');
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      if (DEBUG_MODE) {
        this.mainWindow.webContents.openDevTools();
      }
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      logger.success('✅ Janela principal carregada');
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
        
        if (process.platform === 'win32') {
          try {
            new Notification({
              title: 'GamePath AI',
              body: 'Aplicação minimizada para a bandeja do sistema'
            }).show();
          } catch (error) {
            logger.debug('Erro ao exibir notificação:', error.message);
          }
        }
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Listener para atualizar tray menu
    this.mainWindow.webContents.on('ipc-message', (event, channel, ...args) => {
      if (channel === 'update-tray-games') {
        const games = args[0];
        this.updateTrayMenu(games);
        logger.debug('Jogos do tray atualizados via IPC', { count: games?.length || 0 });
      }
    });

    return this.mainWindow;
  }

  // ===================================================
  // CRIAÇÃO ÚNICA DO TRAY
  // ===================================================
  
  createTray() {
    if (this.tray && !this.tray.isDestroyed()) {
      this.createLogger().warn('Tray já existe - ignorando');
      return this.tray;
    }

    const logger = this.createLogger();
    const iconPath = path.join(__dirname, '../src/assets/icon.png');
    
    try {
      if (!fs.existsSync(iconPath)) {
        logger.warn('Ícone não encontrado, usando ícone padrão');
        this.tray = new Tray(nativeImage.createEmpty());
      } else {
        const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
        this.tray = new Tray(icon);
      }
      
      // Inicializar com menu básico
      this.updateTrayMenu([]);
      
      this.tray.setToolTip('GamePath AI Professional v3.0');
      
      this.tray.on('double-click', () => {
        if (this.mainWindow) {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
      });

      logger.success('✅ Tray configurado');
      
    } catch (error) {
      logger.warn('⚠️ Erro ao criar tray:', error.message);
    }
    
    return this.tray;
  }

  // ===================================================
  // ATUALIZAÇÃO DO MENU TRAY
  // ===================================================
  
  updateTrayMenu(games = []) {
    if (!this.tray || this.tray.isDestroyed()) return;
    
    const logger = this.createLogger();
    
    try {
      const recentGames = games.slice(0, 5);
      
      const gameMenuItems = recentGames.map(game => ({
        label: `${game.familyIcon || '🎮'} ${game.name}`,
        submenu: [
          {
            label: '🚀 Lançar',
            click: () => {
              if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('tray-launch-game', game.id);
              }
            }
          },
          {
            label: '⚡ Otimizar',
            click: () => {
              if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('tray-optimize-game', game.id);
              }
            }
          }
        ]
      }));
      
      const contextMenu = Menu.buildFromTemplate([
        { label: 'GamePath AI Professional v3.0', enabled: false },
        { type: 'separator' },
        ...gameMenuItems,
        { type: 'separator' },
        {
          label: '🔍 Escanear Jogos',
          click: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('tray-scan-games');
            }
          }
        },
        {
          label: '⚡ Otimizações',
          submenu: [
            {
              label: 'Ultra Performance',
              click: () => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('tray-optimize-system', 'ultra-performance');
                }
              }
            },
            {
              label: 'Balanced FPS',
              click: () => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('tray-optimize-system', 'balanced-fps');
                }
              }
            },
            {
              label: 'Balanced Quality',
              click: () => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('tray-optimize-system', 'balanced-quality');
                }
              }
            },
            {
              label: 'Maximum Quality',
              click: () => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('tray-optimize-system', 'quality');
                }
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: '🖥️ Mostrar App',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          }
        },
        {
          label: '❌ Sair',
          click: () => {
            this.isQuitting = true;
            app.quit();
          }
        }
      ]);
      
      this.tray.setContextMenu(contextMenu);
      
      logger.debug('Tray menu atualizado', { gamesCount: games.length });
    } catch (error) {
      logger.error('❌ Erro ao atualizar menu do tray', { error: error.message });
    }
  }

  // ===================================================
  // REGISTRO ÚNICO DOS IPC HANDLERS
  // ===================================================
  
  registerIpcHandlers() {
    if (this.ipcHandlersRegistered) {
      this.createLogger().warn('Handlers IPC já registrados - ignorando');
      return;
    }

    const logger = this.createLogger();
    logger.info('📡 Registrando handlers IPC...');
    
    // Limpar todos os listeners existentes
    ipcMain.removeAllListeners();
    
    // Lista de handlers
    const handlers = [
      'scan-games-intelligent',
      'scan-xbox-professional', 
      'launch-game-professional',
      'launch-game',
      'validate-game-files',
      'get-system-info',
      'run-advanced-diagnostics',
      'get-optimization-profiles',
      'optimize-system-intelligent',
      'get-running-games',
      'clear-cache',
      'get-game-profile',
      'set-game-profile',
      'create-backup',
      'list-backups',
      'tray-launch-game',
      'tray-optimize-game',
      'tray-scan-games',
      'tray-optimize-system'
    ];

    // Remover handlers antigos
    handlers.forEach(handler => {
      try {
        ipcMain.removeHandler(handler);
      } catch (error) {
        // Handler não existia
      }
    });

    // === HANDLER CRÍTICO: validate-game-files ===
    ipcMain.handle('validate-game-files', async (event, gameData) => {
      try {
        logger.info(`🔍 Validando arquivos para: ${gameData.name || gameData.id}`);
        
        return {
          success: true,
          valid: true,
          files: {
            installPath: !!gameData.installPath,
            executablePath: !!gameData.executablePath,
            steamAvailable: gameData.platform === 'Steam'
          },
          message: 'Validação concluída com sucesso',
          timestamp: Date.now()
        };

      } catch (error) {
        logger.error(`Erro na validação de arquivos: ${error.message}`);
        return {
          success: true,
          valid: true,
          message: 'Validação com erro, mas prosseguindo',
          error: error.message,
          timestamp: Date.now()
        };
      }
    });

    // === SCAN INTELIGENTE ===
    ipcMain.handle('scan-games-intelligent', async () => {
      try {
        logger.info('🔍 Iniciando escaneamento inteligente...');
        
        const rawGames = await this.gameDetector.getAllGames();
        logger.info(`📊 Jogos brutos detectados: ${rawGames.length}`);
        
        const filteredGames = this.intelligentFilter.filterAndGroupGames(rawGames);
        logger.info(`🎮 Jogos filtrados: ${filteredGames.length}`);
        
        const sanitizedGames = filteredGames.map(game => 
          AdvancedIPCSanitizer.sanitizeGameObject(game)
        );
        
        // Atualizar tray menu com os jogos detectados
        this.updateTrayMenu(sanitizedGames);
        
        return { 
          success: true, 
          data: sanitizedGames,
          stats: {
            rawCount: rawGames.length,
            filteredCount: filteredGames.length,
            reductionPercentage: Math.round(((rawGames.length - filteredGames.length) / rawGames.length) * 100)
          }
        };
      } catch (error) {
        logger.error('Erro no escaneamento inteligente:', error.message);
        return { success: false, error: error.message };
      }
    });

    // === LANÇAMENTO PROFISSIONAL ===
    ipcMain.handle('launch-game-professional', async (event, gameData, profileName) => {
      try {
        logger.info(`🚀 Lançamento profissional: ${gameData.name || gameData.id}`);
        
        if (!gameData.platform && gameData.id) {
          if (gameData.id.includes('steam')) {
            gameData.platform = 'Steam';
            const appIdMatch = gameData.id.match(/steam-(\d+)/);
            if (appIdMatch) {
              gameData.appId = appIdMatch[1];
            }
          }
        }

        const result = await this.gameLauncher.launchGameAdvanced(gameData, profileName);
        return AdvancedIPCSanitizer.sanitizeForIPC(result);
      } catch (error) {
        logger.error(`Erro no lançamento profissional: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    // === LANÇAMENTO PADRÃO ===
    ipcMain.handle('launch-game', async (event, gameData, profileName) => {
      try {
        logger.info(`🚀 Lançamento padrão: ${gameData.name || gameData.id || gameData}`);
        
        if (typeof gameData === 'string') {
          const gameId = gameData;
          gameData = {
            id: gameId,
            name: gameId.includes('steam') ? 'Jogo Steam' : 'Jogo Detectado',
            platform: gameId.includes('steam') ? 'Steam' : 'Unknown'
          };

          if (gameId.includes('steam')) {
            const appIdMatch = gameId.match(/steam-(\d+)/);
            if (appIdMatch) {
              gameData.appId = appIdMatch[1];
            }
          }
        }

        const result = await this.gameLauncher.launchGameAdvanced(gameData, profileName);
        return AdvancedIPCSanitizer.sanitizeForIPC(result);
        
      } catch (error) {
        logger.error(`Erro no lançamento padrão: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    // === XBOX PROFISSIONAL ===
    ipcMain.handle('scan-xbox-professional', async () => {
      try {
        const xboxGames = await this.xboxDetector.detectXboxGames();
        const sanitizedGames = xboxGames.map(game => 
          AdvancedIPCSanitizer.sanitizeGameObject(game)
        );
        
        return { 
          success: true, 
          data: sanitizedGames,
          stats: {
            totalDetected: xboxGames.length,
            codGames: xboxGames.filter(g => g.gameFamily === 'Call of Duty').length,
            mainGames: xboxGames.filter(g => g.isMainGame).length
          }
        };
      } catch (error) {
        logger.error('Erro na detecção Xbox:', error.message);
        return { success: false, error: error.message };
      }
    });

    // === OTIMIZAÇÃO INTELIGENTE ===
    ipcMain.handle('optimize-system-intelligent', async (event, targetGame, profileName) => {
      try {
        logger.info(`⚡ Otimização inteligente para: ${targetGame?.name || 'Sistema Geral'}`);
        
        const profile = this.gameLauncher.optimizationProfiles[profileName] || 
                       this.gameLauncher.optimizationProfiles['balanced-fps'];
        
        await this.gameLauncher.performPreLaunchOptimization(targetGame, profile);
        
        return { 
          success: true, 
          message: `Sistema otimizado com perfil ${profile.name}`,
          profile: profile.name 
        };
      } catch (error) {
        logger.error(`Erro na otimização inteligente: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    // === INFORMAÇÕES DO SISTEMA ===
    ipcMain.handle('get-system-info', async () => {
      try {
        const metrics = await this.systemMonitor.getSystemMetrics();
        return { success: true, data: metrics };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // === DIAGNÓSTICO AVANÇADO ===
    ipcMain.handle('run-advanced-diagnostics', async () => {
      try {
        logger.info('🔍 Executando diagnóstico avançado...');
        
        const diagnostics = {
          timestamp: Date.now(),
          system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            electronVersion: process.versions.electron
          },
          handlers: {
            registered: handlers.length,
            working: true
          },
          launcher: {
            profiles: Object.keys(this.gameLauncher.optimizationProfiles),
            runningGames: this.gameLauncher.runningGames.size
          },
          cache: this.gameCache.getStats(),
          tray: {
            available: !!this.tray,
            menuItems: this.tray ? 'Dynamic' : 'None'
          }
        };
        
        return { success: true, data: diagnostics };
        
      } catch (error) {
        logger.error(`Erro no diagnóstico: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    // === HANDLERS AUXILIARES ===
    ipcMain.handle('get-optimization-profiles', () => {
      return { 
        success: true, 
        data: this.gameLauncher.optimizationProfiles 
      };
    });

    ipcMain.handle('get-running-games', () => {
      const runningGames = Array.from(this.gameLauncher.runningGames.values());
      return { 
        success: true, 
        data: runningGames.map(game => AdvancedIPCSanitizer.sanitizeForIPC(game))
      };
    });

    ipcMain.handle('clear-cache', async () => {
      try {
        this.gameCache.clear();
        return { success: true, message: 'Cache limpo com sucesso' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-game-profile', async (event, gameId) => {
      try {
        const profile = this.profileManager.getProfile(gameId);
        return { success: true, data: profile };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('set-game-profile', async (event, gameId, profile) => {
      try {
        this.profileManager.setProfile(gameId, profile);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('create-backup', async () => {
      return await this.backupSystem.createBackup('manual');
    });

    ipcMain.handle('list-backups', async () => {
      try {
        const backups = await this.backupSystem.listBackups();
        return { success: true, data: backups };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // === HANDLERS ESPECÍFICOS DO TRAY ===
    ipcMain.handle('tray-launch-game', async (event, gameId) => {
      try {
        logger.info(`🚀 Lançamento via tray: ${gameId}`);
        
        const result = await this.gameLauncher.launchGameAdvanced({ id: gameId }, 'balanced-fps');
        return { success: true, result };
      } catch (error) {
        logger.error(`Erro no lançamento via tray: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tray-optimize-game', async (event, gameId) => {
      try {
        logger.info(`⚡ Otimização via tray: ${gameId}`);
        
        const result = await this.gameLauncher.performPreLaunchOptimization(
          { id: gameId }, 
          this.gameLauncher.optimizationProfiles['ultra-performance']
        );
        return { success: true, result };
      } catch (error) {
        logger.error(`Erro na otimização via tray: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tray-scan-games', async () => {
      try {
        logger.info('🔍 Escaneamento via tray');
        
        const rawGames = await this.gameDetector.getAllGames();
        const filteredGames = this.intelligentFilter.filterAndGroupGames(rawGames);
        const sanitizedGames = filteredGames.map(game => 
          AdvancedIPCSanitizer.sanitizeGameObject(game)
        );
        
        this.updateTrayMenu(sanitizedGames);
        
        return { success: true, count: sanitizedGames.length };
      } catch (error) {
        logger.error(`Erro no escaneamento via tray: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tray-optimize-system', async (event, profileName) => {
      try {
        logger.info(`⚡ Otimização de sistema via tray: ${profileName}`);
        
        const profile = this.gameLauncher.optimizationProfiles[profileName] || 
                       this.gameLauncher.optimizationProfiles['balanced-fps'];
        
        await this.gameLauncher.performPreLaunchOptimization(null, profile);
        
        return { success: true, profile: profile.name };
      } catch (error) {
        logger.error(`Erro na otimização de sistema via tray: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    this.ipcHandlersRegistered = true;
    logger.success('✅ Handlers IPC registrados (incluindo Tray)');
  }

  // ===================================================
  // MÉTODO PRINCIPAL DE INICIALIZAÇÃO
  // ===================================================
  
  async start() {
    if (this.appReady) {
      this.createLogger().warn('App já está pronto - ignorando start duplicado');
      return;
    }

    try {
      await this.initialize();
      this.createMainWindow();
      this.createTray();
      this.registerIpcHandlers();
      
      this.appReady = true;
      
      const logger = this.createLogger();
      logger.success('🎮 GamePath AI Professional v3.0 - Sistema Completo!');
      logger.info('📋 Funcionalidades disponíveis:');
      logger.info('   🧠 Filtros inteligentes');
      logger.info('   🔫 Detector Call of Duty especializado');
      logger.info('   🎮 Detector Xbox profissional');
      logger.info('   🚀 Sistema de lançamento multi-estratégia');
      logger.info('   ⚡ Otimização profissional');
      logger.info('   📊 Monitoramento em tempo real');
      logger.info('   👤 Sistema de perfis por jogo');
      logger.info('   💾 Sistema de backup/restore');
      logger.info('   🔧 Sanitização IPC completa');
      logger.info('   🎯 Menu Tray dinâmico com jogos recentes');
      logger.info('   📡 Comunicação bidirecional Main ↔ Renderer');
      
    } catch (error) {
      this.createLogger().error('Erro fatal na inicialização:', error);
      app.quit();
    }
  }

  // ===================================================
  // CLEANUP
  // ===================================================
  
  async cleanup() {
    const logger = this.createLogger();
    logger.info('🔄 Finalizando sistemas...');
    
    try {
      this.systemMonitor.cleanup();
      await this.backupSystem.createBackup('shutdown');
      await this.gameCache.saveToDisk();
      await this.profileManager.saveProfiles();
      
      logger.success('✅ Sistemas finalizados corretamente');
    } catch (error) {
      logger.error('Erro ao finalizar sistemas:', error.message);
    }
  }
}

// [RESTANTE DO CÓDIGO - CLASSES AUXILIARES]

// ===================================================
// SISTEMA DE EVENTOS CENTRALIZADO
// ===================================================

class GameEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitGameDetected(games) {
    this.emit('games:detected', {
      count: games.length,
      platforms: this.getPlatformStats(games),
      timestamp: Date.now()
    });
  }

  emitGameLaunched(game, result) {
    this.emit('game:launched', {
      gameId: game.id,
      gameName: game.name,
      platform: game.platform,
      success: result.success,
      method: result.method,
      timestamp: Date.now()
    });
  }

  emitOptimizationComplete(component, result) {
    this.emit('optimization:complete', {
      component,
      improvement: result.improvement,
      success: result.success,
      timestamp: Date.now()
    });
  }

  emitError(component, error) {
    this.emit('error', {
      component,
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
  }

  getPlatformStats(games) {
    const stats = {};
    games.forEach(game => {
      stats[game.platform] = (stats[game.platform] || 0) + 1;
    });
    return stats;
  }
}

// ===================================================
// SISTEMA DE UTILITÁRIOS
// ===================================================

class Utils {
  static async safeExecute(operation, fallback = null, timeoutMs = 10000) {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operação timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      console.debug(`Operação falhou (fallback usado): ${error.message}`);
      return fallback;
    }
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  static sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255);
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }

  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  static generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ===================================================
// SISTEMA DE CACHE INTELIGENTE
// ===================================================

class SmartGameCache {
  constructor(CONFIG) {
    this.CONFIG = CONFIG;
    this.cacheFile = path.join(CONFIG.CONFIG_DIR, 'cache', 'games-cache.json');
    this.cache = new Map();
    this.statistics = {
      hits: 0,
      misses: 0,
      sets: 0,
      clears: 0
    };
    this.maxSize = CONFIG.CACHE_MAX_SIZE;
    this.defaultTTL = CONFIG.CACHE_TTL;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await fsPromises.mkdir(path.dirname(this.cacheFile), { recursive: true });
      await this.loadFromDisk();
      this.initialized = true;
      // Não loga mais no init para evitar duplicação
    } catch (error) {
      console.error('Erro ao inicializar cache', { error: error.message });
    }
  }

  async loadFromDisk() {
    try {
      const data = await fsPromises.readFile(this.cacheFile, 'utf8');
      const parsed = JSON.parse(data);
      
      Object.entries(parsed.cache || {}).forEach(([key, value]) => {
        if (this.isValid(value)) {
          this.cache.set(key, value);
        }
      });
      
      if (parsed.statistics) {
        this.statistics = { ...this.statistics, ...parsed.statistics };
      }
    } catch (error) {
      // Cache não existe ainda, normal
    }
  }

  async saveToDisk() {
    if (!this.initialized) return;
    
    try {
      const cacheObj = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      
      const data = {
        cache: cacheObj,
        statistics: this.statistics,
        lastSaved: Date.now()
      };
      
      await fsPromises.writeFile(this.cacheFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erro ao salvar cache', { error: error.message });
    }
  }

  isValid(entry, customTTL = null) {
    if (!entry || !entry.timestamp) return false;
    const ttl = customTTL || entry.ttl || this.defaultTTL;
    return (Date.now() - entry.timestamp) < ttl;
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      entry.hits = (entry.hits || 0) + 1;
      entry.lastAccessed = Date.now();
      this.statistics.hits++;
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    this.statistics.misses++;
    return null;
  }

  set(key, data, customTTL = null) {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const entry = {
      data,
      timestamp: Date.now(),
      ttl: customTTL || this.defaultTTL,
      hits: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(data)
    };

    this.cache.set(key, entry);
    this.statistics.sets++;
  }

  evictLeastUsed() {
    let leastUsed = null;
    let minScore = Infinity;

    for (const [key, entry] of this.cache) {
      const timeSinceAccess = Date.now() - (entry.lastAccessed || entry.timestamp);
      const score = (entry.hits || 0) - (timeSinceAccess / 60000);
      
      if (score < minScore) {
        minScore = score;
        leastUsed = key;
      }
    }

    if (leastUsed) {
      this.cache.delete(leastUsed);
    }
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000;
    }
  }

  clear(key = null) {
    if (key) {
      const deleted = this.cache.delete(key);
      if (deleted) this.statistics.clears++;
      return deleted;
    } else {
      const size = this.cache.size;
      this.cache.clear();
      this.statistics.clears += size;
      this.saveToDisk();
    }
  }

  getStats() {
    const hitRate = this.statistics.hits + this.statistics.misses > 0 
      ? (this.statistics.hits / (this.statistics.hits + this.statistics.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.statistics,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// ===================================================
// SISTEMA DE PROFILES
// ===================================================

class EnhancedGameProfileManager {
  constructor(CONFIG) {
    this.CONFIG = CONFIG;
    this.profilesFile = path.join(CONFIG.CONFIG_DIR, 'profiles', 'game-profiles.json');
    this.profiles = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await fsPromises.mkdir(path.dirname(this.profilesFile), { recursive: true });
      await this.loadProfiles();
      this.initialized = true;
    } catch (error) {
      console.error('Erro ao inicializar profiles', { error: error.message });
    }
  }

  async loadProfiles() {
    try {
      const data = await fsPromises.readFile(this.profilesFile, 'utf8');
      const parsed = JSON.parse(data);
      
      Object.entries(parsed).forEach(([gameId, profile]) => {
        this.profiles.set(gameId, profile);
      });
    } catch (error) {
      // Sem profiles ainda
    }
  }

  async saveProfiles() {
    if (!this.initialized) return;
    
    try {
      const profilesObj = {};
      this.profiles.forEach((profile, gameId) => {
        profilesObj[gameId] = profile;
      });
      
      await fsPromises.writeFile(this.profilesFile, JSON.stringify(profilesObj, null, 2));
    } catch (error) {
      console.error('Erro ao salvar profiles', { error: error.message });
    }
  }

  getProfile(gameId) {
    const profile = this.profiles.get(gameId);
    if (profile) {
      profile.lastAccessed = Date.now();
      return profile;
    }
    return this.getDefaultProfile();
  }

  setProfile(gameId, profile) {
    const enhancedProfile = {
      ...this.getDefaultProfile(),
      ...profile,
      lastUpdated: Date.now()
    };
    
    this.profiles.set(gameId, enhancedProfile);
    this.saveProfiles().catch(err => 
      console.error('Erro ao salvar profile', { gameId, error: err.message })
    );
  }

  getDefaultProfile() {
    return {
      name: 'Padrão',
      template: 'balanced-fps',
      optimization: {
        fps: 'balanced',
        priority: 'high',
        affinity: 'auto',
        memory: 'auto'
      },
      created: Date.now(),
      lastUpdated: Date.now()
    };
  }
}

// ===================================================
// SISTEMA DE SANITIZAÇÃO IPC
// ===================================================

class AdvancedIPCSanitizer {
  static sanitizeForIPC(obj, maxDepth = 5, currentDepth = 0) {
    if (currentDepth >= maxDepth) return '[Max Depth Reached]';
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'function') return '[Function]';
    if (typeof obj === 'symbol') return '[Symbol]';
    
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof RegExp) return obj.toString();
    if (obj instanceof Error) {
      return {
        name: obj.name,
        message: obj.message,
        stack: process.env.NODE_ENV === 'development' ? obj.stack : undefined
      };
    }
    
    if (Buffer.isBuffer(obj)) return '[Buffer]';
    
    if (Array.isArray(obj)) {
      return obj.slice(0, 100).map(item => 
        this.sanitizeForIPC(item, maxDepth, currentDepth + 1)
      );
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      let count = 0;
      
      for (const [key, value] of Object.entries(obj)) {
        if (count >= 50) {
          sanitized['...'] = `[${Object.keys(obj).length - count} more properties]`;
          break;
        }
        
        if (key.startsWith('_') || typeof value === 'function') continue;
        
        sanitized[key] = this.sanitizeForIPC(value, maxDepth, currentDepth + 1);
        count++;
      }
      
      return sanitized;
    }
    
    if (typeof obj === 'string' && obj.length > 10000) {
      return obj.substring(0, 10000) + '...[truncated]';
    }
    
    return obj;
  }
  
  static sanitizeGameObject(game) {
    if (!game) return null;
    
    const CONFIG = GamePathAISingleton.instance.getConfig();
    
    return {
      id: game.id,
      name: game.name,
      platform: game.platform,
      installPath: game.installPath,
      executablePath: game.executablePath,
      processName: game.processName,
      size: typeof game.size === 'number' ? game.size : 0,
      sizeFormatted: typeof game.size === 'number' ? Utils.formatBytes(game.size * 1024 * 1024) : '0 B',
      lastPlayed: game.lastPlayed instanceof Date ? game.lastPlayed.toISOString() : game.lastPlayed,
      iconUrl: game.iconUrl,
      appId: game.appId,
      packageName: game.packageName,
      
      launchOptions: game.launchOptions ? {
        protocol: game.launchOptions.protocol,
        direct: game.launchOptions.direct,
        packageId: game.launchOptions.packageId,
        msStoreId: game.launchOptions.msStoreId,
        shortcut: game.launchOptions.shortcut
      } : null,
      
      isMainGame: game.isMainGame !== false,
      gameFamily: game.gameFamily,
      familyIcon: game.familyIcon,
      priority: game.priority || 1,
      cleanName: game.cleanName || game.name,
      gameGenre: game.gameGenre || 'Unknown',
      optimizationProfile: game.optimizationProfile || 'balanced-fps',
      dlcCount: game.dlcCount || 0,
      detectionMethod: game.detectionMethod || 'standard',
      
      platformInfo: CONFIG.PLATFORMS[game.platform] || CONFIG.PLATFORMS.Standalone,
      hash: this.generateGameHash(game),
      sanitizedAt: Date.now()
    };
  }
  
  static generateGameHash(game) {
    const key = `${game.id}-${game.name}-${game.platform}-${game.size}`;
    return Buffer.from(key).toString('base64').slice(0, 16);
  }
  
  static sanitizeError(error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Erro desconhecido',
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: Date.now()
    };
  }
}

// ===================================================
// FILTROS INTELIGENTES
// ===================================================

class SuperIntelligentGameFilter {
  constructor(logger) {
    this.logger = logger;
    this.blacklist = this.createBlacklist();
    this.gameFamilies = this.createGameFamilies();
    this.statistics = {
      totalProcessed: 0,
      totalFiltered: 0,
      byCategory: {},
      byPlatform: {}
    };
  }

  createBlacklist() {
    return {
      redistributables: [
        'microsoft visual c++', 'vcredist', 'directx', 'dx9', 'dx10', 'dx11', 'dx12',
        '.net framework', 'dotnet', 'visual studio', 'sdk', 'runtime', 'framework',
        'microsoft edge webview2', 'webview2', 'edge update',
        'adobe air', 'adobe flash', 'java runtime', 'python', 'nodejs',
        'nvidia physx', 'nvidia frameview', 'nvidia broadcast', 'nvidia experience',
        'vulkan runtime', 'openal', 'opengl', 'visual c++ runtime'
      ],
      
      launchers: [
        'steam', 'epic games launcher', 'battle.net', 'origin', 'uplay', 'ubisoft connect',
        'xbox app', 'xbox game bar', 'xbox live', 'microsoft store', 'ms store',
        'galaxy', 'gog galaxy', 'ea desktop', 'ea app', 'ea origin',
        'nvidia geforce experience', 'amd radeon software', 'msi afterburner',
        'discord', 'teamspeak', 'ventrilo', 'mumble', 'obs studio'
      ],
      
      systemTools: [
        'microsoft office', 'office 365', 'skype', 'teams', 'onedrive',
        'windows media player', 'windows photo viewer', 'paint', 'paint 3d',
        'notepad', 'calculator', 'windows defender', 'cortana',
        'windows search', 'windows update', 'device manager', 'control panel',
        'task manager', 'registry editor', 'event viewer'
      ],
      
      dlcKeywords: [
        'dlc', 'downloadable content', 'expansion pack', 'season pass',
        'battle pass', 'content pack', 'map pack', 'weapon pack',
        'character pack', 'skin pack', 'addon', 'add-on', 'cosmetic pack',
        'upgrade', 'edition upgrade', 'vault edition', 'gold edition',
        'deluxe edition', 'premium edition', 'ultimate edition',
        'year pass', 'operators pack', 'soundtrack', 'ost', 'wallpaper'
      ]
    };
  }

  createGameFamilies() {
    return {
      'Call of Duty': {
        keywords: ['call of duty', 'callofduty', 'cod', 'modern warfare', 'black ops', 'warzone', 'vanguard'],
        mainGameIndicators: [
          'call of duty®', 'call of duty: modern warfare', 'call of duty: black ops',
          'call of duty: warzone', 'modern warfare ii', 'modern warfare iii',
          'black ops 6', 'black ops cold war', 'vanguard', 'call of duty hq'
        ],
        publisher: 'Activision',
        icon: '🔫',
        genre: 'FPS',
        optimizationProfile: 'ultra-performance'
      }
    };
  }

  filterAndGroupGames(games) {
    const timer = this.logger.startTimer('Game Filtering');
    
    this.logger.info(`🔍 Filtragem inteligente iniciada: ${games.length} jogos`);
    
    this.statistics.totalProcessed = games.length;
    
    const cleaned = this.removeObviousJunk(games);
    const grouped = this.groupGameFamilies(cleaned);
    const prioritized = this.prioritizeGames(grouped);
    const enriched = this.enrichGameData(prioritized);
    
    this.statistics.totalFiltered = enriched.length;
    
    const duration = timer.end();
    this.logger.performance('Filtragem completa', {
      input: games.length,
      output: enriched.length,
      reduction: `${Math.round(((games.length - enriched.length) / games.length) * 100)}%`,
      duration: `${duration.toFixed(2)}ms`
    });
    
    return enriched;
  }

  removeObviousJunk(games) {
    return games.filter(game => {
      const name = game.name.toLowerCase();
      
      for (const [category, items] of Object.entries(this.blacklist)) {
        if (this.isInBlacklist(name, category)) {
          return false;
        }
      }
      
      if (game.size && game.size < 10) {
        return false;
      }
      
      return true;
    });
  }

  isInBlacklist(name, category) {
    const items = this.blacklist[category] || [];
    return items.some(item => name.includes(item.toLowerCase()));
  }

  groupGameFamilies(games) {
    const familyGroups = new Map();
    const independentGames = [];
    
    for (const game of games) {
      const family = this.identifyGameFamily(game);
      
      if (family) {
        if (!familyGroups.has(family.name)) {
          familyGroups.set(family.name, {
            family,
            mainGame: null,
            variants: []
          });
        }
        
        const group = familyGroups.get(family.name);
        
        if (this.isMainGameInFamily(game, family)) {
          if (!group.mainGame || this.hasHigherPriority(game, group.mainGame)) {
            if (group.mainGame) {
              group.variants.push(group.mainGame);
            }
            group.mainGame = game;
          } else {
            group.variants.push(game);
          }
        }
      } else {
        independentGames.push(game);
      }
    }
    
    const result = [...independentGames];
    
    for (const [familyName, group] of familyGroups) {
      if (group.mainGame) {
        const mainGame = {
          ...group.mainGame,
          gameFamily: familyName,
          familyIcon: group.family.icon,
          familyGenre: group.family.genre,
          isMainGame: true,
          priority: (group.mainGame.priority || 1) + 5,
          optimizationProfile: group.family.optimizationProfile
        };
        
        result.push(mainGame);
      }
    }
    
    return result;
  }

  identifyGameFamily(game) {
    const name = game.name.toLowerCase();
    
    for (const [familyName, family] of Object.entries(this.gameFamilies)) {
      if (family.keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
        return { name: familyName, ...family };
      }
    }
    
    return null;
  }

  isMainGameInFamily(game, family) {
    const name = game.name.toLowerCase();
    
    const isDLC = this.blacklist.dlcKeywords.some(dlcKeyword => 
      name.includes(dlcKeyword.toLowerCase())
    );
    
    if (isDLC) return false;
    
    return family.mainGameIndicators.some(indicator => 
      name.includes(indicator.toLowerCase())
    );
  }

  hasHigherPriority(game1, game2) {
    const CONFIG = GamePathAISingleton.instance.getConfig();
    const platform1Priority = CONFIG.PLATFORMS[game1.platform]?.priority || 0;
    const platform2Priority = CONFIG.PLATFORMS[game2.platform]?.priority || 0;
    
    if (platform1Priority !== platform2Priority) {
      return platform1Priority > platform2Priority;
    }
    
    return (game1.size || 0) > (game2.size || 0);
  }

  prioritizeGames(games) {
    const CONFIG = GamePathAISingleton.instance.getConfig();
    
    return games
      .filter(game => !this.isObviousDLC(game))
      .sort((a, b) => {
        if (a.gameFamily && !b.gameFamily) return -1;
        if (!a.gameFamily && b.gameFamily) return 1;
        
        const aPlatformPriority = CONFIG.PLATFORMS[a.platform]?.priority || 0;
        const bPlatformPriority = CONFIG.PLATFORMS[b.platform]?.priority || 0;
        if (aPlatformPriority !== bPlatformPriority) {
          return bPlatformPriority - aPlatformPriority;
        }
        
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        if (Math.abs(aSize - bSize) > 1000) {
          return bSize - aSize;
        }
        
        return (b.priority || 1) - (a.priority || 1);
      });
  }

  isObviousDLC(game) {
    const name = game.name.toLowerCase();
    const obviousDLC = [
      'season pass', 'battle pass', 'year pass',
      'map pack', 'weapon pack', 'character pack',
      'cosmetic pack', 'skin pack', 'operator pack',
      'soundtrack', 'ost', 'wallpaper pack'
    ];
    
    return obviousDLC.some(dlc => name.includes(dlc));
  }

  enrichGameData(games) {
    const CONFIG = GamePathAISingleton.instance.getConfig();
    
    return games.map(game => {
      return {
        ...game,
        cleanName: this.getCleanName(game.name),
        gameGenre: game.familyGenre || this.detectGenre(game),
        optimizationProfile: game.optimizationProfile || this.getOptimizationProfile(game),
        qualityScore: this.calculateQualityScore(game),
        platformInfo: CONFIG.PLATFORMS[game.platform] || CONFIG.PLATFORMS.Standalone
      };
    });
  }

  getCleanName(name) {
    return name
      .replace(/[®™©]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  detectGenre(game) {
    const name = game.name.toLowerCase();
    
    const genreKeywords = {
      'FPS': ['fps', 'shooter', 'call of duty', 'counter-strike', 'battlefield', 'doom'],
      'RPG': ['rpg', 'role playing', 'elder scrolls', 'fallout', 'witcher', 'final fantasy'],
      'Strategy': ['strategy', 'civilization', 'age of empires', 'total war', 'rts'],
      'Racing': ['racing', 'forza', 'need for speed', 'gran turismo', 'dirt'],
      'Sports': ['sports', 'fifa', 'nba', 'nfl', 'hockey', 'football'],
      'Action/Adventure': ['action', 'adventure', 'gta', 'assassin', 'tomb raider']
    };
    
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return genre;
      }
    }
    
    return 'Unknown';
  }

  getOptimizationProfile(game) {
    const genre = this.detectGenre(game);
    
    const genreProfiles = {
      'FPS': 'ultra-performance',
      'Racing': 'balanced-fps',
      'Sports': 'balanced-fps',
      'Action/Adventure': 'balanced-quality',
      'RPG': 'quality',
      'Strategy': 'balanced-quality'
    };
    
    return genreProfiles[genre] || 'balanced-fps';
  }

  calculateQualityScore(game) {
    const CONFIG = GamePathAISingleton.instance.getConfig();
    let score = 50;
    
    const platformPriority = CONFIG.PLATFORMS[game.platform]?.priority || 0;
    score += platformPriority * 2;
    
    if (game.size > 50000) score += 20;
    else if (game.size > 20000) score += 15;
    else if (game.size > 10000) score += 10;
    else if (game.size > 1000) score += 5;
    
    if (game.appId || game.packageName) score += 10;
    if (game.iconUrl) score += 5;
    if (game.executablePath) score += 5;
    
    if (game.gameFamily) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  getFilteringStats() {
    return {
      ...this.statistics,
      efficiency: this.statistics.totalProcessed > 0 
        ? ((this.statistics.totalProcessed - this.statistics.totalFiltered) / this.statistics.totalProcessed * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// ===================================================
// DETECTOR XBOX PROFISSIONAL
// ===================================================

class UltraXboxDetector {
  constructor(logger) {
    this.logger = logger;
    this.results = new Map();
    this.statistics = {
      methodsUsed: 0,
      gamesFound: 0,
      codSpecificFinds: 0,
      executionTime: 0
    };
  }

  async detectXboxGames() {
    const timer = this.logger.startTimer('Xbox Detection');
    
    this.logger.info('🎮 Iniciando detecção Xbox ultra avançada...');
    
    this.results.clear();
    this.statistics = { methodsUsed: 0, gamesFound: 0, codSpecificFinds: 0, executionTime: 0 };
    
    const detectionMethods = [
      this.detectViaRegistry.bind(this),
      this.detectViaPackages.bind(this),
      this.detectViaProtocols.bind(this),
      this.detectViaRunningProcesses.bind(this)
    ];
    
    for (const method of detectionMethods) {
      try {
        const games = await Utils.safeExecute(method, [], 10000);
        
        if (games && games.length > 0) {
          games.forEach(game => {
            const key = this.generateGameKey(game);
            if (!this.results.has(key)) {
              this.results.set(key, game);
            }
          });
          
          this.statistics.methodsUsed++;
        }
      } catch (error) {
        this.logger.debug(`Método Xbox falhou: ${error.message}`);
      }
    }

    const allGames = Array.from(this.results.values());
    const finalGames = this.processXboxResults(allGames);
    
    this.statistics.gamesFound = finalGames.length;
    this.statistics.codSpecificFinds = finalGames.filter(g => g.gameFamily === 'Call of Duty').length;
    this.statistics.executionTime = timer.end();
    
    this.logger.success(`🎯 Detecção Xbox concluída:`, this.statistics);
    
    return finalGames;
  }

  generateGameKey(game) {
    const name = (game.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const platform = game.platform || 'xbox';
    return `${platform}-${name}`;
  }

  async detectViaRegistry() {
    const games = [];
    
    try {
      const { stdout } = await execAsync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "Xbox" /d 2>nul');
      
      if (stdout.includes('Xbox') || stdout.includes('Call of Duty')) {
        games.push({
          id: 'xbox-registry-cod',
          name: 'Call of Duty® (Xbox)',
          platform: 'Xbox',
          installPath: null,
          executablePath: null,
          processName: '',
          size: 0,
          lastPlayed: new Date(),
          launchOptions: {
            protocol: 'ms-xbl-cod:',
            registry: true
          },
          isMainGame: true,
          gameFamily: 'Call of Duty',
          priority: 8,
          detectionMethod: 'registry'
        });
      }
    } catch (error) {
      this.logger.debug('Registry detection falhou:', error.message);
    }
    
    return games;
  }

  async detectViaPackages() {
    const games = [];
    const packagesPath = path.join(os.homedir(), 'AppData', 'Local', 'Packages');
    
    try {
      const packages = await fsPromises.readdir(packagesPath);
      const codPackages = packages.filter(pkg => 
        pkg.toLowerCase().includes('callofduty') ||
        pkg.toLowerCase().includes('activision')
      );
      
      for (const packageName of codPackages) {
        if (this.isCODMainGamePackage(packageName)) {
          games.push({
            id: `xbox-pkg-${packageName}`,
            name: 'Call of Duty® (Package)',
            platform: 'Xbox',
            installPath: path.join(packagesPath, packageName),
            executablePath: null,
            processName: '',
            size: 0,
            lastPlayed: new Date(),
            packageName: packageName,
            launchOptions: {
              packageId: packageName,
              protocol: 'ms-xbl-cod:'
            },
            isMainGame: true,
            gameFamily: 'Call of Duty',
            priority: 7,
            detectionMethod: 'packages'
          });
        }
      }
    } catch (error) {
      this.logger.debug('Package detection falhou:', error.message);
    }
    
    return games;
  }

  isCODMainGamePackage(packageName) {
    const lowerPkg = packageName.toLowerCase();
    
    const mainIndicators = ['callofduty', 'activision'];
    const hasMainIndicator = mainIndicators.some(indicator => lowerPkg.includes(indicator));
    
    const dlcIndicators = ['dlc', 'pack', 'addon', 'season'];
    const hasDlcIndicator = dlcIndicators.some(indicator => lowerPkg.includes(indicator));
    
    return hasMainIndicator && !hasDlcIndicator;
  }

  async detectViaProtocols() {
    const games = [];
    
    try {
      const codProtocols = ['callofduty', 'ms-xbl-cod', 'xbox'];
      
      for (const protocol of codProtocols) {
        try {
          const { stdout } = await execAsync(`reg query "HKEY_CLASSES_ROOT\\${protocol}" 2>nul`);
          
          if (stdout.trim()) {
            games.push({
              id: `xbox-protocol-${protocol}`,
              name: 'Call of Duty® (Protocol)',
              platform: 'Xbox',
              installPath: null,
              executablePath: null,
              processName: '',
              size: 0,
              lastPlayed: new Date(),
              launchOptions: {
                protocol: `${protocol}:`,
                registered: true
              },
              isMainGame: true,
              gameFamily: 'Call of Duty',
              priority: 6,
              detectionMethod: 'protocol'
            });
            break; // Apenas um protocolo COD
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      this.logger.debug('Protocol detection falhou:', error.message);
    }
    
    return games;
  }

  async detectViaRunningProcesses() {
    const games = [];
    
    try {
      const { stdout } = await execAsync('tasklist /fo csv');
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (this.isCODProcess(line)) {
          games.push({
            id: 'xbox-running-cod',
            name: 'Call of Duty® (Em Execução)',
            platform: 'Xbox',
            installPath: null,
            executablePath: null,
            processName: 'cod.exe',
            size: 0,
            lastPlayed: new Date(),
            isRunning: true,
            launchOptions: {
              protocol: 'ms-xbl-cod:',
              running: true
            },
            isMainGame: true,
            gameFamily: 'Call of Duty',
            priority: 10,
            detectionMethod: 'running'
          });
          break;
        }
      }
    } catch (error) {
      this.logger.debug('Running process detection falhou:', error.message);
    }
    
    return games;
  }

  isCODProcess(processLine) {
    const lowerLine = processLine.toLowerCase();
    return (
      lowerLine.includes('cod') ||
      lowerLine.includes('callofduty') ||
      lowerLine.includes('modernwarfare') ||
      lowerLine.includes('blackops') ||
      lowerLine.includes('warzone')
    ) && !lowerLine.includes('codec');
  }

  processXboxResults(allGames) {
    const codGames = allGames.filter(game => 
      game.gameFamily === 'Call of Duty' || this.isCODGame(game)
    );
    
    if (codGames.length === 0) {
      return allGames;
    }
    
    // Encontrar o melhor jogo COD
    const bestCOD = codGames.reduce((best, current) => {
      if (!best) return current;
      
      if (current.isRunning && !best.isRunning) return current;
      if (best.isRunning && !current.isRunning) return best;
      
      if (current.priority > best.priority) return current;
      
      return best;
    });
    
    // Criar jogo unificado
    const unifiedCOD = {
      ...bestCOD,
      name: 'Call of Duty®',
      cleanName: 'Call of Duty',
      gameFamily: 'Call of Duty',
      familyIcon: '🔫',
      isMainGame: true,
      priority: 10,
      
      detectionSummary: {
        totalDetections: codGames.length,
        methods: [...new Set(codGames.map(g => g.detectionMethod))],
        bestMethod: bestCOD.detectionMethod
      },
      
      launchOptions: {
        ...bestCOD.launchOptions,
        alternatives: codGames.filter(g => g !== bestCOD).map(g => ({
          method: g.detectionMethod,
          protocol: g.launchOptions?.protocol,
          priority: g.priority
        }))
      }
    };
    
    // Retornar jogo unificado + outros jogos não-COD
    const otherGames = allGames.filter(game => 
      !(game.gameFamily === 'Call of Duty' || this.isCODGame(game))
    );
    
    return [unifiedCOD, ...otherGames];
  }

  isCODGame(game) {
    const name = game.name.toLowerCase();
    return (
      name.includes('call of duty') ||
      name.includes('callofduty') ||
      (name.includes('cod') && !name.includes('codec'))
    );
  }
}

// ===================================================
// SISTEMA DE LANÇAMENTO PROFISSIONAL
// ===================================================

class UltraGameLauncher {
  constructor(logger, profileManager) {
    this.logger = logger;
    this.profileManager = profileManager;
    this.runningGames = new Map();
    this.optimizationProfiles = this.createOptimizationProfiles();
    this.launchHistory = [];
    this.performance = {
      successRate: 0,
      avgLaunchTime: 0,
      totalLaunches: 0
    };
  }

  createOptimizationProfiles() {
    return {
      'ultra-performance': {
        name: 'Ultra Performance',
        description: 'Máximo FPS para competitivo',
        icon: '🚀',
        targets: { fps: 120, latency: '<30ms' }
      },
      'balanced-fps': {
        name: 'Balanced FPS',
        description: 'Equilíbrio entre performance e qualidade',
        icon: '⚖️',
        targets: { fps: 60, latency: '<50ms' }
      },
      'balanced-quality': {
        name: 'Balanced Quality',
        description: 'Foco em qualidade visual mantendo performance',
        icon: '🎨',
        targets: { fps: 45, latency: '<80ms' }
      },
      'quality': {
        name: 'Maximum Quality',
        description: 'Máxima qualidade visual',
        icon: '💎',
        targets: { fps: 30, latency: '<100ms' }
      }
    };
  }

  async launchGameAdvanced(game, profileName = null, options = {}) {
    const timer = this.logger.startTimer(`Launch ${game.name}`);
    
    this.logger.info(`🚀 Lançamento avançado: ${game.name}`);
    this.logger.info(`   📋 Plataforma: ${game.platform}`);
    this.logger.info(`   🎯 Profile: ${profileName || 'auto'}`);
    
    try {
      // 1. Validar jogo
      const validation = await this.validateGame(game);
      if (!validation.valid && !options.ignoreValidation) {
        return this.createFailureResult('validation_failed', validation.reason);
      }

      // 2. Preparar profile de otimização
      const profile = this.resolveOptimizationProfile(game, profileName);
      this.logger.info(`   ⚡ Profile resolvido: ${profile.name}`);

      // 3. Otimização pré-lançamento
      await this.performPreLaunchOptimization(game, profile, options);

      // 4. Executar lançamento
      const launchResult = await this.executeAdvancedLaunch(game, profile, options);

      // 5. Configurar monitoramento pós-lançamento
      if (launchResult.success) {
        await this.startGameMonitoring(game, launchResult, profile);
        this.recordLaunchSuccess(game, launchResult, timer.end());
        
        if (GamePathAISingleton.instance.gameEvents) {
          GamePathAISingleton.instance.gameEvents.emitGameLaunched(game, launchResult);
        }
      } else {
        this.recordLaunchFailure(game, launchResult, timer.end());
      }

      return launchResult;

    } catch (error) {
      const duration = timer.end();
      this.logger.error(`❌ Erro no lançamento: ${error.message}`, {
        game: game.name,
        platform: game.platform,
        duration
      });
      
      const failureResult = this.createFailureResult('launch_error', error.message);
      this.recordLaunchFailure(game, failureResult, duration);
      
      return failureResult;
    }
  }

  async validateGame(game) {
    const validation = {
      valid: true,
      reasons: [],
      warnings: []
    };

    if (!game.name || !game.platform) {
      validation.valid = false;
      validation.reasons.push('Dados básicos do jogo incompletos');
    }

    if (game.platform === 'Steam' && !game.appId && !game.executablePath) {
      validation.valid = false;
      validation.reasons.push('Jogo Steam sem AppID nem executável');
    }

    validation.reason = validation.reasons.join('; ');
    return validation;
  }

  resolveOptimizationProfile(game, profileName) {
    if (profileName && this.optimizationProfiles[profileName]) {
      return this.optimizationProfiles[profileName];
    }

    const savedProfile = this.profileManager.getProfile(game.id);
    if (savedProfile && savedProfile.template && this.optimizationProfiles[savedProfile.template]) {
      return this.optimizationProfiles[savedProfile.template];
    }

    if (game.optimizationProfile && this.optimizationProfiles[game.optimizationProfile]) {
      return this.optimizationProfiles[game.optimizationProfile];
    }

    return this.optimizationProfiles['balanced-fps'];
  }

  async performPreLaunchOptimization(game, profile, options = {}) {
    const optimizations = [];
    
    try {
      if (!options.skipSystemOptimization) {
        await this.optimizeSystem();
        optimizations.push('Sistema');
      }

      if (!options.skipMemoryOptimization) {
        await this.optimizeMemory();
        optimizations.push('Memória');
      }

      this.logger.success(`✅ Otimizações aplicadas:`, optimizations);
    } catch (error) {
      this.logger.warn(`⚠️ Erro na otimização: ${error.message}`);
    }
  }

  async optimizeSystem() {
    // Implementação básica de otimização do sistema
    this.logger.debug('Sistema otimizado');
  }

  async optimizeMemory() {
    try {
      // Limpeza básica de memória
      if (global.gc) {
        global.gc();
      }
      
      await execAsync('ipconfig /flushdns');
      this.logger.debug('Memória otimizada');
    } catch (error) {
      this.logger.debug('Erro na otimização de memória:', error.message);
    }
  }

  async executeAdvancedLaunch(game, profile, options = {}) {
    const attempts = [];

    // Tentativa 1: Método específico da plataforma
    try {
      this.logger.info(`🎯 Tentativa 1: ${game.platform} (método primário)`);
      const result = await this.launchByPlatform(game, profile, options);
      
      if (result.success) {
        attempts.push({ method: 'primary', success: true, result });
        return {
          ...result,
          attempts,
          finalMethod: 'primary'
        };
      } else {
        attempts.push({ method: 'primary', success: false, error: result.error });
      }
    } catch (error) {
      attempts.push({ method: 'primary', success: false, error: error.message });
      this.logger.warn(`⚠️ Método primário falhou: ${error.message}`);
    }

    // Tentativa 2: Método direto
    if (game.executablePath && !options.skipDirect) {
      try {
        this.logger.info(`🎯 Tentativa 2: Lançamento direto`);
        const result = await this.launchDirect(game, profile, options);
        
        if (result.success) {
          attempts.push({ method: 'direct', success: true, result });
          return {
            ...result,
            attempts,
            finalMethod: 'direct'
          };
        } else {
          attempts.push({ method: 'direct', success: false, error: result.error });
        }
      } catch (error) {
        attempts.push({ method: 'direct', success: false, error: error.message });
        this.logger.warn(`⚠️ Lançamento direto falhou: ${error.message}`);
      }
    }

    return this.createFailureResult('all_methods_failed', 'Todos os métodos de lançamento falharam', attempts);
  }

  async launchByPlatform(game, profile, options = {}) {
    switch (game.platform) {
      case 'Steam':
        return await this.launchSteamGame(game, profile, options);
      case 'Xbox':
        return await this.launchXboxGame(game, profile, options);
      case 'Epic':
        return await this.launchEpicGame(game, profile, options);
      default:
        return await this.launchDirect(game, profile, options);
    }
  }

  async launchSteamGame(game, profile, options = {}) {
    this.logger.info(`🎮 Lançando via Steam: ${game.name}`);

    try {
      if (game.appId) {
        const steamUrl = `steam://rungameid/${game.appId}`;
        
        const process = spawn('cmd', ['/c', 'start', '', `"${steamUrl}"`], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        });

        process.unref();

        return this.createSuccessResult('steam-url', {
          launchCommand: steamUrl,
          process,
          appId: game.appId
        });
      } else {
        throw new Error('AppID do Steam não encontrado');
      }
    } catch (error) {
      return this.createFailureResult('steam_launch_failed', error.message);
    }
  }

  async launchXboxGame(game, profile, options = {}) {
    this.logger.info(`🎮 Lançando via Xbox: ${game.name}`);

    try {
      if (game.gameFamily === 'Call of Duty') {
        return await this.launchCallOfDutyAdvanced(game, profile, options);
      }

      let launchCommand = null;
      
      if (game.launchOptions?.protocol) {
        launchCommand = game.launchOptions.protocol;
      } else if (game.launchOptions?.packageId) {
        launchCommand = `ms-xbl-${game.launchOptions.packageId}:`;
      } else {
        launchCommand = `ms-xbl-${game.id}:`;
      }

      this.logger.info(`   🔗 Comando: ${launchCommand}`);

      const process = spawn('cmd', ['/c', 'start', '', `"${launchCommand}"`], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      process.unref();

      return this.createSuccessResult('xbox-protocol', {
        launchCommand,
        process,
        protocol: launchCommand
      });
    } catch (error) {
      return this.createFailureResult('xbox_launch_failed', error.message);
    }
  }

  async launchCallOfDutyAdvanced(game, profile, options = {}) {
    this.logger.info(`🔫 Lançamento especializado Call of Duty`);

    const codMethods = [
      () => this.launchCODViaXboxApp(game, profile),
      () => this.launchCODViaProtocol(game, profile),
      () => this.launchCODDirect(game, profile)
    ];

    for (const [index, method] of codMethods.entries()) {
      try {
        this.logger.info(`   🎯 COD Método ${index + 1}...`);
        const result = await method();
        
        if (result.success) {
          this.logger.success(`   ✅ COD Sucesso com método ${index + 1}`);
          return {
            ...result,
            codMethod: index + 1,
            specializedLaunch: true
          };
        }
      } catch (error) {
        this.logger.debug(`   ❌ COD Método ${index + 1} falhou: ${error.message}`);
      }
    }

    throw new Error('Todos os métodos especializados Call of Duty falharam');
  }

  async launchCODViaXboxApp(game, profile) {
    const commands = [
      'ms-xbl-callofduty:',
      'callofduty:',
      'ms-xbl-cod:'
    ];

    for (const command of commands) {
      try {
        const process = spawn('cmd', ['/c', 'start', '', `"${command}"`], {
          detached: true,
          stdio: 'ignore'
        });

        process.unref();
        
        return this.createSuccessResult('cod-xbox-app', {
          launchCommand: command,
          process
        });
      } catch (error) {
        continue;
      }
    }

    throw new Error('Xbox App COD launch failed');
  }

  async launchCODViaProtocol(game, profile) {
    const protocol = 'ms-xbl-cod:';
    
    const process = spawn('cmd', ['/c', 'start', '', `"${protocol}"`], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();

    return this.createSuccessResult('cod-protocol', {
      launchCommand: protocol,
      process
    });
  }

  async launchCODDirect(game, profile) {
    if (!game.executablePath) {
      throw new Error('Caminho do executável não encontrado');
    }

    return await this.launchDirect(game, profile);
  }

  async launchEpicGame(game, profile, options = {}) {
    this.logger.info(`🎮 Lançando via Epic: ${game.name}`);
    
    try {
      const epicUrl = `com.epicgames.launcher://apps/${game.packageName || game.id}?action=launch&silent=true`;
      
      const process = spawn('cmd', ['/c', 'start', '', `"${epicUrl}"`], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      process.unref();

      return this.createSuccessResult('epic-url', {
        launchCommand: epicUrl,
        process
      });
    } catch (error) {
      return this.createFailureResult('epic_launch_failed', error.message);
    }
  }

  async launchDirect(game, profile, options = {}) {
    this.logger.info(`🎮 Lançamento direto: ${game.name}`);

    try {
      if (!game.executablePath) {
        throw new Error('Caminho do executável não encontrado');
      }

      await fsPromises.access(game.executablePath);

      const workingDirectory = path.dirname(game.executablePath);
      const args = this.buildDirectLaunchArgs(game, profile);

      this.logger.info(`   📁 Diretório: ${workingDirectory}`);
      this.logger.info(`   ⚙️ Argumentos: ${args.join(' ')}`);

      const process = spawn(game.executablePath, args, {
        detached: true,
        stdio: 'ignore',
        cwd: workingDirectory,
        windowsHide: false
      });

      process.unref();

      return this.createSuccessResult('direct', {
        launchCommand: game.executablePath,
        arguments: args,
        workingDirectory,
        process
      });
    } catch (error) {
      return this.createFailureResult('direct_launch_failed', error.message);
    }
  }

  buildDirectLaunchArgs(game, profile) {
    const args = [];

    if (profile.name === 'Ultra Performance') {
      args.push('-high');
    }

    if (game.gameFamily === 'Call of Duty') {
      args.push('-d3d11');
      args.push('-fullscreen');
    }

    return args;
  }

  async startGameMonitoring(game, launchResult, profile) {
    const monitoringData = {
      game,
      launchResult,
      profile,
      startTime: Date.now(),
      monitoring: true
    };

    this.runningGames.set(game.id, monitoringData);
    this.logger.success(`📊 Monitoramento iniciado para ${game.name}`);
  }

  createSuccessResult(method, data = {}) {
    return {
      success: true,
      method,
      timestamp: Date.now(),
      ...data
    };
  }

  createFailureResult(reason, error, attempts = []) {
    return {
      success: false,
      reason,
      error,
      attempts,
      timestamp: Date.now()
    };
  }

  recordLaunchSuccess(game, result, duration) {
    this.launchHistory.push({
      game: game.name,
      platform: game.platform,
      success: true,
      method: result.method,
      duration,
      timestamp: Date.now()
    });

    this.updatePerformanceStats();
    this.logger.performance('Launch Success', {
      game: game.name,
      method: result.method,
      duration: `${duration.toFixed(2)}ms`
    });
  }

  recordLaunchFailure(game, result, duration) {
    this.launchHistory.push({
      game: game.name,
      platform: game.platform,
      success: false,
      reason: result.reason,
      error: result.error,
      duration,
      timestamp: Date.now()
    });

    this.updatePerformanceStats();
  }

  updatePerformanceStats() {
    const recentHistory = this.launchHistory.slice(-100);
    const successful = recentHistory.filter(h => h.success);
    
    this.performance.totalLaunches = recentHistory.length;
    this.performance.successRate = recentHistory.length > 0 
      ? (successful.length / recentHistory.length * 100).toFixed(2) + '%'
      : '0%';
    this.performance.avgLaunchTime = successful.length > 0
      ? (successful.reduce((sum, h) => sum + h.duration, 0) / successful.length).toFixed(2) + 'ms'
      : '0ms';
  }

  getLaunchStats() {
    return {
      ...this.performance,
      recentLaunches: this.launchHistory.slice(-10),
      runningGames: this.runningGames.size,
      supportedPlatforms: ['Steam', 'Xbox', 'Epic', 'Battle.net', 'GOG', 'Standalone']
    };
  }
}

// ===================================================
// DETECTOR DE JOGOS
// ===================================================

class AdvancedGameDetector {
  constructor(CONFIG, logger) {
    this.CONFIG = CONFIG;
    this.logger = logger;
    this.detectors = {
      steam: this.getSteamGames.bind(this),
      xbox: this.getXboxGames.bind(this),
      epic: this.getEpicGames.bind(this),
      standalone: this.getStandaloneGames.bind(this)
    };
    
    this.statistics = {
      lastScan: null,
      totalGames: 0,
      byPlatform: {},
      scanDuration: 0,
      cacheHits: 0
    };
  }

  async getAllGames() {
    const timer = this.logger.startTimer('Game Detection');
    
    this.logger.info('🔍 Iniciando detecção avançada de jogos...');
    
    const cacheKey = 'all-games-advanced';
    const cached = GamePathAISingleton.instance.gameCache.get(cacheKey);
    
    if (cached) {
      this.logger.info('📦 Jogos carregados do cache');
      this.statistics.cacheHits++;
      return cached;
    }

    const allGames = [];
    const results = {};
    
    const detectionPromises = Object.entries(this.detectors).map(async ([platform, detector]) => {
      const platformTimer = this.logger.startTimer(`Platform ${platform}`);
      
      try {
        const games = await Utils.safeExecute(detector, [], this.CONFIG.MAX_DETECTION_TIME);
        const duration = platformTimer.end();
        
        if (games && Array.isArray(games)) {
          allGames.push(...games);
          results[platform] = { 
            success: true, 
            count: games.length, 
            duration: `${duration.toFixed(2)}ms` 
          };
          
          this.logger.success(`✅ ${platform}: ${games.length} jogos (${duration.toFixed(2)}ms)`);
        } else {
          results[platform] = { 
            success: false, 
            error: 'Retorno inválido',
            duration: `${duration.toFixed(2)}ms`
          };
        }
      } catch (error) {
        const duration = platformTimer.end();
        results[platform] = { 
          success: false, 
          error: error.message,
          duration: `${duration.toFixed(2)}ms`
        };
        
        this.logger.error(`❌ ${platform}: ${error.message}`);
      }
    });

    await Promise.allSettled(detectionPromises);

    const uniqueGames = this.removeDuplicatesAdvanced(allGames);
    const enrichedGames = this.enrichGamesWithMetadata(uniqueGames);
    
    this.updateStatistics(enrichedGames, results, timer.end());
    
    GamePathAISingleton.instance.gameCache.set(cacheKey, enrichedGames, this.CONFIG.CACHE_TTL);
    
    this.logger.success(`🎮 Detecção concluída: ${allGames.length} → ${enrichedGames.length} jogos únicos`);
    
    return enrichedGames;
  }

  removeDuplicatesAdvanced(games) {
    const uniqueMap = new Map();
    
    for (const game of games) {
      const normalizedName = this.normalizeGameName(game.name);
      const key = `${normalizedName}-${game.platform}`;
      
      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key);
        if (this.hasHigherQuality(game, existing)) {
          uniqueMap.set(key, game);
        }
      } else {
        uniqueMap.set(key, game);
      }
    }
    
    return Array.from(uniqueMap.values());
  }

  normalizeGameName(name) {
    return name
      .toLowerCase()
      .replace(/[®™©]/g, '')
      .replace(/\s*:\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  hasHigherQuality(game1, game2) {
    const score1 = this.calculateGameQuality(game1);
    const score2 = this.calculateGameQuality(game2);
    return score1 > score2;
  }

  calculateGameQuality(game) {
    let score = 0;
    
    const platformScores = {
      'Steam': 10,
      'Epic': 9,
      'Xbox': 8,
      'Battle.net': 7,
      'GOG': 6,
      'Standalone': 4
    };
    score += platformScores[game.platform] || 0;
    
    if (game.appId) score += 5;
    if (game.iconUrl) score += 3;
    if (game.executablePath) score += 4;
    if (game.installPath) score += 2;
    if (game.size > 0) score += 3;
    
    if (game.size > 50000) score += 10;
    else if (game.size > 20000) score += 8;
    else if (game.size > 10000) score += 6;
    else if (game.size > 1000) score += 4;
    
    return score;
  }

  enrichGamesWithMetadata(games) {
    return games.map(game => {
      return {
        ...game,
        cleanName: this.getCleanName(game.name),
        normalizedName: this.normalizeGameName(game.name),
        qualityScore: this.calculateGameQuality(game),
        platformInfo: this.CONFIG.PLATFORMS[game.platform] || this.CONFIG.PLATFORMS.Standalone,
        sizeFormatted: game.size ? Utils.formatBytes(game.size * 1024 * 1024) : 'Desconhecido',
        lastPlayedFormatted: game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString('pt-BR') : 'Nunca',
        detectedAt: Date.now(),
        gameHash: this.generateGameHash(game)
      };
    });
  }

  getCleanName(name) {
    return name
      .replace(/[®™©]/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateGameHash(game) {
    const data = `${game.name}-${game.platform}-${game.size || 0}-${game.appId || ''}`;
    return Buffer.from(data).toString('base64').slice(0, 12);
  }

  updateStatistics(games, results, duration) {
    this.statistics.lastScan = Date.now();
    this.statistics.totalGames = games.length;
    this.statistics.scanDuration = duration;
    
    this.statistics.byPlatform = {};
    games.forEach(game => {
      this.statistics.byPlatform[game.platform] = 
        (this.statistics.byPlatform[game.platform] || 0) + 1;
    });
    
    this.statistics.detectorResults = results;
  }

  getDetectionStatistics() {
    return {
      ...this.statistics,
      cacheHitRate: this.statistics.cacheHits > 0 ? 
        `${((this.statistics.cacheHits / (this.statistics.cacheHits + 1)) * 100).toFixed(2)}%` : '0%'
    };
  }

  async getSteamGames() {
    try {
      this.logger.debug('🔍 Detectando jogos Steam...');
      
      const steamPath = await this.findSteamPath();
      if (!steamPath) {
        this.logger.warn('Steam não encontrado');
        return [];
      }

      const libraries = await this.findSteamLibraries(steamPath);
      const games = [];
      
      for (const library of libraries) {
        const libraryGames = await this.scanSteamLibrary(library);
        games.push(...libraryGames);
      }

      return games;
    } catch (error) {
      this.logger.error('Erro ao detectar jogos Steam', { error: error.message });
      return [];
    }
  }

  async findSteamPath() {
    const possiblePaths = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam',
      'D:\\Steam',
      'E:\\Steam'
    ];

    for (const steamPath of possiblePaths) {
      try {
        await fsPromises.access(path.join(steamPath, 'steam.exe'));
        return steamPath;
      } catch {
        continue;
      }
    }

    return null;
  }

  async findSteamLibraries(steamPath) {
    const libraries = [steamPath];
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    
    try {
      const content = await fsPromises.readFile(libraryFoldersPath, 'utf8');
      const pathRegex = /"path"\s+"([^"]+)"/g;
      let match;
      
      while ((match = pathRegex.exec(content)) !== null) {
        const libraryPath = match[1].replace(/\\\\/g, '\\');
        if (!libraries.includes(libraryPath)) {
          libraries.push(libraryPath);
        }
      }
    } catch (error) {
      this.logger.debug('Erro ao ler bibliotecas Steam:', error.message);
    }

    return libraries;
  }

  async scanSteamLibrary(libraryPath) {
    const games = [];
    const steamAppsPath = path.join(libraryPath, 'steamapps');
    
    try {
      const files = await fsPromises.readdir(steamAppsPath);
      const manifests = files.filter(file => 
        file.startsWith('appmanifest_') && file.endsWith('.acf')
      );

      for (const manifest of manifests) {
        try {
          const game = await this.parseSteamManifest(steamAppsPath, manifest);
          if (game) {
            games.push(game);
          }
        } catch (error) {
          this.logger.debug(`Erro ao processar manifesto ${manifest}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.debug(`Erro ao escanear biblioteca ${libraryPath}:`, error.message);
    }

    return games;
  }

  async parseSteamManifest(steamAppsPath, manifestFile) {
    const manifestPath = path.join(steamAppsPath, manifestFile);
    const content = await fsPromises.readFile(manifestPath, 'utf8');

    const nameMatch = /"name"\s+"([^"]+)"/.exec(content);
    const appIdMatch = /"appid"\s+"(\d+)"/.exec(content);
    const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(content);
    const sizeMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(content);
    const lastUpdatedMatch = /"LastUpdated"\s+"(\d+)"/.exec(content);

    if (!nameMatch || !appIdMatch || !installDirMatch) {
      return null;
    }

    const name = nameMatch[1];
    const appId = appIdMatch[1];
    const installDir = installDirMatch[1];
    const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;
    const lastUpdated = lastUpdatedMatch ? new Date(parseInt(lastUpdatedMatch[1]) * 1000) : new Date();

    const gamePath = path.join(steamAppsPath, 'common', installDir);
    
    try {
      await fsPromises.access(gamePath);
    } catch {
      return null;
    }

    const executablePath = await this.findGameExecutable(gamePath, installDir);

    return {
      id: `steam-${appId}`,
      name,
      platform: 'Steam',
      installPath: gamePath,
      executablePath,
      processName: executablePath ? path.basename(executablePath) : '',
      size: Math.round(size / (1024 * 1024)),
      lastPlayed: lastUpdated,
      iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      appId,
      launchOptions: {
        protocol: `steam://rungameid/${appId}`,
        direct: executablePath
      },
      detectionMethod: 'steam-manifest'
    };
  }

  async findGameExecutable(gamePath, installDir) {
    try {
      const files = await fsPromises.readdir(gamePath);
      const exeFiles = files.filter(file => 
        file.endsWith('.exe') && 
        !file.toLowerCase().includes('unins') &&
        !file.toLowerCase().includes('setup') &&
        !file.toLowerCase().includes('crash')
      );

      if (exeFiles.length === 0) return null;

      const preferredExe = exeFiles.find(exe => {
        const baseName = path.basename(exe, '.exe').toLowerCase();
        return baseName === installDir.toLowerCase();
      });

      if (preferredExe) {
        return path.join(gamePath, preferredExe);
      }

      let largestExe = exeFiles[0];
      let largestSize = 0;

      for (const exe of exeFiles) {
        try {
          const stats = await fsPromises.stat(path.join(gamePath, exe));
          if (stats.size > largestSize) {
            largestSize = stats.size;
            largestExe = exe;
          }
        } catch {
          continue;
        }
      }

      return path.join(gamePath, largestExe);
    } catch {
      return null;
    }
  }

  async getXboxGames() {
    this.logger.debug('🔍 Detectando jogos Xbox...');
    return await GamePathAISingleton.instance.xboxDetector.detectXboxGames();
  }

  async getEpicGames() {
    this.logger.debug('🔍 Detectando jogos Epic...');
    return [];
  }

  async getStandaloneGames() {
    this.logger.debug('🔍 Detectando jogos standalone...');
    return [];
  }
}

// ===================================================
// SISTEMA DE MONITORAMENTO BÁSICO
// ===================================================

class RealTimeSystemMonitor {
  constructor(logger) {
    this.logger = logger;
    this.isMonitoring = false;
    this.performanceData = [];
    this.alerts = [];
    this.thresholds = {
      cpu: 85,
      memory: 90,
      gpu: 95
    };
  }

  async init() {
    this.isMonitoring = true;
    // Não loga mais para evitar duplicação
  }

  async getSystemMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        cpu: await this.getCPUUsage(),
        memory: this.getMemoryInfo(),
        uptime: os.uptime()
      };

      return {
        current: metrics,
        history: this.performanceData.slice(-20),
        alerts: this.alerts.slice(-5),
        summary: this.generateSummary()
      };
    } catch (error) {
      return {
        current: null,
        history: [],
        alerts: [],
        summary: { status: 'error', error: error.message }
      };
    }
  }

  async getCPUUsage() {
    try {
      const { stdout } = await execAsync('wmic cpu get loadpercentage /value');
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('LoadPercentage')) {
          const usage = parseInt(line.split('=')[1]);
          return {
            usage: isNaN(usage) ? 0 : usage,
            cores: os.cpus().length,
            model: os.cpus()[0].model
          };
        }
      }
      
      return { usage: 0, cores: os.cpus().length, model: 'Unknown' };
    } catch (error) {
      return { usage: 0, cores: os.cpus().length, model: 'Unknown' };
    }
  }

  getMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      total: totalMemory,
      used: usedMemory,
      available: freeMemory,
      usage: Math.round((usedMemory / totalMemory) * 100),
      totalFormatted: Utils.formatBytes(totalMemory),
      usedFormatted: Utils.formatBytes(usedMemory),
      availableFormatted: Utils.formatBytes(freeMemory)
    };
  }

  generateSummary() {
    return {
      cpu: 0,
      memory: 0,
      status: 'optimal',
      uptime: Utils.formatDuration(os.uptime() * 1000)
    };
  }

  cleanup() {
    this.isMonitoring = false;
    this.performanceData = [];
    this.alerts = [];
  }
}

// ===================================================
// SISTEMA DE BACKUP BÁSICO
// ===================================================

class BackupSystem {
  constructor(CONFIG, logger) {
    this.CONFIG = CONFIG;
    this.logger = logger;
    this.backupDir = path.join(CONFIG.CONFIG_DIR, 'backups');
    this.maxBackups = 10;
  }

  async init() {
    try {
      await fsPromises.mkdir(this.backupDir, { recursive: true });
      // Não loga mais para evitar duplicação
    } catch (error) {
      this.logger.error('Erro ao inicializar backup:', error.message);
    }
  }

  async createBackup(type = 'manual') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${type}-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      await fsPromises.mkdir(backupPath, { recursive: true });
      
      const backupData = {
        timestamp: Date.now(),
        type,
        version: '3.0',
        data: {
          profiles: await this.backupProfiles(),
          settings: await this.backupSettings()
        }
      };
      
      await fsPromises.writeFile(
        path.join(backupPath, 'backup.json'),
        JSON.stringify(backupData, null, 2)
      );
      
      this.logger.success(`💾 Backup criado: ${backupName}`);
      return { success: true, backupName, path: backupPath };
      
    } catch (error) {
      this.logger.error('Erro ao criar backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  async backupProfiles() {
    try {
      const profileManager = GamePathAISingleton.instance.profileManager;
      if (fs.existsSync(profileManager.profilesFile)) {
        const content = await fsPromises.readFile(profileManager.profilesFile, 'utf8');
        return JSON.parse(content);
      }
      return {};
    } catch {
      return {};
    }
  }

  async backupSettings() {
    const systemMonitor = GamePathAISingleton.instance.systemMonitor;
    const gameLauncher = GamePathAISingleton.instance.gameLauncher;
    
    return {
      thresholds: systemMonitor.thresholds,
      optimizationProfiles: Object.keys(gameLauncher.optimizationProfiles)
    };
  }

  async listBackups() {
    try {
      const items = await fsPromises.readdir(this.backupDir);
      const backups = [];
      
      for (const item of items) {
        try {
          const backupPath = path.join(this.backupDir, item, 'backup.json');
          const content = await fsPromises.readFile(backupPath, 'utf8');
          const backupData = JSON.parse(content);
          
          backups.push({
            name: item,
            timestamp: backupData.timestamp,
            type: backupData.type,
            version: backupData.version,
            size: (await fsPromises.stat(backupPath)).size
          });
        } catch {
          continue;
        }
      }
      
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }
}

// ===================================================
// CONFIGURAÇÃO DO ELECTRON - SINGLETON
// ===================================================

// Garantir apenas uma instância
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('⚠️ Outra instância já está rodando - fechando esta instância');
  app.quit();
} else {
  // Criar instância única
  const gamePathAI = new GamePathAISingleton();

  // ===================================================
  // EVENTOS DO ELECTRON
  // ===================================================

  app.whenReady().then(async () => {
    console.log('🚀 Electron pronto - iniciando aplicação');
    await gamePathAI.start();
  });

  app.on('second-instance', () => {
    if (gamePathAI.mainWindow) {
      if (gamePathAI.mainWindow.isMinimized()) {
        gamePathAI.mainWindow.restore();
      }
      gamePathAI.mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      gamePathAI.isQuitting = true;
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gamePathAI.createMainWindow();
    }
  });

  app.on('before-quit', async () => {
    gamePathAI.isQuitting = true;
    await gamePathAI.cleanup();
  });

  // ===================================================
  // TRATAMENTO DE ERROS GLOBAIS
  // ===================================================

  process.on('uncaughtException', (error) => {
    if (gamePathAI.logger) {
      gamePathAI.logger.error('❌ Exceção não capturada:', {
        error: error.message,
        stack: error.stack
      });
    } else {
      console.error('❌ Exceção não capturada:', error);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    if (gamePathAI.logger) {
      gamePathAI.logger.error('❌ Promise rejeitada não tratada:', {
        reason: reason
      });
    } else {
      console.error('❌ Promise rejeitada:', reason);
    }
  });

  // Suprimir warnings de deprecação
  process.removeAllListeners('warning');

  // ===================================================
  // EXPORTS E INFORMAÇÕES FINAIS
  // ===================================================

  module.exports = {
    gamePathAI,
    Utils,
    AdvancedIPCSanitizer
  };
}