// electron/main.cjs - GamePath AI Professional v3.0
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
// Use require for native modules instead of import
const { Registry } = require('registry-js');
const { getSteamGames } = require('./src/lib/gameDetection/platforms/getSteamGames');
const { getEpicGames } = require('./src/lib/gameDetection/platforms/getEpicGames');
const { getXboxGames } = require('./src/lib/gameDetection/platforms/getXboxGames');
const { getOriginGames } = require('./src/lib/gameDetection/platforms/getOriginGames');
const { getBattleNetGames } = require('./src/lib/gameDetection/platforms/getBattleNetGames');
const { getGOGGames } = require('./src/lib/gameDetection/platforms/getGOGGames');
const { getUplayGames } = require('./src/lib/gameDetection/platforms/getUplayGames');
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

// Escaneamento de jogos
async function scanGames() {
  console.log('Scanning for games...');
  
  const now = Date.now();
  if (now - lastScanTime < SCAN_COOLDOWN && Object.keys(gameCache).length > 0) {
    console.log('Using cached games (scan cooldown active)');
    return gameCache;
  }
  
  try {
    // Executar todos os scanners em paralelo
    const [steamGames, epicGames, xboxGames, originGames, battleNetGames, gogGames, uplayGames] = await Promise.allSettled([
      getSteamGames(),
      getEpicGames(),
      getXboxGames(),
      getOriginGames(),
      getBattleNetGames(),
      getGOGGames(),
      getUplayGames()
    ]);
    
    // Processar resultados
    const allGames = [
      ...(steamGames.status === 'fulfilled' ? steamGames.value : []),
      ...(epicGames.status === 'fulfilled' ? epicGames.value : []),
      ...(xboxGames.status === 'fulfilled' ? xboxGames.value : []),
      ...(originGames.status === 'fulfilled' ? originGames.value : []),
      ...(battleNetGames.status === 'fulfilled' ? battleNetGames.value : []),
      ...(gogGames.status === 'fulfilled' ? gogGames.value : []),
      ...(uplayGames.status === 'fulfilled' ? uplayGames.value : [])
    ];
    
    console.log(`Found ${allGames.length} games`);
    
    // Atualizar cache
    gameCache = allGames;
    lastScanTime = now;
    
    // Salvar cache em disco
    try {
      const cachePath = path.join(CACHE_DIR, 'games-cache.json');
      fs.writeFileSync(cachePath, JSON.stringify(allGames, null, 2));
      console.log('Game cache saved to disk');
    } catch (error) {
      console.error('Error saving game cache:', error);
    }
    
    // Notificar renderer
    if (mainWindow) {
      mainWindow.webContents.send('games-detected', allGames);
    }
    
    return allGames;
  } catch (error) {
    console.error('Error scanning games:', error);
    return [];
  }
}

// Lançamento de jogo
async function launchGame(game, profile = 'balanced') {
  console.log(`Launching game: ${game.name} (${game.platform}) with profile ${profile}`);
  
  try {
    if (!game.executablePath) {
      throw new Error('Game executable path not found');
    }
    
    // Aplicar otimizações se solicitado
    if (profile !== 'none') {
      await fpsOptimizer.optimizeGame(game, profile);
    }
    
    // Lançar o jogo
    const { execFile } = require('child_process');
    execFile(game.executablePath, [], (error) => {
      if (error) {
        console.error(`Error launching game ${game.name}:`, error);
      } else {
        console.log(`Game ${game.name} launched successfully`);
        
        // Notificar renderer
        if (mainWindow) {
          mainWindow.webContents.send('game-launched', { game, profile });
        }
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Error launching game ${game.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Validação de arquivos de jogo
async function validateGameFiles(gameId) {
  console.log(`Validating game files for ${gameId}`);
  
  try {
    // Encontrar o jogo no cache
    const game = gameCache.find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found in cache');
    }
    
    // Verificar se o executável existe
    if (game.executablePath) {
      const exists = fs.existsSync(game.executablePath);
      if (!exists) {
        throw new Error('Game executable not found');
      }
    } else {
      throw new Error('Game executable path not defined');
    }
    
    // Verificar se o diretório de instalação existe
    if (game.installPath) {
      const exists = fs.existsSync(game.installPath);
      if (!exists) {
        throw new Error('Game installation directory not found');
      }
    } else {
      throw new Error('Game installation path not defined');
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error validating game files for ${gameId}:`, error);
    return { success: false, error: error.message };
  }
}

// Limpar cache
async function clearCache() {
  console.log('Clearing game cache...');
  
  try {
    gameCache = {};
    lastScanTime = 0;
    
    // Limpar arquivo de cache
    const cachePath = path.join(CACHE_DIR, 'games-cache.json');
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { success: false, error: error.message };
  }
}

// Configuração de IPC
function setupIPC() {
  // Escaneamento de jogos
  ipcMain.handle('scan-games-intelligent', async () => {
    try {
      const games = await scanGames();
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Escaneamento de jogos Xbox
  ipcMain.handle('scan-xbox-professional', async () => {
    try {
      const xboxGames = await getXboxGames();
      return { success: true, data: xboxGames };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Validação de arquivos de jogo
  ipcMain.handle('validate-game-files', async (event, { id }) => {
    return await validateGameFiles(id);
  });
  
  // Lançamento de jogo
  ipcMain.handle('launch-game-professional', async (event, game, profile) => {
    return await launchGame(game, profile);
  });
  
  // Lançamento de jogo (padrão)
  ipcMain.handle('launch-game', async (event, game, profile) => {
    return await launchGame(game, profile);
  });
  
  // Otimização de sistema para jogo
  ipcMain.handle('optimize-system-intelligent', async (event, game, profile) => {
    try {
      const result = await fpsOptimizer.optimizeGame(game, profile);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Obter perfis de otimização
  ipcMain.handle('get-optimization-profiles', async () => {
    try {
      const profiles = fpsOptimizer.getProfiles();
      return { success: true, data: profiles };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
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
      // Coletar informações de todas as plataformas
      const [steamGames, epicGames, xboxGames, originGames, battleNetGames, gogGames, uplayGames] = await Promise.allSettled([
        getSteamGames(),
        getEpicGames(),
        getXboxGames(),
        getOriginGames(),
        getBattleNetGames(),
        getGOGGames(),
        getUplayGames()
      ]);
      
      // Processar resultados
      const detailedResults = {
        Steam: steamGames.status === 'fulfilled' ? steamGames.value : [],
        Epic: epicGames.status === 'fulfilled' ? epicGames.value : [],
        Xbox: xboxGames.status === 'fulfilled' ? xboxGames.value : [],
        Origin: originGames.status === 'fulfilled' ? originGames.value : [],
        'Battle.net': battleNetGames.status === 'fulfilled' ? battleNetGames.value : [],
        GOG: gogGames.status === 'fulfilled' ? gogGames.value : [],
        'Ubisoft Connect': uplayGames.status === 'fulfilled' ? uplayGames.value : []
      };
      
      // Contar total de jogos
      const totalGames = Object.values(detailedResults).reduce((sum, games) => sum + games.length, 0);
      
      return { 
        success: true, 
        totalGames,
        detailedResults
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Limpar cache
  ipcMain.handle('clear-cache', async () => {
    return await clearCache();
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