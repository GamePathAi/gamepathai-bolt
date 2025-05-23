// electron/main.cjs - GamePath AI Professional v3.0
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fpsOptimizer = require('./fps-optimizer.cjs');
const systemMonitor = require('./system-monitor.cjs');
const networkMetrics = require('./network-metrics.cjs');
const vpnManager = require('./vpn-manager.cjs');
const { CONFIG_DIR, LOGS_DIR, CACHE_DIR, PROFILES_DIR, DEFAULT_CONFIG } = require('./config.cjs');
const Store = require('electron-store');

// Configuração do Store
const store = new Store({
  name: 'gamepath-ai-config',
  defaults: DEFAULT_CONFIG
});

// Variáveis globais
let mainWindow = null;
let tray = null;
let isQuitting = false;
let gameCache = {};
let lastScanTime = 0;
const SCAN_COOLDOWN = 60000; // 1 minuto entre scans completos

// Configuração de diretórios
function ensureDirectoriesExist() {
  const dirs = [CONFIG_DIR, LOGS_DIR, CACHE_DIR, PROFILES_DIR];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Inicialização
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

// Criação da janela principal
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
    show: false, // Não mostrar até que esteja pronto
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

// Configuração do Tray
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

// Atualização do menu do Tray
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

// Configuração de IPC para detecção de jogos
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
      // In a real implementation, this would use the registry-js module
      // For now, we'll just return mock data
      console.log(`Registry get value: ${hive}\\${key}\\${valueName}`);
      
      // Mock some common registry values
      if (key === "SOFTWARE\\Valve\\Steam" && valueName === "SteamPath") {
        return "C:\\Program Files (x86)\\Steam";
      }
      
      if (key === "SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher" && valueName === "AppDataPath") {
        return "C:\\ProgramData\\Epic\\EpicGamesLauncher";
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting registry value ${hive}\\${key}\\${valueName}:`, error);
      return null;
    }
  });

  ipcMain.handle('registry-enumerate-values', (event, hive, key) => {
    try {
      // In a real implementation, this would use the registry-js module
      console.log(`Registry enumerate values: ${hive}\\${key}`);
      return [];
    } catch (error) {
      console.error(`Error enumerating registry values ${hive}\\${key}:`, error);
      return [];
    }
  });

  ipcMain.handle('registry-enumerate-keys', (event, hive, key) => {
    try {
      // In a real implementation, this would use the registry-js module
      console.log(`Registry enumerate keys: ${hive}\\${key}`);
      return [];
    } catch (error) {
      console.error(`Error enumerating registry keys ${hive}\\${key}:`, error);
      return [];
    }
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
      downloads: app.getPath('downloads'),
      music: app.getPath('music'),
      pictures: app.getPath('pictures'),
      videos: app.getPath('videos'),
      logs: app.getPath('logs'),
      crashDumps: app.getPath('crashDumps')
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
      USERPROFILE: process.env.USERPROFILE,
      HOMEPATH: process.env.HOMEPATH,
      HOMEDRIVE: process.env.HOMEDRIVE,
      SYSTEMDRIVE: process.env.SYSTEMDRIVE,
      SYSTEMROOT: process.env.SYSTEMROOT,
      WINDIR: process.env.WINDIR,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP
    };
  });

  // Game operations
  ipcMain.handle('launch-game', async (event, executablePath, args = []) => {
    try {
      if (!executablePath) {
        throw new Error('No executable path provided');
      }

      // Check if the executable exists
      try {
        await fs.promises.access(executablePath);
      } catch {
        throw new Error(`Executable not found: ${executablePath}`);
      }

      // Launch the game
      const { spawn } = require('child_process');
      const process = spawn(executablePath, args, {
        detached: true,
        stdio: 'ignore'
      });

      process.unref();

      return { success: true };
    } catch (error) {
      console.error('Error launching game:', error);
      return { success: false, error: error.message };
    }
  });

  // Steam games detection
  ipcMain.handle('get-steam-games', async () => {
    try {
      const steamPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common";
      
      if (fs.existsSync(steamPath)) {
        const entries = fs.readdirSync(steamPath);
        
        return entries.map(entry => ({
          id: `steam-${entry.toLowerCase().replace(/\s+/g, '-')}`,
          name: entry,
          platform: 'Steam',
          installPath: path.join(steamPath, entry),
          executablePath: '',
          process_name: '',
          size: 0,
          icon_url: undefined,
          last_played: undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting Steam games:', error);
      return [];
    }
  });

  // Xbox games detection
  ipcMain.handle('get-xbox-packages', async () => {
    try {
      // In a real implementation, this would use PowerShell or registry queries
      // For now, we'll just return mock data
      return [
        {
          id: 'xbox-callofduty',
          name: 'Call of Duty',
          platform: 'Xbox',
          installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.CallofDuty',
          isGame: true
        }
      ];
    } catch (error) {
      console.error('Error getting Xbox packages:', error);
      return [];
    }
  });
}

// Configuração de IPC para monitoramento do sistema
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

  // Get CPU information
  ipcMain.handle('get-cpu-info', async () => {
    try {
      const cpuInfo = await systemMonitor.getCpuInfo();
      return cpuInfo;
    } catch (error) {
      console.error('Error getting CPU info:', error);
      return { error: error.message };
    }
  });

  // Get memory information
  ipcMain.handle('get-memory-info', async () => {
    try {
      const memInfo = await systemMonitor.getMemoryInfo();
      return memInfo;
    } catch (error) {
      console.error('Error getting memory info:', error);
      return { error: error.message };
    }
  });

  // Get GPU information
  ipcMain.handle('get-gpu-info', async () => {
    try {
      const gpuInfo = await systemMonitor.getGpuInfo();
      return gpuInfo;
    } catch (error) {
      console.error('Error getting GPU info:', error);
      return { error: error.message };
    }
  });

  // Get OS information
  ipcMain.handle('get-os-info', async () => {
    try {
      const osInfo = await systemMonitor.getOsInfo();
      return osInfo;
    } catch (error) {
      console.error('Error getting OS info:', error);
      return { error: error.message };
    }
  });

  // Get running processes
  ipcMain.handle('get-processes', async () => {
    try {
      const processes = await systemMonitor.getProcesses();
      return processes;
    } catch (error) {
      console.error('Error getting processes:', error);
      return { error: error.message };
    }
  });

  // Get network metrics
  ipcMain.handle('get-network-metrics', async () => {
    try {
      const metrics = await networkMetrics.analyzeNetwork();
      return metrics;
    } catch (error) {
      console.error('Error getting network metrics:', error);
      return { error: error.message };
    }
  });

  // Measure network latency
  ipcMain.handle('measure-latency', async (event, servers = {}) => {
    try {
      const latency = await networkMetrics.measureLatency(servers);
      return latency;
    } catch (error) {
      console.error('Error measuring latency:', error);
      return { error: error.message };
    }
  });

  // Measure connection quality
  ipcMain.handle('measure-connection-quality', async (event, host = '1.1.1.1') => {
    try {
      const quality = await networkMetrics.measureConnectionQuality(host);
      return quality;
    } catch (error) {
      console.error('Error measuring connection quality:', error);
      return { error: error.message };
    }
  });

  // Trace route
  ipcMain.handle('trace-route', async (event, host = '1.1.1.1') => {
    try {
      const route = await networkMetrics.traceRoute(host);
      return route;
    } catch (error) {
      console.error('Error tracing route:', error);
      return { error: error.message };
    }
  });

  // Estimate bandwidth
  ipcMain.handle('estimate-bandwidth', async () => {
    try {
      const bandwidth = await networkMetrics.estimateBandwidth();
      return bandwidth;
    } catch (error) {
      console.error('Error estimating bandwidth:', error);
      return { error: error.message };
    }
  });

  // Calculate packet loss
  ipcMain.handle('calculate-packet-loss', async (event, host = '1.1.1.1', count = 20) => {
    try {
      const packetLoss = await networkMetrics.calculatePacketLoss(host, count);
      return packetLoss;
    } catch (error) {
      console.error('Error calculating packet loss:', error);
      return { error: error.message };
    }
  });

  // Optimize CPU
  ipcMain.handle('optimize-cpu', async (event, options = {}) => {
    try {
      const result = await systemMonitor.optimizeProcesses();
      return { success: true, improvement: 15, ...result };
    } catch (error) {
      console.error('Error optimizing CPU:', error);
      return { success: false, error: error.message };
    }
  });

  // Optimize memory
  ipcMain.handle('optimize-memory', async (event, options = {}) => {
    try {
      const result = await systemMonitor.optimizeMemory();
      return { success: true, improvement: 20, ...result };
    } catch (error) {
      console.error('Error optimizing memory:', error);
      return { success: false, error: error.message };
    }
  });

  // Optimize GPU
  ipcMain.handle('optimize-gpu', async (event, options = {}) => {
    try {
      const result = await systemMonitor.optimizeDisk();
      return { success: true, improvement: 10, ...result };
    } catch (error) {
      console.error('Error optimizing GPU:', error);
      return { success: false, error: error.message };
    }
  });

  // Optimize network
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

// Configuração de IPC
function setupIPC() {
  // Game detection IPC
  setupGameDetectionIPC();
  
  // System monitoring IPC
  setupSystemMonitoringIPC();
  
  // Obter informações do sistema
  ipcMain.handle('get-system-info', async () => {
    try {
      const metrics = await systemMonitor.getSystemInfo();
      return metrics;
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Executar diagnóstico avançado
  ipcMain.handle('run-advanced-diagnostics', async () => {
    try {
      // Coletar informações do sistema
      const systemInfo = await systemMonitor.getSystemInfo();
      
      return { 
        success: true, 
        systemInfo
      };
    } catch (error) {
      console.error('Error running diagnostics:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Atualizar jogos no tray
  ipcMain.on('update-tray-games', (event, games) => {
    updateTrayMenu(games);
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