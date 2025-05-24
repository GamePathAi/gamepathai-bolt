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

// Configuração de IPC
function setupIPC() {
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