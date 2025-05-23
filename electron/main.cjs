const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const os = require('os');
const { spawn } = require('child_process');

// Configuration of paths and directories
const CONFIG_DIR = path.join(os.homedir(), '.gamepath-ai');
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');

// Global variables
let mainWindow;
let tray;
let isQuitting = false;
let gameDetectors = {};

// Function to determine if we're in development mode
const isDev = () => process.env.ELECTRON_RUN === 'true';

// Function to get resource paths
const getResourcePath = (relativePath) => {
  // In development, resources are in the root directory
  // In production, resources are in resources/app or resources/app.asar
  const basePath = isDev() ? app.getAppPath() : path.dirname(app.getAppPath());
  return path.join(basePath, relativePath);
};

// Function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking if file exists (${filePath}):`, error);
    return false;
  }
};

// Function to find a file in multiple possible paths
const findFile = (possiblePaths) => {
  for (const filePath of possiblePaths) {
    if (fileExists(filePath)) {
      console.log(`File found: ${filePath}`);
      return filePath;
    }
  }
  console.error(`None of the paths contain the file: ${possiblePaths.join(', ')}`);
  return null;
};

// Registry with fallback to work even without the native module
let Registry;
try {
  Registry = require('registry-js').Registry;
  console.log('✓ registry-js module loaded successfully');
} catch (e) {
  console.warn('⚠ registry-js not available:', e.message);
  console.warn('  Using fallback implementation');
  
  // Fallback implementation for Registry
  Registry = { 
    getValue: (hkey, path, name) => {
      console.log(`[Registry Fallback] Attempt to read: ${hkey}\\${path}\\${name}`);
      // Default values for common Steam paths
      if (path === 'SOFTWARE\\Valve\\Steam' && name === 'SteamPath') {
        return 'C:\\Program Files (x86)\\Steam';
      }
      return null; 
    },
    enumerateValues: (hkey, path) => {
      console.log(`[Registry Fallback] Attempt to enumerate: ${hkey}\\${path}`);
      return []; 
    },
    HKEY: { 
      LOCAL_MACHINE: 0,
      CURRENT_USER: 1
    } 
  };
}

// Load system modules with fallbacks
const loadModuleWithFallback = (modulePath, fallback) => {
  try {
    // Try different paths for the module
    const possiblePaths = [
      path.join(__dirname, modulePath),
      path.join(app.getAppPath(), modulePath),
      path.join(path.dirname(app.getAppPath()), modulePath)
    ];
    
    const foundPath = findFile(possiblePaths);
    if (foundPath) {
      return require(foundPath);
    }
    
    console.warn(`⚠ Module ${modulePath} not found, using fallback`);
    return fallback;
  } catch (e) {
    console.warn(`⚠ Error loading ${modulePath}:`, e.message);
    console.warn('  Using fallback implementation');
    return fallback;
  }
};

// Paths to system modules
const systemMonitor = loadModuleWithFallback('electron/system-monitor.cjs', {
  getSystemInfo: async () => ({ cpu: {}, memory: {}, gpu: {} }),
  optimizeForGaming: async () => ({ success: true, optimizations: {} }),
  optimizeMemory: async () => ({ success: true, memoryFreed: 0 }),
  optimizeGPU: async () => ({ success: true })
});

const networkMetrics = loadModuleWithFallback('electron/network-metrics.cjs', {
  analyzeNetwork: async () => ({}),
  optimizeNetwork: async () => ({ success: true })
});

const fpsOptimizer = loadModuleWithFallback('electron/fps-optimizer.cjs', {
  optimizeGame: async () => ({ success: false, error: 'Module not available' })
});

const vpnManager = loadModuleWithFallback('electron/vpn-manager.cjs', {
  getServers: () => ([]),
  connect: async () => ({ success: false }),
  disconnect: async () => ({ success: false }),
  getStatus: () => ({ isConnected: false })
});

// Load game detection modules
const loadGameDetectors = () => {
  // Base paths to look for modules
  const basePaths = [
    path.join(__dirname, 'src', 'lib', 'gameDetection', 'platforms'),
    path.join(__dirname, 'src', 'lib'),
    path.join(app.getAppPath(), 'src', 'lib', 'gameDetection', 'platforms'),
    path.join(app.getAppPath(), 'src', 'lib')
  ];
  
  // Game detection functions with fallbacks
  const detectors = {
    steam: async () => [],
    epic: async () => [],
    xbox: async () => [],
    origin: async () => [],
    battlenet: async () => [],
    gog: async () => [],
    uplay: async () => []
  };
  
  // Try to load each detector
  for (const [name, fallback] of Object.entries(detectors)) {
    try {
      const moduleName = `get${name.charAt(0).toUpperCase() + name.slice(1)}Games`;
      
      // Look for the module in different paths
      let moduleFound = false;
      for (const basePath of basePaths) {
        const modulePath = path.join(basePath, `${moduleName}.js`);
        if (fileExists(modulePath)) {
          console.log(`✓ Game detector ${name} found: ${modulePath}`);
          try {
            const module = require(modulePath);
            detectors[name] = module[moduleName] || module.default || fallback;
            moduleFound = true;
            break;
          } catch (e) {
            console.warn(`⚠ Error loading detector ${name}:`, e.message);
          }
        }
      }
      
      if (!moduleFound) {
        console.warn(`⚠ Game detector ${name} not found, using fallback`);
      }
    } catch (e) {
      console.warn(`⚠ Error configuring detector ${name}:`, e.message);
    }
  }
  
  return detectors;
};

// Electron configuration
const createWindow = async () => {
  console.log('Creating main window...');
  console.log('__dirname:', __dirname);
  console.log('app.getAppPath():', app.getAppPath());
  
  // Set up data directory
  await setupDataDirectory();
  
  // Load game detectors
  gameDetectors = loadGameDetectors();
  
  // Determine paths based on environment
  const preloadPath = findFile([
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, 'electron', 'preload.cjs'),
    path.join(app.getAppPath(), 'electron', 'preload.cjs'),
    path.join(app.getAppPath(), 'preload.cjs')
  ]);
  
  if (!preloadPath) {
    console.error('❌ CRITICAL ERROR: Preload script not found!');
    app.quit();
    return;
  }
  
  // Determine icon path
  const iconPath = findFile([
    path.join(__dirname, 'public', 'icons', 'icon.ico'),
    path.join(app.getAppPath(), 'public', 'icons', 'icon.ico'),
    path.join(path.dirname(app.getAppPath()), 'public', 'icons', 'icon.ico')
  ]) || '';
  
  console.log('Preload path:', preloadPath);
  console.log('Icon path:', iconPath);
  
  // Create main window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: iconPath,
    show: false, // Don't show until ready
    backgroundColor: '#0d1117'
  });

  // Load content
  if (isDev()) {
    // Development mode - connect to Vite server
    console.log('Development mode - connecting to Vite server...');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from dist directory
    console.log('Production mode - loading from dist directory...');
    
    // Find the HTML file
    const htmlPath = findFile([
      path.join(__dirname, 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html'),
      path.join(path.dirname(app.getAppPath()), 'dist', 'index.html')
    ]);
    
    if (htmlPath) {
      console.log('Loading HTML from:', htmlPath);
      mainWindow.loadFile(htmlPath);
    } else {
      console.error('❌ CRITICAL ERROR: HTML file not found!');
      // Try to load a blank page with error message
      mainWindow.loadURL('data:text/html;charset=utf-8,<html><body style="background:#0d1117;color:white;font-family:sans-serif;padding:20px;"><h1>Error loading application</h1><p>Could not find the necessary files.</p></body></html>');
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to display');
    mainWindow.show();
  });

  // Handle window closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Set up the tray
  setupTray();
  
  // Register IPC handlers
  registerIpcHandlers();
  
  // Start scanning for games in the background
  setTimeout(async () => {
    console.log('Starting background game scan...');
    const games = await getAllGames();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('games-detected', games);
    }
    updateTrayGames(games);
  }, 3000);
};

// Set up data directory
async function setupDataDirectory() {
  try {
    await fsPromises.mkdir(CONFIG_DIR, { recursive: true });
    await fsPromises.mkdir(LOGS_DIR, { recursive: true });
    console.log(`Configuration directories created: ${CONFIG_DIR}, ${LOGS_DIR}`);
  } catch (error) {
    console.error('Error setting up data directories:', error);
  }
}

// Set up the tray
function setupTray() {
  try {
    console.log('Setting up tray...');
    
    // Try to load tray icon using various possible paths
    const trayIconPaths = [
      path.join(__dirname, 'public', 'icons', 'tray-icon.png'),
      path.join(app.getAppPath(), 'public', 'icons', 'tray-icon.png'),
      path.join(path.dirname(app.getAppPath()), 'public', 'icons', 'tray-icon.png'),
      path.join(__dirname, 'public', 'icons', 'icon.ico'),
      path.join(app.getAppPath(), 'public', 'icons', 'icon.ico'),
      path.join(path.dirname(app.getAppPath()), 'public', 'icons', 'icon.ico')
    ];
    
    const trayIconPath = findFile(trayIconPaths);
    
    if (!trayIconPath) {
      console.error('❌ No icon found for the tray!');
      return;
    }
    
    console.log('Using tray icon:', trayIconPath);
    
    // Create tray icon
    const trayIcon = nativeImage.createFromPath(trayIconPath);
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    tray.setToolTip('GamePath AI');
    
    // Initial context menu
    updateTrayMenu([]);
    
    // Tray click event
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
        }
      }
    });
    
    console.log('Tray set up successfully');
  } catch (error) {
    console.error('Error setting up tray:', error);
  }
}

// Update tray menu
function updateTrayMenu(games = []) {
  if (!tray) return;
  
  try {
    console.log(`Updating tray menu with ${games.length} games`);
    
    // Limit to 10 games in the menu
    const displayGames = games.slice(0, 10);
    
    // Create menu items for games
    const gameMenuItems = displayGames.map(game => {
      return {
        label: game.name,
        submenu: [
          {
            label: 'Launch',
            click: () => {
              if (mainWindow) {
                mainWindow.webContents.send('launch-game-from-tray', game.id);
              } else {
                launchGameInternal(game);
              }
            }
          },
          {
            label: 'Optimize',
            click: () => {
              if (mainWindow) {
                mainWindow.webContents.send('optimize-game-from-tray', game.id);
              } else {
                optimizeGameInternal(game);
              }
            }
          }
        ]
      };
    });
    
    // Complete menu
    const contextMenu = Menu.buildFromTemplate([
      { label: 'GamePath AI', enabled: false },
      { type: 'separator' },
      ...gameMenuItems,
      { type: 'separator' },
      {
        label: 'Scan for Games',
        click: async () => {
          if (mainWindow) {
            mainWindow.webContents.send('scan-games-from-tray');
          } else {
            const games = await getAllGames();
            updateTrayGames(games);
          }
        }
      },
      {
        label: 'Optimizations',
        submenu: [
          {
            label: 'Optimize Memory',
            click: () => {
              if (mainWindow) {
                mainWindow.webContents.send('optimize-memory-from-tray');
              } else {
                optimizeMemoryInternal();
              }
            }
          },
          {
            label: 'Optimize CPU',
            click: () => {
              if (mainWindow) {
                mainWindow.webContents.send('optimize-cpu-from-tray');
              } else {
                optimizeCPUInternal();
              }
            }
          },
          {
            label: 'Optimize Network',
            click: () => {
              if (mainWindow) {
                mainWindow.webContents.send('optimize-network-from-tray');
              } else {
                optimizeNetworkInternal();
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
          } else {
            createWindow();
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
  } catch (error) {
    console.error('Error updating tray menu:', error);
  }
}

// Update games in tray
function updateTrayGames(games) {
  if (!Array.isArray(games)) {
    console.warn('updateTrayGames: games is not a valid array', games);
    games = [];
  }
  
  console.log(`Updating tray with ${games.length} games`);
  updateTrayMenu(games);
  return games;
}

// Register IPC handlers
function registerIpcHandlers() {
  console.log('Registering IPC handlers...');
  
  // Game detection handlers
  ipcMain.handle('scan-games', async () => {
    console.log('Received request to scan games');
    try {
      const games = await getAllGames();
      console.log(`Found ${games.length} games`);
      
      // Notify the interface about the found games
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('games-detected', games);
      }
      
      // Update the tray
      updateTrayGames(games);
      
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Error scanning games:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Unknown error scanning games']
      };
    }
  });
  
  // Platform-specific scanning
  ipcMain.handle('scan-steam', async () => {
    console.log('Received request to scan Steam games');
    try {
      const games = await getSteamGamesInternal();
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Error scanning Steam games:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Unknown error scanning Steam games']
      };
    }
  });
  
  // Game management handlers
  ipcMain.handle('launch-game', async (event, game) => {
    console.log(`Received request to launch game: ${game.name}`);
    try {
      return await launchGameInternal(game);
    } catch (error) {
      console.error(`Error launching game ${game.name}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error launching game'
      };
    }
  });
  
  // Handler for optimizing games
  ipcMain.handle('optimize-game', async (event, game, profile = 'balanced', settings) => {
    console.log(`Received request to optimize game: ${game.name} with profile ${profile}`);
    try {
      if (!fpsOptimizer || !fpsOptimizer.optimizeGame) {
        console.warn('Optimization module not available');
        return {
          success: false,
          error: 'Optimization module not available'
        };
      }
      
      console.log(`Optimizing game: ${game.name}`);
      const optimizationResult = await fpsOptimizer.optimizeGame(game, profile, settings);
      
      return optimizationResult;
    } catch (error) {
      console.error(`Error optimizing game ${game.name}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error optimizing game'
      };
    }
  });
  
  // Handler for validating game files
  ipcMain.handle('validate-game-files', async (event, gameId) => {
    console.log(`Received request to validate game files: ${gameId}`);
    try {
      // Find the game by ID
      const allGames = await getAllGames();
      const gameToValidate = allGames.find(game => game.id === gameId);
      
      if (!gameToValidate) {
        console.warn(`Game with ID ${gameId} not found`);
        return false;
      }
      
      // Check if the executable exists
      if (!gameToValidate.executablePath) {
        console.warn(`Executable not found for game ${gameId}`);
        return false;
      }
      
      // Check if the executable path exists
      try {
        await fsPromises.access(gameToValidate.executablePath);
        console.log(`Executable file for game ${gameId} validated successfully`);
        return true;
      } catch (error) {
        console.error(`Executable file for game ${gameId} not found:`, error);
        return false;
      }
    } catch (error) {
      console.error(`Error validating game files ${gameId}:`, error);
      return false;
    }
  });
  
  // Tray handlers
  ipcMain.handle('update-tray-games', async (event, games) => {
    console.log(`Received request to update games in tray: ${games?.length || 0} games`);
    return updateTrayGames(games);
  });
  
  ipcMain.handle('get-games-for-tray', async () => {
    console.log('Received request to get games for the tray');
    try {
      const games = await getAllGames();
      console.log(`Returning ${games.length} games for the tray`);
      return games;
    } catch (error) {
      console.error('Error getting games for the tray:', error);
      return [];
    }
  });
  
  // System info handlers
  ipcMain.handle('get-system-info', async () => {
    console.log('Received request to get system information');
    try {
      return await systemMonitor.getSystemInfo();
    } catch (error) {
      console.error('Error getting system information:', error);
      return {
        error: error.message || 'Unknown error getting system information'
      };
    }
  });
  
  // System optimization handlers
  ipcMain.handle('optimize-cpu', async (event, options) => {
    console.log('Received request to optimize CPU');
    try {
      return await optimizeCPUInternal(options);
    } catch (error) {
      console.error('Error optimizing CPU:', error);
      return {
        success: false,
        error: error.message || 'Unknown error optimizing CPU'
      };
    }
  });
  
  ipcMain.handle('optimize-memory', async (event, options) => {
    console.log('Received request to optimize memory');
    try {
      return await optimizeMemoryInternal(options);
    } catch (error) {
      console.error('Error optimizing memory:', error);
      return {
        success: false,
        error: error.message || 'Unknown error optimizing memory'
      };
    }
  });
  
  ipcMain.handle('optimize-gpu', async (event, options) => {
    console.log('Received request to optimize GPU');
    try {
      return await optimizeGPUInternal(options);
    } catch (error) {
      console.error('Error optimizing GPU:', error);
      return {
        success: false,
        error: error.message || 'Unknown error optimizing GPU'
      };
    }
  });
  
  ipcMain.handle('optimize-network', async (event, options) => {
    console.log('Received request to optimize network');
    try {
      return await optimizeNetworkInternal(options);
    } catch (error) {
      console.error('Error optimizing network:', error);
      return {
        success: false,
        error: error.message || 'Unknown error optimizing network'
      };
    }
  });
  
  // Network handlers
  ipcMain.handle('measure-network-performance', async () => {
    console.log('Received request to measure network performance');
    try {
      return await networkMetrics.analyzeNetwork();
    } catch (error) {
      console.error('Error measuring network performance:', error);
      return {
        error: error.message || 'Unknown error measuring network performance'
      };
    }
  });
  
  ipcMain.handle('get-available-routes', async () => {
    console.log('Received request to get available routes');
    try {
      // Simulation - in a real app, this would be implemented
      return [
        {
          id: 'auto',
          name: 'Auto (Best Location)',
          latency: 24,
          bandwidth: 150,
          load: 0.3,
          reliability: 99.9
        },
        {
          id: 'us-east',
          name: 'US East',
          latency: 42,
          bandwidth: 120,
          load: 0.5,
          reliability: 98.5
        },
        {
          id: 'eu-west',
          name: 'Europe West',
          latency: 28,
          bandwidth: 140,
          load: 0.4,
          reliability: 99.4
        }
      ];
    } catch (error) {
      console.error('Error getting available routes:', error);
      return [];
    }
  });
  
  // VPN handlers
  ipcMain.handle('get-vpn-servers', async () => {
    console.log('Received request to get VPN servers');
    try {
      return vpnManager.getServers();
    } catch (error) {
      console.error('Error getting VPN servers:', error);
      return [];
    }
  });
  
  ipcMain.handle('connect-to-vpn', async (event, server) => {
    console.log(`Received request to connect to VPN: ${server.name}`);
    try {
      return await vpnManager.connect(server);
    } catch (error) {
      console.error('Error connecting to VPN:', error);
      return {
        success: false,
        error: error.message || 'Unknown error connecting to VPN'
      };
    }
  });
  
  ipcMain.handle('disconnect-from-vpn', async () => {
    console.log('Received request to disconnect from VPN');
    try {
      return await vpnManager.disconnect();
    } catch (error) {
      console.error('Error disconnecting from VPN:', error);
      return {
        success: false,
        error: error.message || 'Unknown error disconnecting from VPN'
      };
    }
  });
  
  ipcMain.handle('get-vpn-status', async () => {
    console.log('Received request to get VPN status');
    try {
      return vpnManager.getStatus();
    } catch (error) {
      console.error('Error getting VPN status:', error);
      return {
        isConnected: false,
        error: error.message || 'Unknown error getting VPN status'
      };
    }
  });
  
  // Notification handler
  ipcMain.handle('show-notification', async (event, options) => {
    console.log('Received request to show notification');
    try {
      const notification = new Notification({
        title: options.title || 'GamePath AI',
        body: options.body || '',
        icon: options.icon || findFile([
          path.join(__dirname, 'public', 'icons', 'icon.ico'),
          path.join(app.getAppPath(), 'public', 'icons', 'icon.ico'),
          path.join(path.dirname(app.getAppPath()), 'public', 'icons', 'icon.ico')
        ])
      });
      
      notification.show();
      
      return { success: true };
    } catch (error) {
      console.error('Error showing notification:', error);
      return {
        success: false,
        error: error.message || 'Unknown error showing notification'
      };
    }
  });
  
  // Diagnostic handler
  ipcMain.handle('list-detected-games', async () => {
    console.log('Received request to list detected games');
    try {
      const platforms = ['steam', 'epic', 'xbox', 'origin', 'battlenet', 'gog', 'uplay', 'standalone'];
      const detailedResults = {};
      let totalGames = 0;
      
      for (const platform of platforms) {
        try {
          if (gameDetectors[platform]) {
            const games = await gameDetectors[platform]();
            detailedResults[platform] = games;
            totalGames += games.length;
          } else {
            detailedResults[platform] = [];
          }
        } catch (error) {
          console.error(`Error detecting games from platform ${platform}:`, error);
          detailedResults[platform] = [];
        }
      }
      
      return {
        totalGames,
        detailedResults
      };
    } catch (error) {
      console.error('Error listing detected games:', error);
      return {
        totalGames: 0,
        detailedResults: {},
        error: error.message || 'Unknown error listing games'
      };
    }
  });
  
  console.log('IPC handlers registered successfully');
}

// Function to get all games from all platforms
async function getAllGames() {
  try {
    console.log('Getting games from all platforms...');
    
    // Initialize with Steam and standalone games
    const steamGames = await getSteamGamesInternal();
    const standaloneGames = await getStandaloneGamesInternal();
    
    // Try to get games from other platforms
    const otherGames = [];
    const platforms = ['epic', 'xbox', 'origin', 'battlenet', 'gog', 'uplay'];
    
    for (const platform of platforms) {
      if (gameDetectors[platform]) {
        try {
          console.log(`Scanning platform: ${platform}`);
          const games = await gameDetectors[platform]();
          otherGames.push(...games);
        } catch (error) {
          console.error(`Error scanning platform ${platform}:`, error);
        }
      }
    }
    
    // Combine results and remove duplicates
    const allGames = [...steamGames, ...standaloneGames, ...otherGames];
    console.log(`Total games found (before filtering): ${allGames.length}`);
    
    // Filter duplicate games (same name and platform)
    const uniqueGames = [];
    const gameKeys = new Set();
    
    for (const game of allGames) {
      const key = `${game.name}|${game.platform}`.toLowerCase();
      if (!gameKeys.has(key)) {
        gameKeys.add(key);
        uniqueGames.push(game);
      }
    }
    
    console.log(`Total unique games: ${uniqueGames.length}`);
    return uniqueGames;
  } catch (error) {
    console.error('Error getting all games:', error);
    return [];
  }
}

// Steam games detection
async function getSteamGamesInternal() {
  console.log('=== Steam games scanning started ===');
  try {
    // Try to get the Steam path from registry
    let steamPath = null;
    
    // Try HKEY_CURRENT_USER first
    try {
      steamPath = Registry.getValue(
        Registry.HKEY.CURRENT_USER,
        'SOFTWARE\\Valve\\Steam',
        'SteamPath'
      );
    } catch (error) {
      console.warn('Error accessing registry for Steam (HKCU):', error);
    }
    
    // If not found, try HKEY_LOCAL_MACHINE
    if (!steamPath) {
      try {
        steamPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          'SOFTWARE\\WOW6432Node\\Valve\\Steam',
          'InstallPath'
        );
      } catch (error) {
        console.warn('Error accessing registry for Steam (HKLM):', error);
      }
    }
    
    // If still not found, try default paths
    if (!steamPath) {
      console.log('Steam installation not found in registry, trying default paths');
      const defaultPaths = [
        path.join(os.homedir(), 'Steam'),
        path.join(os.homedir(), '.steam', 'steam'),
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam',
        path.join(os.homedir(), 'Library', 'Application Support', 'Steam')
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          const stats = await fsPromises.stat(defaultPath);
          if (stats.isDirectory()) {
            steamPath = defaultPath;
            console.log(`Steam found at default path: ${steamPath}`);
            break;
          }
        } catch (err) {
          // Path doesn't exist, continue to next
        }
      }
    }

    if (!steamPath) {
      console.log('Steam installation not found');
      return [];
    }

    console.log('Steam installation found at:', steamPath);

    // Read Steam library configuration
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    let libraryFoldersContent;

    try {
      libraryFoldersContent = await fsPromises.readFile(libraryFoldersPath, 'utf8');
      console.log('Steam library configuration read successfully');
    } catch (error) {
      console.error('Error reading Steam libraries:', error);
      
      // Try alternative path for configuration file
      const altLibraryFoldersPath = path.join(steamPath, 'config', 'libraryfolders.vdf');
      try {
        libraryFoldersContent = await fsPromises.readFile(altLibraryFoldersPath, 'utf8');
        console.log('Steam library configuration read from alternative path');
      } catch (altError) {
        console.error('Error reading alternative Steam libraries:', altError);
        return [];
      }
    }

    // Parse Steam libraries
    const libraryPaths = [steamPath];
    const libraryRegex = /"path"\s+"([^"]+)"/g;
    let match;

    while ((match = libraryRegex.exec(libraryFoldersContent)) !== null) {
      libraryPaths.push(match[1].replace(/\\\\/g, '\\'));
    }

    // If no additional libraries found, try another format
    if (libraryPaths.length === 1) {
      const altLibraryRegex = /"([0-9]+)"\s+{[^}]*?"path"\s+"([^"]+)"/gs;
      let altMatch;
      
      while ((altMatch = altLibraryRegex.exec(libraryFoldersContent)) !== null) {
        libraryPaths.push(altMatch[2].replace(/\\\\/g, '\\'));
      }
    }

    console.log('Steam libraries found:', libraryPaths);

    const games = [];

    // Scan each library for installed games
    for (const libraryPath of libraryPaths) {
      const appsPath = path.join(libraryPath, 'steamapps');
      console.log('Scanning Steam library at:', appsPath);

      try {
        const files = await fsPromises.readdir(appsPath);

        // Look for appmanifest files that contain game information
        const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
        console.log(`Found ${manifests.length} game manifests in ${appsPath}`);

        for (const manifest of manifests) {
          try {
            const manifestPath = path.join(appsPath, manifest);
            const manifestContent = await fsPromises.readFile(manifestPath, 'utf8');

            // Extract game information from manifest
            const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
            const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
            const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);

            if (nameMatch && appIdMatch && installDirMatch) {
              const name = nameMatch[1];
              const appId = appIdMatch[1];
              const installDir = installDirMatch[1];

              const gamePath = path.join(appsPath, 'common', installDir);
              
              // Try to find the main executable
              let executablePath = '';
              try {
                const gameFiles = await fsPromises.readdir(gamePath);
                const exeFiles = gameFiles.filter(file => file.endsWith('.exe'));
                
                // Try to find the executable with the same name as the directory
                const mainExe = exeFiles.find(file => file.toLowerCase() === `${installDir.toLowerCase()}.exe`);
                if (mainExe) {
                  executablePath = path.join(gamePath, mainExe);
                } else if (exeFiles.length > 0) {
                  // Get the first executable found
                  executablePath = path.join(gamePath, exeFiles[0]);
                }
              } catch (error) {
                console.warn(`Could not scan executables for ${name}:`, error);
              }

              games.push({
                id: `steam-${appId}`,
                name,
                platform: 'Steam',
                installPath: gamePath,
                executablePath,
                process_name: executablePath ? path.basename(executablePath) : '',
                size: 0, // Unknown size for now
                last_played: new Date(), // Current date as fallback
                icon_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
              });
              
              console.log(`Steam game found: ${name} (${appId})`);
            }
          } catch (error) {
            console.error(`Error processing manifest ${manifest}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error reading library folder ${libraryPath}:`, error);
      }
    }

    console.log(`Scan complete. Found ${games.length} Steam games`);
    return games;
  } catch (error) {
    console.error('Error scanning Steam games:', error);
    return [];
  }
}

// Function to scan standalone games
async function getStandaloneGamesInternal() {
  console.log('=== Standalone games scanning started ===');
  try {
    const games = [];
    const commonGameDirs = [];
    
    // Add only directories that likely contain games
    if (process.platform === 'win32') {
      // Windows
      const drives = ['C:', 'D:', 'E:', 'F:'];
      for (const drive of drives) {
        try {
          await fsPromises.access(drive);
          commonGameDirs.push(
            path.join(drive, 'Games'),
            path.join(drive, 'SteamLibrary'), 
            path.join(drive, 'Program Files', 'Games'),
            path.join(drive, 'Program Files (x86)', 'Games')
          );
        } catch (err) {
          // Drive doesn't exist or not accessible
        }
      }
    } else if (process.platform === 'darwin') {
      // macOS
      commonGameDirs.push(
        path.join(os.homedir(), 'Games')
      );
    } else {
      // Linux
      commonGameDirs.push(
        path.join(os.homedir(), 'Games'),
        path.join(os.homedir(), '.local', 'share', 'games')
      );
    }
    
    console.log(`Checking specific game directories: ${commonGameDirs.join(', ')}`);
    
    // List of common programs that are NOT games to filter out
    const nonGameKeywords = [
      'windows', 'microsoft', 'system', 'update', 'office', 'adobe', 
      'chrome', 'firefox', 'explorer', 'edge', 'defender', 
      'installer', 'setup', 'config', 'git', 'runtime', 'framework',
      'driver', 'utility', 'monitor', 'tool', 'health', 'support',
      'antivirus', 'security', 'browser', 'mail', 'photo', 'picture',
      'media', 'viewer', 'player', 'calculator', 'notepad', 'paint',
      'sdk', 'visual studio', 'code', 'webview', 'store', 'update'
    ];
    
    // Improve detection filter with common game names
    const gameSubstringHints = [
      'game', 'play', 'steam', 'epic', 'battle', 'uplay', 'origin', 
      'gog', 'bethesda', 'rockstar', 'xbox', 'warfare', 'craft', 
      'adventure', 'quest', 'rpg', 'shooter', 'racing', 'sport',
      'tactical', 'strategy', 'simulation', 'arcade', 'action'
    ];
    
    // Scan each directory for folders that might contain games
    for (const dir of commonGameDirs) {
      try {
        await fsPromises.access(dir);
        console.log(`Scanning directory: ${dir}`);
        
        // Read directory
        const items = await fsPromises.readdir(dir, { withFileTypes: true });
        
        // Filter directories (potential games)
        const subDirs = items.filter(item => item.isDirectory());
        
        for (const subDir of subDirs) {
          const gamePath = path.join(dir, subDir.name);
          const dirNameLower = subDir.name.toLowerCase();
          
          // Check if directory name matches programs that are NOT games
          const isLikelyNonGame = nonGameKeywords.some(keyword => 
            dirNameLower.includes(keyword.toLowerCase())
          );
          
          // Check if directory name contains common game keywords
          const containsGameHint = gameSubstringHints.some(hint => 
            dirNameLower.includes(hint.toLowerCase())
          );
          
          // Skip directories that are likely not games, unless they have game hints
          if (isLikelyNonGame && !containsGameHint) {
            continue;
          }
          
          // Check if there are executables in this directory
          try {
            const gameFiles = await fsPromises.readdir(gamePath);
            const exeFiles = gameFiles.filter(file => 
              file.endsWith('.exe') && 
              !file.includes('unins') && 
              !file.includes('setup') &&
              !file.includes('launcher') &&
              !file.includes('update') &&
              !file.includes('config') &&
              !file.includes('helper')
            );
            
            // Check size - games are usually larger than 50MB
            if (exeFiles.length > 0) {
              try {
                const stats = await fsPromises.stat(gamePath);
                const folderSizeMB = stats.size / (1024 * 1024);
                
                // Skip directories too small to be games
                if (folderSizeMB < 50 && !containsGameHint) {
                  continue;
                }
              } catch (err) {
                // Error checking size, continue anyway
              }
              
              // This directory likely contains a game
              const gameName = subDir.name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
              
              // Choose the main executable, prioritizing those that have the game name
              let mainExe = exeFiles.find(exe => exe.toLowerCase().includes(dirNameLower)) || exeFiles[0];
              const executablePath = path.join(gamePath, mainExe);
              
              console.log(`Standalone: Game "${gameName}"`);
              console.log(`  - Path: ${gamePath}`);
              console.log(`  - Executable: ${executablePath}`);
              
              games.push({
                id: `standalone-${Buffer.from(gamePath).toString('base64')}`,
                name: gameName,
                platform: 'Standalone',
                installPath: gamePath,
                executablePath,
                process_name: mainExe,
                size: folderSizeMB || 0,
                icon_url: undefined,
                last_played: undefined
              });
              
              console.log(`Standalone game found: ${gameName} in ${gamePath}`);
            }
          } catch (err) {
            // Could not read files in this directory
          }
        }
      } catch (err) {
        // Directory doesn't exist or not accessible
      }
    }
    
    console.log(`Scan complete. Found ${games.length} standalone games`);
    return games;
  } catch (error) {
    console.error('Error scanning standalone games:', error);
    return [];
  }
}

// Function to launch a game
async function launchGameInternal(game) {
  console.log(`Launching game: ${game.name}`);
  
  try {
    if (!game.executablePath) {
      throw new Error('Executable path not found');
    }
    
    // Check if the executable exists
    try {
      await fsPromises.access(game.executablePath);
    } catch (error) {
      throw new Error(`Executable not found: ${game.executablePath}`);
    }
    
    // Launch the game
    const child = spawn(game.executablePath, [], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(game.executablePath)
    });
    
    // Detach the process so it continues running independently
    child.unref();
    
    console.log(`Game ${game.name} launched successfully`);
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error launching game ${game.name}:`, error);
    throw error;
  }
}

// Function to optimize a game
async function optimizeGameInternal(game, profile = 'balanced') {
  console.log(`Optimizing game: ${game.name} with profile ${profile}`);
  
  try {
    if (!fpsOptimizer || !fpsOptimizer.optimizeGame) {
      throw new Error('Optimization module not available');
    }
    
    const result = await fpsOptimizer.optimizeGame(game, profile);
    console.log(`Game ${game.name} optimized successfully:`, result);
    
    return result;
  } catch (error) {
    console.error(`Error optimizing game ${game.name}:`, error);
    throw error;
  }
}

// System optimization functions
async function optimizeCPUInternal(options = {}) {
  console.log('Optimizing CPU...');
  
  try {
    // Simulation - in a real app, this would be implemented
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      improvement: 15,
      actions: [
        'Adjusted process priorities',
        'Optimized thread allocation',
        'Disabled background services'
      ]
    };
  } catch (error) {
    console.error('Error optimizing CPU:', error);
    throw error;
  }
}

async function optimizeMemoryInternal(options = {}) {
  console.log('Optimizing memory...');
  
  try {
    // Simulation - in a real app, this would be implemented
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      improvement: 20,
      actions: [
        'Cleared memory cache',
        'Optimized page file',
        'Released unused memory'
      ]
    };
  } catch (error) {
    console.error('Error optimizing memory:', error);
    throw error;
  }
}

async function optimizeGPUInternal(options = {}) {
  console.log('Optimizing GPU...');
  
  try {
    // Simulation - in a real app, this would be implemented
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      improvement: 10,
      actions: [
        'Set power mode to Performance',
        'Optimized shader cache',
        'Adjusted rendering settings'
      ]
    };
  } catch (error) {
    console.error('Error optimizing GPU:', error);
    throw error;
  }
}

async function optimizeNetworkInternal(options = {}) {
  console.log('Optimizing network...');
  
  try {
    // Simulation - in a real app, this would be implemented
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      improvement: 25,
      actions: [
        'Optimized network routes',
        'Adjusted TCP settings',
        'Prioritized game traffic'
      ]
    };
  } catch (error) {
    console.error('Error optimizing network:', error);
    throw error;
  }
}

// App initialization
app.whenReady().then(() => {
  console.log('Application ready to initialize');
  console.log('Electron version:', process.versions.electron);
  console.log('Chrome version:', process.versions.chrome);
  console.log('Node.js version:', process.versions.node);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Application directory:', app.getAppPath());
  console.log('User data directory:', app.getPath('userData'));
  
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('Another instance of the application is already running. Exiting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}