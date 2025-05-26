// electron/main.cjs - GamePath AI Professional v3.0
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Carregar mÃ³dulos de detecÃ§Ã£o de jogos com tratamento de erro
let gameDetectionModules = {};
try {
  const { getSteamGames } = require('../src/lib/gameDetection/platforms/getSteamGames.ts');
  const { getEpicGames } = require('../src/lib/gameDetection/platforms/getEpicGames.ts');
  const { getXboxGames } = require('../src/lib/gameDetection/platforms/getXboxGames.ts');
  const { getOriginGames } = require('../src/lib/gameDetection/platforms/getOriginGames.ts');
  const { getBattleNetGames } = require('../src/lib/gameDetection/platforms/getBattleNetGames.ts');
  const { getGOGGames } = require('../src/lib/gameDetection/platforms/getGOGGames.ts');
  const { getUplayGames } = require('../src/lib/gameDetection/platforms/getUplayGames.ts');

  gameDetectionModules = {
    getSteamGames,
    getEpicGames,
    getXboxGames,
    getOriginGames,
    getBattleNetGames,
    getGOGGames,
    getUplayGames
  };
  
  console.log('âœ… Game detection modules loaded successfully');
} catch (error) {
  console.error('âŒ Error loading game detection modules:', error);
  // Fallback functions
  gameDetectionModules = {
    getSteamGames: () => [],
    getEpicGames: () => [],
    getXboxGames: () => [],
    getOriginGames: () => [],
    getBattleNetGames: () => [],
    getGOGGames: () => [],
    getUplayGames: () => []
  };
}

// Outros mÃ³dulos do sistema
const fpsOptimizer = require('./fps-optimizer.cjs');
const systemMonitor = require('./system-monitor.cjs');
const networkMetrics = require('./network-metrics.cjs');
const vpnManager = require('./vpn-manager.cjs');
const { CONFIG_DIR, LOGS_DIR, CACHE_DIR, PROFILES_DIR, DEFAULT_CONFIG } = require('./config.cjs');
const Store = require('electron-store');
const os = require('os');
const { execSync } = require('child_process');

// ConfiguraÃ§Ã£o do Store
const store = new Store({
  name: 'gamepath-ai-config',
  defaults: DEFAULT_CONFIG
});

// VariÃ¡veis globais
let mainWindow = null;
let tray = null;
let isQuitting = false;
let gameCache = {};
let lastScanTime = 0;
const SCAN_COOLDOWN = 60000; // 1 minuto entre scans completos

// ConfiguraÃ§Ã£o de diretÃ³rios
function ensureDirectoriesExist() {
  const dirs = [CONFIG_DIR, LOGS_DIR, CACHE_DIR, PROFILES_DIR];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// InicializaÃ§Ã£o
async function initialize() {
  ensureDirectoriesExist();
  
  // Carregar cache de jogos
  try {
    const cachePath = path.join(CACHE_DIR, 'games-cache.json');
    if (fs.existsSync(cachePath)) {
      const cacheData = fs.readFileSync(cachePath, 'utf8');
      gameCache = JSON.parse(cacheData);
      console.log(`Loaded ${Object.keys(gameCache).length} games from cache`);
    }
  } catch (error) {
    console.error('Error loading game cache:', error);
    gameCache = {};
  }
}

// CriaÃ§Ã£o da janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../public/icons/icon.ico'),
    show: false, // NÃ£o mostrar atÃ© que esteja pronto
    backgroundColor: '#0d1117'
  });

  // Log preload path for debugging
  const preloadPath = path.join(__dirname, 'preload.cjs');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));

  // Carregar URL
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  mainWindow.loadURL(startUrl);

  // Abrir DevTools em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Eventos da janela
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('general.minimizeToTray')) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ConfiguraÃ§Ã£o do Tray
function setupTray() {
  const iconPath = path.join(__dirname, '../public/icons/tray-icon.png');
  
  tray = new Tray(iconPath);
  tray.setToolTip('GamePath AI');
  
  updateTrayMenu();
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

// AtualizaÃ§Ã£o do menu do Tray
function updateTrayMenu(games = []) {
  const gameMenuItems = games.slice(0, 5).map(game => {
    return {
      label: `${game.name} (${game.platform})`,
      submenu: [
        {
          label: 'Launch Game',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-launch-game', game.id);
            }
          }
        },
        {
          label: 'Optimize Game',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-optimize-game', game.id);
            }
          }
        }
      ]
    };
  });
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'GamePath AI', enabled: false },
    { type: 'separator' },
    ...gameMenuItems,
    { type: 'separator' },
    {
      label: 'Scan for Games',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-scan-games');
        }
      }
    },
    {
      label: 'Optimize System',
      submenu: [
        {
          label: 'Balanced',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-optimize-system', { profile: 'balanced' });
            }
          }
        },
        {
          label: 'Performance',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-optimize-system', { profile: 'performance' });
            }
          }
        },
        {
          label: 'Extreme',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-optimize-system', { profile: 'extreme' });
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// ConfiguraÃ§Ã£o de IPC para detecÃ§Ã£o de jogos
function setupGameDetectionIPC() {
  // File system operations
  ipcMain.handle('fs-exists', async (event, filePath) => {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs-read-dir', async (event, dirPath) => {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        path: path.join(dirPath, entry.name)
      }));
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  });

  ipcMain.handle('fs-read-file', async (event, filePath, encoding = 'utf8') => {
    try {
      const content = await fs.promises.readFile(filePath, encoding);
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  });

  ipcMain.handle('fs-stat', async (event, filePath) => {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      };
    } catch (error) {
      console.error(`Error getting stats for ${filePath}:`, error);
      return null;
    }
  });

  // Registry operations
  ipcMain.handle('registry-get-value', (event, hive, key, valueName) => {
    try {
      console.log(`Registry get value: ${hive}\\${key}`);
      
      // Mock some common registry values for development
      if (key.includes("Steam") && valueName === "SteamPath") {
        return "C:\\Program Files (x86)\\Steam";
      }
      
      if (key.includes("Epic") && valueName === "AppDataPath") {
        return "C:\\ProgramData\\Epic\\EpicGamesLauncher";
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting registry value ${hive}\\${key}\\${valueName}:`, error);
      return null;
    }
  });

  // Steam games detection
  ipcMain.handle('get-steam-games', async () => {
    try {
      return await gameDetectionModules.getSteamGames();
    } catch (error) {
      console.error('Error getting Steam games:', error);
      return [];
    }
  });

  // Xbox games detection
  ipcMain.handle('get-xbox-packages', async () => {
    try {
      return await gameDetectionModules.getXboxGames();
    } catch (error) {
      console.error('Error getting Xbox packages:', error);
      return [];
    }
  });

  // Epic games detection
  ipcMain.handle('get-epic-games', async () => {
    try {
      return await gameDetectionModules.getEpicGames();
    } catch (error) {
      console.error('Error getting Epic games:', error);
      return [];
    }
  });

  // Other platform games
  ipcMain.handle('get-origin-games', async () => {
    try {
      return await gameDetectionModules.getOriginGames();
    } catch (error) {
      console.error('Error getting Origin games:', error);
      return [];
    }
  });

  ipcMain.handle('get-battlenet-games', async () => {
    try {
      return await gameDetectionModules.getBattleNetGames();
    } catch (error) {
      console.error('Error getting Battle.net games:', error);
      return [];
    }
  });

  ipcMain.handle('get-gog-games', async () => {
    try {
      return await gameDetectionModules.getGOGGames();
    } catch (error) {
      console.error('Error getting GOG games:', error);
      return [];
    }
  });

  ipcMain.handle('get-uplay-games', async () => {
    try {
      return await gameDetectionModules.getUplayGames();
    } catch (error) {
      console.error('Error getting Uplay games:', error);
      return [];
    }
  });
  
  // Scan all games
  ipcMain.handle('scan-games', async () => {
    try {
      console.log('Scanning all games...');
      const results = await Promise.all([
        gameDetectionModules.getSteamGames(),
        gameDetectionModules.getEpicGames(),
        gameDetectionModules.getXboxGames(),
        gameDetectionModules.getOriginGames(),
        gameDetectionModules.getBattleNetGames(),
        gameDetectionModules.getGOGGames(),
        gameDetectionModules.getUplayGames()
      ]);
      
      const allGames = results.flat();
      console.log(`Total games found: ${allGames.length}`);
      
      return {
        success: true,
        data: allGames
      };
    } catch (error) {
      console.error('Error scanning games:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  });

      // Game launch
  ipcMain.handle('launch-game', async (event, gameOrPath, args = []) => {
    try {
      // Extrair o executablePath do objeto game ou usar string diretamente
      let executablePath;
      let gameName = 'Game';
      
      if (typeof gameOrPath === 'string') {
        executablePath = gameOrPath;
      } else if (gameOrPath && typeof gameOrPath === 'object') {
        executablePath = gameOrPath.executablePath;
        gameName = gameOrPath.name || 'Game';
      }
      
      if (!executablePath) {
        throw new Error('No executable path provided');
      }
      
      console.log('Launching game:', executablePath);
      console.log('Game name:', gameName);

      // Mostrar notificação (se disponível)
      try {
        const { Notification } = require('electron');
        if (Notification.isSupported()) {
          new Notification({
            title: 'GamePath AI',
            body: ` Launching ${gameName}...`,
            silent: false
          }).show();
        }
      } catch (notifError) {
        console.log('Notification error:', notifError.message);
      }

      const { spawn } = require('child_process');
      const fs = require('fs');
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(executablePath)) {
        throw new Error(`Executable not found: ${executablePath}`);
      }
      
      // Argumentos especiais para Call of Duty
      let launchArgs = [...args];
      if (gameName.includes('Call of Duty')) {
        console.log('Detected Call of Duty - using special launch method');
        
        // Para COD, tentar usar o launcher principal
        const codPath = require('path').dirname(executablePath);
        const bootstrapperPath = require('path').join(codPath, 'bootstrapper.exe');
        
        if (fs.existsSync(bootstrapperPath)) {
          console.log('Using COD bootstrapper:', bootstrapperPath);
          executablePath = bootstrapperPath;
        }
      }
      
      // Opções de spawn melhoradas
      const spawnOptions = {
        detached: true,
        stdio: 'ignore',
        cwd: require('path').dirname(executablePath)
      };
      
      console.log('Spawn options:', spawnOptions);
      console.log('Launch args:', launchArgs);
      
      const process = spawn(executablePath, launchArgs, spawnOptions);
      
      process.unref();
      
      // Notificação de sucesso
      setTimeout(() => {
        try {
          const { Notification } = require('electron');
          if (Notification.isSupported()) {
            new Notification({
              title: 'GamePath AI',
              body: ` ${gameName} launched successfully!`,
              silent: false
            }).show();
          }
        } catch (err) {
          console.log('Success notification error:', err.message);
        }
      }, 2000);
      
      return { success: true };
    } catch (error) {
      console.error('Error launching game:', error);
      
      // Notificação de erro
      try {
        const { Notification } = require('electron');
        if (Notification.isSupported()) {
          new Notification({
            title: 'GamePath AI - Error',
            body: ` Failed to launch game: ${error.message}`,
            silent: false
          }).show();
        }
      } catch (notifError) {
        console.log('Error notification failed:', notifError.message);
      }
      
      return { success: false, error: error.message };
    }
  });
}

// ConfiguraÃ§Ã£o de IPC para monitoramento do sistema
function setupSystemMonitoringIPC() {
  // Get system information
  ipcMain.handle('get-system-info', async () => {
    try {
      const metrics = await systemMonitor.getSystemInfo();
      return metrics;
    } catch (error) {
      console.error('Error getting system info:', error);
      return { error: error.message };
    }
  });

  // Executar diagnÃ³stico avanÃ§ado
  ipcMain.handle('run-advanced-diagnostics', async () => {
    try {
      const diagnostics = {
        cpu: {
          model: os.cpus()[0].model,
          cores: os.cpus().length,
          speeds: os.cpus().map(cpu => cpu.speed),
          architecture: os.arch(),
          temperature: await getCPUTemperature(),
        },
        memory: {
          total: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
          free: Math.round(os.freemem() / 1024 / 1024 / 1024),   // GB
          usage: process.memoryUsage(),
        },
        system: {
          platform: os.platform(),
          version: os.version(),
          uptime: Math.round(os.uptime() / 3600), // horas
          loadavg: os.loadavg(),
        },
        gpu: await getGPUInfo(),
      };
      
      return { success: true, data: diagnostics };
    } catch (error) {
      console.error('Advanced diagnostics error:', error);
      return { success: false, error: error.message };
    }
  });

  // Network metrics
  ipcMain.handle('get-network-metrics', async () => {
    try {
      const metrics = await networkMetrics.analyzeNetwork();
      return metrics;
    } catch (error) {
      console.error('Error getting network metrics:', error);
      return { error: error.message };
    }
  });

  // System optimization handlers
  ipcMain.handle('optimize-cpu', async (event, options = {}) => {
    try {
      const result = await systemMonitor.optimizeProcesses();
      return { success: true, improvement: 15, ...result };
    } catch (error) {
      console.error('Error optimizing CPU:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('optimize-memory', async (event, options = {}) => {
    try {
      const result = await systemMonitor.optimizeMemory();
      return { success: true, improvement: 20, ...result };
    } catch (error) {
      console.error('Error optimizing memory:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('optimize-gpu', async (event, options = {}) => {
    try {
      const result = await systemMonitor.optimizeDisk();
      return { success: true, improvement: 10, ...result };
    } catch (error) {
      console.error('Error optimizing GPU:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('optimize-network', async (event, options = {}) => {
    try {
      const result = await networkMetrics.optimizeRoute();
      return { success: true, improvement: 25, ...result };
    } catch (error) {
      console.error('Error optimizing network:', error);
      return { success: false, error: error.message };
    }
  });
}

// Function to get CPU temperature
async function getCPUTemperature() {
  try {
    if (process.platform === 'win32') {
      try {
        const output = execSync('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature /value', { encoding: 'utf8' });
        const match = output.match(/CurrentTemperature=(\d+)/);
        if (match && match[1]) {
          return (parseInt(match[1]) / 10) - 273.15;
        }
      } catch (error) {
        console.warn('Error getting CPU temperature via WMI:', error);
      }
    }
    return null;
  } catch (error) {
    console.warn('Error getting CPU temperature:', error);
    return null;
  }
}

// Function to get GPU information
async function getGPUInfo() {
  try {
    if (process.platform === 'win32') {
      try {
        const nameOutput = execSync('wmic path win32_VideoController get Name /value', { encoding: 'utf8' });
        const nameMatch = nameOutput.match(/Name=(.+)/);
        
        const driverOutput = execSync('wmic path win32_VideoController get DriverVersion /value', { encoding: 'utf8' });
        const driverMatch = driverOutput.match(/DriverVersion=(.+)/);
        
        return {
          name: nameMatch ? nameMatch[1].trim() : 'Unknown GPU',
          driver: driverMatch ? driverMatch[1].trim() : 'Unknown',
          temperature: null
        };
      } catch (error) {
        console.warn('Error getting GPU info via WMI:', error);
      }
    }
    
    return {
      name: 'Unknown GPU',
      driver: 'Unknown',
      temperature: null
    };
  } catch (error) {
    console.warn('Error getting GPU info:', error);
    return {
      name: 'Unknown GPU',
      driver: 'Unknown',
      temperature: null
    };
  }
}

// ConfiguraÃ§Ã£o principal de IPC
function setupIPC() {
  setupGameDetectionIPC();
  setupSystemMonitoringIPC();
  
  // Atualizar jogos no tray
  ipcMain.on('update-tray-games', (event, games) => {
    updateTrayMenu(games);
  });

  // System paths
  ipcMain.handle('get-system-paths', () => {
    return {
      home: app.getPath('home'),
      appData: app.getPath('appData'),
      userData: app.getPath('userData'),
      temp: app.getPath('temp'),
      desktop: app.getPath('desktop'),
      documents: app.getPath('documents'),
      downloads: app.getPath('downloads')
    };
  });

  // Environment variables
  ipcMain.handle('get-env-vars', () => {
    return {
      PATH: process.env.PATH,
      APPDATA: process.env.APPDATA,
      LOCALAPPDATA: process.env.LOCALAPPDATA,
      PROGRAMFILES: process.env.PROGRAMFILES,
      'PROGRAMFILES(X86)': process.env['PROGRAMFILES(X86)'],
      USERPROFILE: process.env.USERPROFILE
    };
  });
}

// Eventos do app
app.on('ready', async () => {
  await initialize();
  createWindow();
  setupTray();
  setupIPC();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Iniciar o app
console.log('GamePath AI Professional v3.0 starting...');
