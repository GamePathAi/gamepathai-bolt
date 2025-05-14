// electron/main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Log para diagnóstico inicial
console.log('Starting GamePath AI');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Node version:', process.versions.node);
console.log('Electron version:', process.versions.electron);

// Importação segura para fs.promises
let fs;
try {
  fs = require('fs').promises;
  console.log('Successfully loaded fs.promises');
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
  console.log('Successfully loaded registry-js');
} catch (e) {
  console.warn('registry-js not available:', e.message);
  console.warn('Using registry-js fallback implementation');
  Registry = { 
    getValue: (hkey, path, name) => {
      console.log(`[Registry Fallback] Attempted to read: ${hkey}\\${path}\\${name}`);
      return null; 
    },
    HKEY: { 
      LOCAL_MACHINE: 0,
      CURRENT_USER: 1
    } 
  };
}

try {
  si = require('systeminformation');
  console.log('Successfully loaded systeminformation');
} catch (e) {
  console.warn('systeminformation not available:', e.message);
  si = { 
    cpu: async () => ({ brand: 'Unknown CPU', manufacturer: 'Unknown', speed: 0, cores: 0 }),
    mem: async () => ({ total: 0, free: 0, used: 0 }), 
    graphics: async () => ({ controllers: [{ model: 'Unknown GPU', vram: 0 }] }),
    osInfo: async () => ({ platform: process.platform, distro: 'Unknown', release: 'Unknown' })
  };
}

try {
  const StoreModule = require('electron-store');
  Store = StoreModule;
  console.log('Successfully loaded electron-store');
} catch (e) {
  console.warn('electron-store not available:', e.message);
  Store = class FakeStore { 
    constructor() { 
      this.data = {}; 
      console.log('Using in-memory store fallback');
    }
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

// Função para encontrar o index.html em vários locais possíveis
async function findIndexHtml() {
  // Lista de caminhos possíveis para procurar o index.html, em ordem de prioridade
  const possiblePaths = [
    path.join(__dirname, '../dist/index.html'),
    path.join(process.cwd(), 'dist/index.html'),
    path.join(__dirname, 'dist/index.html'),
    path.join(__dirname, '../public/index.html'),
    path.join(process.cwd(), 'public/index.html'),
    path.join(app.getAppPath(), 'dist/index.html')
  ];

  console.log('Searching for index.html in these locations:');
  for (const p of possiblePaths) {
    console.log(`- ${p}`);
    if (await pathExists(p)) {
      console.log(`Found index.html at: ${p}`);
      return p;
    }
  }

  console.error('Could not find index.html in any location');
  return null;
}

// Cria a janela principal
async function createWindow() {
  console.log('Creating main window...');
  
  // Configurações da janela
  const windowConfig = {
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    show: false // Não mostra até carregar completamente
  };
  
  // Verificar se o preload.cjs existe, se não, usar opções mais simples
  const preloadPath = path.join(__dirname, 'preload.cjs');
  try {
    await fs.stat(preloadPath);
    console.log('Found preload script at:', preloadPath);
  } catch (e) {
    console.warn('Preload script not found, disabling contextIsolation:', e.message);
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
        console.log('Set window icon to:', iconPath);
      } else {
        console.warn('Icon not found at:', iconPath);
      }
    } else if (process.platform === 'darwin') {
      const iconPath = path.join(__dirname, '../public/icons/icon.icns');
      if (await pathExists(iconPath)) {
        mainWindow.setIcon(iconPath);
        console.log('Set window icon to:', iconPath);
      } else {
        console.warn('Icon not found at:', iconPath);
      }
    } else {
      const iconPath = path.join(__dirname, '../public/icons/icon.png');
      if (await pathExists(iconPath)) {
        mainWindow.setIcon(iconPath);
        console.log('Set window icon to:', iconPath);
      } else {
        console.warn('Icon not found at:', iconPath);
      }
    }
  } catch (e) {
    console.warn('Failed to set window icon:', e.message);
  }

  // Em modo de desenvolvimento, carrega do servidor de desenvolvimento Vite
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    try {
      await mainWindow.loadURL('http://localhost:5173');
      console.log('Successfully loaded from development server');
      mainWindow.webContents.openDevTools();
    } catch (e) {
      console.error('Failed to load development URL:', e.message);
      console.log('Falling back to dist/index.html');
      
      // Tenta encontrar o index.html
      const indexPath = await findIndexHtml();
      
      if (indexPath) {
        await mainWindow.loadFile(indexPath);
        console.log('Loaded index.html from:', indexPath);
      } else {
        // Tenta usar um arquivo de erro personalizado
        const errorHtmlPath = path.join(__dirname, 'error.html');
        if (await pathExists(errorHtmlPath)) {
          await mainWindow.loadFile(errorHtmlPath);
          console.log('Loaded error page from:', errorHtmlPath);
        } else {
          // Cria um conteúdo de erro HTML na hora
          await mainWindow.loadURL(`data:text/html;charset=utf-8,
            <html>
              <head>
                <title>GamePath AI - Error</title>
                <style>
                  body { font-family: Arial, sans-serif; background-color: #1e1e1e; color: #ffffff; text-align: center; padding: 50px; }
                  h1 { color: #ff5555; }
                  .container { max-width: 800px; margin: 0 auto; background-color: #2d2d2d; border-radius: 8px; padding: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Application Error</h1>
                  <p>GamePath AI could not start properly because the required files were not found.</p>
                  <div style="background-color: #3d3d3d; padding: 15px; border-radius: 5px; font-family: monospace; margin: 20px 0;">
                    Error: Could not locate the application files
                  </div>
                  <div style="text-align: left; margin-top: 30px;">
                    <h2>Possible solutions:</h2>
                    <ol>
                      <li>Make sure you have built the application with <code>npm run build</code></li>
                      <li>Check if the <code>dist</code> folder exists and contains an <code>index.html</code> file</li>
                      <li>Try reinstalling the application</li>
                      <li>Run the application in development mode with <code>npm run dev</code></li>
                    </ol>
                  </div>
                </div>
              </body>
            </html>
          `);
          console.log('Loaded inline error HTML');
        }
      }
    }
  } else {
    console.log('Running in production mode');
    try {
      // No modo de produção, tenta encontrar e carregar o index.html
      const indexPath = await findIndexHtml();
      
      if (indexPath) {
        await mainWindow.loadFile(indexPath);
        console.log('Successfully loaded index.html from:', indexPath);
      } else {
        console.error('No index.html found in production mode');
        
        // Tenta usar um arquivo de erro personalizado
        const errorHtmlPath = path.join(__dirname, 'error.html');
        if (await pathExists(errorHtmlPath)) {
          await mainWindow.loadFile(errorHtmlPath);
          console.log('Loaded error page from:', errorHtmlPath);
        } else {
          // Cria um conteúdo de erro HTML na hora
          await mainWindow.loadURL('data:text/html;charset=utf-8,<h1>Error: Application files not found</h1><p>Please ensure the application was built correctly with <code>npm run build</code>.</p>');
          console.log('Loaded inline error HTML');
        }
      }
    } catch (e) {
      console.error('Failed to load production file:', e.message);
      await mainWindow.loadURL('data:text/html;charset=utf-8,<h1>Error: Application failed to start</h1><p>' + e.message + '</p>');
    }
  }

  // Mostra a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    console.log('Window is ready to show');
    mainWindow.show();
  });
  
  // Log de diagnóstico quando a janela é fechada
  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

// Inicializa o app quando estiver pronto
app.whenReady().then(() => {
  console.log('Application is ready');
  return createWindow();
}).catch(err => {
  console.error('Failed to create window:', err);
  app.quit();
});

// Fecha a aplicação quando todas as janelas forem fechadas (exceto no macOS)
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    console.log('Quitting application');
    app.quit();
  }
});

// No macOS, recria a janela quando o ícone do dock for clicado
app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('No windows open, creating a new one');
    createWindow().catch(err => {
      console.error('Failed to recreate window:', err);
    });
  }
});

// Game detection functions
async function scanForGames() {
  console.log('Scanning for installed games...');
  try {
    const steamGames = getSteamGames();
    const epicGames = getEpicGames();
    const xboxGames = getXboxGames();

    const results = {
      steam: await steamGames,
      epic: await epicGames,
      xbox: await xboxGames
    };
    
    console.log(`Found ${results.steam.length} Steam games, ${results.epic.length} Epic games, ${results.xbox.length} Xbox games`);
    return results;
  } catch (error) {
    console.error('Error scanning games:', error);
    return { steam: [], epic: [], xbox: [] };
  }
}

async function getSteamGames() {
  console.log('Scanning for Steam games...');
  try {
    // Get Steam installation path from registry
    const steamPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Valve\\Steam',
      'InstallPath'
    );

    if (!steamPath) {
      console.log('Steam installation not found in registry');
      return [];
    }

    console.log('Steam installation found at:', steamPath);

    // Read Steam library folders configuration
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    let libraryFoldersContent;

    try {
      libraryFoldersContent = await fs.readFile(libraryFoldersPath, 'utf8');
      console.log('Read Steam library folders configuration');
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

    console.log('Found Steam library paths:', libraryPaths);

    const games = [];

    // Scan each library folder for installed games
    for (const libraryPath of libraryPaths) {
      const appsPath = path.join(libraryPath, 'steamapps');
      console.log('Scanning Steam library at:', appsPath);

      try {
        const files = await fs.readdir(appsPath);

        // Look for appmanifest files which contain game information
        const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
        console.log(`Found ${manifests.length} game manifests in ${appsPath}`);

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
              
              console.log(`Found Steam game: ${name} (${appId})`);
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

async function getEpicGames() {
  console.log('Scanning for Epic Games...');
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

    console.log('Looking for Epic Games manifest at:', epicManifestPath);

    // Read the installation manifest
    let manifestContent;
    try {
      manifestContent = await fs.readFile(epicManifestPath, 'utf8');
      console.log('Read Epic Games installation manifest');
    } catch (error) {
      console.error('Error reading Epic Games manifest:', error);
      return [];
    }

    const manifest = JSON.parse(manifestContent);
    const games = [];

    console.log(`Found ${manifest.InstallationList?.length || 0} Epic games in manifest`);

    // Process each installed game
    for (const installation of (manifest.InstallationList || [])) {
      try {
        const manifestPath = path.join(
          installation.InstallLocation,
          '.egstore',
          `${installation.AppName}.manifest`
        );

        console.log(`Processing Epic game: ${installation.DisplayName}`);

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
        
        console.log(`Added Epic game: ${installation.DisplayName}`);
      } catch (error) {
        console.error(`Error processing Epic game ${installation?.DisplayName || 'unknown'}:`, error);
      }
    }

    console.log(`Scan complete. Found ${games.length} Epic games`);
    return games;
  } catch (error) {
    console.error('Error scanning Epic games:', error);
    return [];
  }
}

async function getXboxGames() {
  console.log('Scanning for Xbox Games...');
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
      console.log('Xbox Gaming Services not found in registry');
      return [];
    }

    console.log('Xbox Gaming Services found at:', gamingPath);

    // Xbox games are typically installed in the WindowsApps directory
    const windowsAppsPath = path.join(process.env.ProgramFiles, 'WindowsApps');
    const games = [];

    console.log('Scanning for Xbox games in:', windowsAppsPath);

    try {
      const entries = await fs.readdir(windowsAppsPath, { withFileTypes: true });
      console.log(`Found ${entries.length} entries in WindowsApps directory`);

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.includes('Microsoft.Xbox')) {
          try {
            const gamePath = path.join(windowsAppsPath, entry.name);
            const manifestPath = path.join(gamePath, 'AppxManifest.xml');

            console.log(`Processing potential Xbox game: ${entry.name}`);

            // Read and parse the AppxManifest.xml file
            const manifestContent = await fs.readFile(manifestPath, 'utf8');

            // Extract game information from manifest
            const nameMatch = /<DisplayName>(.*?)<\/DisplayName>/.exec(manifestContent);
            const executableMatch = /<Application.*?Executable="(.*?)"/.exec(manifestContent);

            if (nameMatch && executableMatch) {
              const name = nameMatch[1];
              const executableName = executableMatch[1];

              console.log(`Found Xbox game: ${name}`);

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

    console.log(`Scan complete. Found ${games.length} Xbox games`);
    return games;
  } catch (error) {
    console.error('Error scanning Xbox games:', error);
    return [];
  }
}

// System monitoring functions
async function getSystemInfo() {
  console.log('Getting system information...');
  try {
    const cpu = await si.cpu();
    const mem = await si.mem();
    const gpu = await si.graphics();
    const os = await si.osInfo();

    console.log('System information retrieved successfully');
    return {
      cpu,
      memory: mem,
      gpu: gpu.controllers[0],
      os
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      cpu: { brand: 'Unknown', speed: 0, cores: 0 },
      memory: { total: 0, free: 0, used: 0 },
      gpu: { model: 'Unknown', vram: 0 },
      os: { platform: process.platform, distro: 'Unknown', release: 'Unknown' }
    };
  }
}

// Game launching functions
async function launchGame(game) {
  console.log(`Launching game: ${game.name} (${game.platform})`);
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
  console.log(`Launching Steam game: ${game.name} (${game.id})`);
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

    console.log('Steam installation found at:', steamPath);

    // Launch game using Steam protocol
    const steamExe = path.join(steamPath, 'steam.exe');
    console.log(`Launching Steam with command: ${steamExe} steam://rungameid/${game.id}`);
    
    const process = spawn(steamExe, [`steam://rungameid/${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();
    console.log('Game launch process started');
    return true;
  } catch (error) {
    console.error(`Error launching Steam game ${game.name}:`, error);
    throw error;
  }
}

async function launchEpicGame(game) {
  console.log(`Launching Epic game: ${game.name} (${game.id})`);
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

    console.log('Epic Games Launcher found at:', epicPath);

    // Launch game using Epic protocol
    console.log(`Launching Epic game with command: ${epicPath} -com.epicgames.launcher://apps/${game.id}?action=launch&silent=true`);
    
    const process = spawn(epicPath, [
      `-com.epicgames.launcher://apps/${game.id}?action=launch&silent=true`
    ], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();
    console.log('Game launch process started');
    return true;
  } catch (error) {
    console.error(`Error launching Epic game ${game.name}:`, error);
    throw error;
  }
}

async function launchXboxGame(game) {
  console.log(`Launching Xbox game: ${game.name} (${game.id})`);
  try {
    // Xbox games use the Microsoft Store protocol
    console.log(`Launching Xbox game with command: explorer.exe ms-xbox-game://${game.id}`);
    
    const process = spawn('explorer.exe', [`ms-xbox-game://${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();
    console.log('Game launch process started');
    return true;
  } catch (error) {
    console.error(`Error launching Xbox game ${game.name}:`, error);
    throw error;
  }
}

// IPC handlers for communication with renderer process
ipcMain.handle('scan-games', async () => {
  console.log('Received scan-games request from renderer');
  try {
    const results = await scanForGames();
    console.log('Scan-games completed successfully');
    return results;
  } catch (error) {
    console.error('Error in scan-games handler:', error);
    return { steam: [], epic: [], xbox: [] };
  }
});

ipcMain.handle('get-system-info', async () => {
  console.log('Received get-system-info request from renderer');
  try {
    const info = await getSystemInfo();
    console.log('Get-system-info completed successfully');
    return info;
  } catch (error) {
    console.error('Error in get-system-info handler:', error);
    return { cpu: {}, memory: {}, gpu: {}, os: {} };
  }
});

ipcMain.handle('launch-game', async (event, game) => {
  console.log('Received launch-game request from renderer', game?.name);
  try {
    const success = await launchGame(game);
    console.log('Launch-game completed successfully');
    return { success };
  } catch (error) {
    console.error('Error in launch-game handler:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
});

console.log('Main process initialization complete');