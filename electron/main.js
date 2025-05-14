// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Importação segura para fs.promises
let fs;
try {
  fs = require('fs').promises;
} catch (e) {
  console.warn('fs.promises not available:', e.message);
  const fsBase = require('fs');
  fs = {
    readFile: (path, options) => {
      return new Promise((resolve, reject) => {
        fsBase.readFile(path, options, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
    },
    readdir: (path, options) => {
      return new Promise((resolve, reject) => {
        fsBase.readdir(path, options, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
    },
    stat: (path) => {
      return new Promise((resolve, reject) => {
        fsBase.stat(path, (err, stats) => {
          if (err) reject(err);
          else resolve(stats);
        });
      });
    }
  };
}

// Importações com tratamento de erros para módulos nativos opcionais
let Registry, si, Store;
try {
  Registry = require('registry-js').Registry;
} catch (e) {
  console.warn('registry-js not available:', e.message);
  Registry = { 
    getValue: () => null, 
    HKEY: { 
      LOCAL_MACHINE: 0,
      CURRENT_USER: 1
    } 
  };
}

try {
  si = require('systeminformation');
} catch (e) {
  console.warn('systeminformation not available:', e.message);
  si = { 
    cpu: async () => ({}),
    mem: async () => ({}), 
    graphics: async () => ({ controllers: [{}] }),
    osInfo: async () => ({})
  };
}

try {
  const StoreModule = require('electron-store');
  Store = StoreModule;
} catch (e) {
  console.warn('electron-store not available:', e.message);
  Store = class FakeStore { 
    constructor() { this.data = {}; }
    get(key) { return this.data[key]; }
    set(key, value) { this.data[key] = value; }
  };
}

// Inicializar o store
const store = new Store();

// Variável para a janela principal
let mainWindow;

// Verifica se um caminho existe com tratamento de erro
async function pathExists(pathToCheck) {
  try {
    await fs.stat(pathToCheck);
    return true;
  } catch (e) {
    return false;
  }
}

// Cria a janela principal
async function createWindow() {
  // Configurações da janela
  const windowConfig = {
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Não mostra até carregar completamente
  };
  
  // Verificar se o preload.js existe, se não, usar opções mais simples
  const preloadPath = path.join(__dirname, 'preload.js');
  try {
    await fs.stat(preloadPath);
  } catch (e) {
    console.warn('Preload script not found, disabling contextIsolation');
    windowConfig.webPreferences = {
      nodeIntegration: true,
      contextIsolation: false
    };
  }
  
  mainWindow = new BrowserWindow(windowConfig);

  // Definir ícone baseado na plataforma
  try {
    if (process.platform === 'win32') {
      const iconPath = path.join(__dirname, '../public/icons/icon.ico');
      if (await pathExists(iconPath)) {
        mainWindow.setIcon(iconPath);
      }
    } else if (process.platform === 'darwin') {
      const iconPath = path.join(__dirname, '../public/icons/icon.icns');
      if (await pathExists(iconPath)) {
        mainWindow.setIcon(iconPath);
      }
    } else {
      const iconPath = path.join(__dirname, '../public/icons/icon.png');
      if (await pathExists(iconPath)) {
        mainWindow.setIcon(iconPath);
      }
    }
  } catch (e) {
    console.warn('Failed to set window icon:', e.message);
  }

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    try {
      await mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } catch (e) {
      console.error('Failed to load development URL:', e.message);
      // Fallback to dist
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (await pathExists(indexPath)) {
        await mainWindow.loadFile(indexPath);
      } else {
        await mainWindow.loadFile(path.join(__dirname, 'error.html'));
      }
    }
  } else {
    try {
      // No modo de produção, carrega do diretório dist
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (await pathExists(indexPath)) {
        await mainWindow.loadFile(indexPath);
      } else {
        console.error('Production index.html not found');
        // Criar um conteúdo de erro básico
        await mainWindow.loadURL('data:text/html;charset=utf-8,<h1>Error: Application files not found</h1>');
      }
    } catch (e) {
      console.error('Failed to load production file:', e.message);
    }
  }

  // Mostra a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Inicializa o app quando estiver pronto
app.whenReady().then(createWindow).catch(err => {
  console.error('Failed to create window:', err);
  app.quit();
});

// Fecha a aplicação quando todas as janelas forem fechadas (exceto no macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// No macOS, recria a janela quando o ícone do dock for clicado
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(err => {
      console.error('Failed to recreate window:', err);
    });
  }
});

// Game detection functions
async function scanForGames() {
  try {
    const steamGames = getSteamGames();
    const epicGames = getEpicGames();
    const xboxGames = getXboxGames();

    return {
      steam: await steamGames,
      epic: await epicGames,
      xbox: await xboxGames
    };
  } catch (error) {
    console.error('Error scanning games:', error);
    return { steam: [], epic: [], xbox: [] };
  }
}

async function getSteamGames() {
  try {
    // Get Steam installation path from registry
    const steamPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Valve\\Steam',
      'InstallPath'
    );

    if (!steamPath) {
      console.log('Steam installation not found');
      return [];
    }

    // Read Steam library folders configuration
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    let libraryFoldersContent;

    try {
      libraryFoldersContent = await fs.readFile(libraryFoldersPath, 'utf8');
    } catch (error) {
      console.error('Error reading Steam library folders:', error);
      return [];
    }

    // Parse library folders VDF file
    const libraryPaths = [steamPath];
    const libraryRegex = /"path"\s+"([^"]+)"/g;
    let match;

    while ((match = libraryRegex.exec(libraryFoldersContent)) !== null) {
      libraryPaths.push(match[1].replace(/\\\\/g, '\\'));
    }

    const games = [];

    // Scan each library folder for installed games
    for (const libraryPath of libraryPaths) {
      const appsPath = path.join(libraryPath, 'steamapps');

      try {
        const files = await fs.readdir(appsPath);

        // Look for appmanifest files which contain game information
        const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));

        for (const manifest of manifests) {
          try {
            const manifestPath = path.join(appsPath, manifest);
            const manifestContent = await fs.readFile(manifestPath, 'utf8');

            // Parse game information from manifest
            const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
            const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
            const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);
            const sizeOnDiskMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(manifestContent);

            if (nameMatch && appIdMatch && installDirMatch) {
              const name = nameMatch[1];
              const appId = appIdMatch[1];
              const installDir = installDirMatch[1];
              const sizeInBytes = sizeOnDiskMatch ? parseInt(sizeOnDiskMatch[1]) : 0;
              const sizeInGB = Math.round(sizeInBytes / (1024 * 1024 * 1024));

              const gamePath = path.join(appsPath, 'common', installDir);
              const executablePath = path.join(gamePath, `${installDir}.exe`);

              games.push({
                id: appId,
                name,
                platform: 'Steam',
                installPath: gamePath,
                executablePath,
                size: sizeInGB,
                iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
              });
            }
          } catch (error) {
            console.error(`Error processing manifest ${manifest}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error reading library folder ${libraryPath}:`, error);
      }
    }

    return games;
  } catch (error) {
    console.error('Error scanning Steam games:', error);
    return [];
  }
}

async function getEpicGames() {
  try {
    if (!process.env.LOCALAPPDATA) {
      console.log('LOCALAPPDATA environment variable not set');
      return [];
    }

    // Get Epic Games installation path from registry
    const epicManifestPath = path.join(
      process.env.LOCALAPPDATA,
      'EpicGamesLauncher',
      'Saved',
      'Config',
      'Windows',
      'GameInstallation.json'
    );

    // Read the installation manifest
    let manifestContent;
    try {
      manifestContent = await fs.readFile(epicManifestPath, 'utf8');
    } catch (error) {
      console.error('Error reading Epic Games manifest:', error);
      return [];
    }

    const manifest = JSON.parse(manifestContent);
    const games = [];

    // Process each installed game
    for (const installation of manifest.InstallationList) {
      try {
        const manifestPath = path.join(
          installation.InstallLocation,
          '.egstore',
          `${installation.AppName}.manifest`
        );

        const gameManifestContent = await fs.readFile(manifestPath, 'utf8');
        const gameManifest = JSON.parse(gameManifestContent);

        // Get game size
        const stats = await fs.stat(installation.InstallLocation);
        const sizeInGB = Math.round(stats.size / (1024 * 1024 * 1024));

        // Find the main game executable
        const executablePath = path.join(
          installation.InstallLocation,
          installation.LaunchExecutable
        );

        games.push({
          id: installation.AppName,
          name: installation.DisplayName,
          platform: 'Epic',
          installPath: installation.InstallLocation,
          executablePath,
          size: sizeInGB,
          iconUrl: null // Epic doesn't provide a consistent CDN for game images
        });
      } catch (error) {
        console.error(`Error processing Epic game ${installation.DisplayName}:`, error);
      }
    }

    return games;
  } catch (error) {
    console.error('Error scanning Epic games:', error);
    return [];
  }
}

async function getXboxGames() {
  try {
    if (!process.env.ProgramFiles) {
      console.log('ProgramFiles environment variable not set');
      return [];
    }

    // Check Windows Gaming registry keys
    const gamingPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\Microsoft\\GamingServices',
      'GamingInstallPath'
    );

    if (!gamingPath) {
      console.log('Xbox Gaming Services not found');
      return [];
    }

    // Xbox games are typically installed in the WindowsApps directory
    const windowsAppsPath = path.join(process.env.ProgramFiles, 'WindowsApps');
    const games = [];

    try {
      const entries = await fs.readdir(windowsAppsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.includes('Microsoft.Xbox')) {
          try {
            const gamePath = path.join(windowsAppsPath, entry.name);
            const manifestPath = path.join(gamePath, 'AppxManifest.xml');

            // Read and parse the AppxManifest.xml file
            const manifestContent = await fs.readFile(manifestPath, 'utf8');

            // Extract game information from manifest
            const nameMatch = /<DisplayName>(.*?)<\/DisplayName>/.exec(manifestContent);
            const executableMatch = /<Application.*?Executable="(.*?)"/.exec(manifestContent);

            if (nameMatch && executableMatch) {
              const name = nameMatch[1];
              const executableName = executableMatch[1];

              // Get game size
              const stats = await fs.stat(gamePath);
              const sizeInGB = Math.round(stats.size / (1024 * 1024 * 1024));

              // Generate a unique ID from the directory name
              const id = entry.name.split('_')[0];

              games.push({
                id,
                name,
                platform: 'Xbox',
                installPath: gamePath,
                executablePath: path.join(gamePath, executableName),
                size: sizeInGB,
                iconUrl: null // Xbox games don't have a consistent CDN for images
              });
            }
          } catch (error) {
            console.error(`Error processing Xbox game ${entry.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error reading WindowsApps directory:', error);
    }

    return games;
  } catch (error) {
    console.error('Error scanning Xbox games:', error);
    return [];
  }
}

// System monitoring functions
async function getSystemInfo() {
  try {
    const cpu = await si.cpu();
    const mem = await si.mem();
    const gpu = await si.graphics();
    const os = await si.osInfo();

    return {
      cpu,
      memory: mem,
      gpu: gpu.controllers[0],
      os
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      cpu: {},
      memory: {},
      gpu: {},
      os: {}
    };
  }
}

// Game launching functions
async function launchGame(game) {
  try {
    switch (game.platform) {
      case 'Steam':
        return await launchSteamGame(game);
      case 'Epic':
        return await launchEpicGame(game);
      case 'Xbox':
        return await launchXboxGame(game);
      default:
        throw new Error(`Unsupported platform: ${game.platform}`);
    }
  } catch (error) {
    console.error(`Error launching game ${game.name}:`, error);
    throw error;
  }
}

async function launchSteamGame(game) {
  try {
    // Get Steam installation path
    const steamPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Valve\\Steam',
      'InstallPath'
    );

    if (!steamPath) {
      throw new Error('Steam installation not found');
    }

    // Launch game using Steam protocol
    const steamExe = path.join(steamPath, 'steam.exe');
    const process = spawn(steamExe, [`steam://rungameid/${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();
    return true;
  } catch (error) {
    console.error(`Error launching Steam game ${game.name}:`, error);
    throw error;
  }
}

async function launchEpicGame(game) {
  try {
    // Get Epic Games Launcher path
    const epicPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher',
      'AppPath'
    );

    if (!epicPath) {
      throw new Error('Epic Games Launcher installation not found');
    }

    // Launch game using Epic protocol
    const process = spawn(epicPath, [
      '-com.epicgames.launcher://apps/',
      game.id,
      '?action=launch',
      '&silent=true'
    ], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();
    return true;
  } catch (error) {
    console.error(`Error launching Epic game ${game.name}:`, error);
    throw error;
  }
}

async function launchXboxGame(game) {
  try {
    // Xbox games use the Microsoft Store protocol
    const process = spawn('explorer.exe', [`ms-xbox-game://${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();
    return true;
  } catch (error) {
    console.error(`Error launching Xbox game ${game.name}:`, error);
    throw error;
  }
}

// IPC handlers for communication with renderer process
ipcMain.handle('scan-games', async () => {
  try {
    return await scanForGames();
  } catch (error) {
    console.error('Error in scan-games handler:', error);
    return { steam: [], epic: [], xbox: [] };
  }
});

ipcMain.handle('get-system-info', async () => {
  try {
    return await getSystemInfo();
  } catch (error) {
    console.error('Error in get-system-info handler:', error);
    return { cpu: {}, memory: {}, gpu: {}, os: {} };
  }
});

ipcMain.handle('launch-game', async (event, game) => {
  try {
    const success = await launchGame(game);
    return { success };
  } catch (error) {
    console.error('Error in launch-game handler:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
});