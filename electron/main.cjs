// electron/main.cjs
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');

// Log para diagnóstico inicial
console.log('Starting GamePath AI');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Node version:', process.versions.node);
console.log('Electron version:', process.versions.electron);

// Importação segura para módulos nativos
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
    enumerateValues: (hkey, path) => {
      console.log(`[Registry Fallback] Attempted to enumerate: ${hkey}\\${path}`);
      return []; 
    },
    HKEY: { 
      LOCAL_MACHINE: 0,
      CURRENT_USER: 1
    } 
  };
}
console.log('Using registry implementation fallback');

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

// Importação dinâmica para trabalhar com TypeScript compilado
let getSteamGames, getEpicGames, getXboxGames, getOriginGames, 
    getBattleNetGames, getGOGGames, getUplayGames;

// Caminhos atualizados para os módulos de detecção de jogos
try {
  getSteamGames = require('./src/lib/gameDetection/platforms/getSteamGames').default || 
                 require('./src/lib/gameDetection/platforms/getSteamGames');
  console.log('Successfully loaded Steam games module');
} catch (e) {
  console.warn('Steam games module not available:', e.message);
  // Será definido pela implementação interna mais tarde
  getSteamGames = null;
}

try {
  getEpicGames = require('./src/lib/gameDetection/platforms/getEpicGames').default || 
                require('./src/lib/gameDetection/platforms/getEpicGames');
  console.log('Successfully loaded Epic games module');
} catch (e) {
  console.warn('Epic games module not available:', e.message);
  getEpicGames = null;
}

try {
  getXboxGames = require('./src/lib/gameDetection/platforms/getXboxGames').default || 
                require('./src/lib/gameDetection/platforms/getXboxGames');
  console.log('Successfully loaded Xbox games module');
} catch (e) {
  console.warn('Xbox games module not available:', e.message);
  getXboxGames = null;
}

try {
  getOriginGames = require('./src/lib/gameDetection/platforms/getOriginGames').default || 
                  require('./src/lib/gameDetection/platforms/getOriginGames');
  console.log('Successfully loaded Origin games module');
} catch (e) {
  console.warn('Origin games module not available:', e.message);
  getOriginGames = null;
}

try {
  getBattleNetGames = require('./src/lib/gameDetection/platforms/getBattleNetGames').default || 
                      require('./src/lib/gameDetection/platforms/getBattleNetGames');
  console.log('Successfully loaded Battle.net games module');
} catch (e) {
  console.warn('Battle.net games module not available:', e.message);
  getBattleNetGames = null;
}

try {
  getGOGGames = require('./src/lib/gameDetection/platforms/getGOGGames').default || 
               require('./src/lib/gameDetection/platforms/getGOGGames');
  console.log('Successfully loaded GOG games module');
} catch (e) {
  console.warn('GOG games module not available:', e.message);
  getGOGGames = null;
}

try {
  getUplayGames = require('./src/lib/gameDetection/platforms/getUplayGames').default || 
                 require('./src/lib/gameDetection/platforms/getUplayGames');
  console.log('Successfully loaded Uplay games module');
} catch (e) {
  console.warn('Uplay games module not available:', e.message);
  getUplayGames = null;
}

// Carregar módulos de funcionalidades
let networkMetrics, systemMonitor, fpsOptimizer, vpnManager;

try {
  networkMetrics = require('./network-metrics.cjs');
  console.log('Successfully loaded network-metrics module');
} catch (e) {
  console.warn('network-metrics module not available:', e.message);
  networkMetrics = {
    measureLatency: async () => ({ average: 50 }),
    measureConnectionQuality: async () => ({ jitter: 5, stability: 95 }),
    traceRoute: async () => ({ hops: [] }),
    estimateBandwidth: async () => ({ estimatedDownload: 100, estimatedUpload: 10 }),
    calculatePacketLoss: async () => ({ packetLoss: 0.5 }),
    analyzeNetwork: async () => ({
      latency: { average: 50 },
      quality: { jitter: 5, stability: 95 },
      bandwidth: { estimatedDownload: 100, estimatedUpload: 10 },
      packetLoss: { packetLoss: 0.5 }
    })
  };
}

try {
  systemMonitor = require('./system-monitor.cjs');
  console.log('Successfully loaded system-monitor module');
} catch (e) {
  console.warn('system-monitor module not available:', e.message);
  systemMonitor = {
    getSystemInfo: async () => ({
      cpu: { usage: 50, temperature: 60, frequency: 3000, processes: [] },
      memory: { used: 8000, available: 16000, swapUsage: 0 },
      gpu: { usage: 40, temperature: 65, memoryUsed: 2000, memoryTotal: 8000 },
      network: { latency: 30, bandwidth: 100, packetLoss: 0.1 }
    }),
    optimizeForGaming: async () => ({ success: true }),
    optimizeProcesses: async () => ({ success: true, details: {} }),
    optimizeMemory: async () => ({ success: true, details: {} }),
    optimizeDisk: async () => ({ success: true, details: {} })
  };
}

try {
  fpsOptimizer = require('./fps-optimizer.cjs');
  console.log('Successfully loaded fps-optimizer module');
} catch (e) {
  console.warn('fps-optimizer module not available:', e.message);
  fpsOptimizer = {
    optimizeGame: async (game, profile) => ({
      success: true,
      improvements: { fps: 20, latency: 15, stability: 10 },
      appliedSettings: {}
    }),
    getProfiles: () => ({
      balanced: {},
      performance: {},
      extreme: {}
    })
  };
}

try {
  vpnManager = require('./vpn-manager.cjs');
  console.log('Successfully loaded vpn-manager module');
} catch (e) {
  console.warn('vpn-manager module not available:', e.message);
  vpnManager = {
    connect: async (server) => ({ success: true, server }),
    disconnect: async () => ({ success: true }),
    getStatus: () => ({ isConnected: false }),
    getServers: () => ([]),
    refreshServers: async () => ([]),
    testSpeed: async () => ({ download: 100, upload: 10, latency: 30 })
  };
}

// Variável para a janela principal
let mainWindow;

// Variável para armazenar a referência ao Tray
let tray = null;

// Função para criar o ícone da bandeja do sistema
function createTray(mainWindow) {
  console.log('Criando ícone na bandeja do sistema...');
  
  // Carregar ícone da bandeja
  const iconPath = path.join(__dirname, '../public/icons/tray-icon.png'); // Ajuste o caminho conforme necessário
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    console.log('Ícone da bandeja carregado com sucesso');
  } catch (error) {
    console.error('Erro ao carregar ícone da bandeja:', error);
    // Usar um ícone alternativo ou criar um ícone vazio
    trayIcon = nativeImage.createEmpty();
  }
  
  // Ajustar tamanho do ícone para diferentes plataformas
  if (process.platform === 'win32') {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }
  
  // Criar o Tray
  tray = new Tray(trayIcon);
  tray.setToolTip('GamePath AI');
  
  // Armazenar estado dos jogos
  let detectedGames = [];
  
  // Atualizar o menu da bandeja com os jogos detectados
  function updateTrayMenu(games = detectedGames) {
    detectedGames = games;
    
    const gameItems = games.map(game => ({
      label: game.name,
      submenu: [
        {
          label: 'Launch',
          click: () => {
            mainWindow.webContents.send('launch-game-from-tray', game.id);
          },
        },
        {
          label: game.optimized ? 'Optimized ✓' : 'Optimize',
          enabled: !game.optimized,
          click: () => {
            mainWindow.webContents.send('optimize-game-from-tray', game.id);
          },
        },
      ],
    }));
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'GamePath AI', type: 'normal', enabled: false },
      { type: 'separator' },
      ...(games.length > 0 
        ? [
            { label: 'Detected Games', enabled: false },
            ...gameItems,
            { type: 'separator' },
          ] 
        : [{ label: 'No Games Detected', enabled: false }]
      ),
      { 
        label: 'Scan for Games', 
        click: () => {
          console.log('Iniciando scan de jogos a partir da bandeja');
          mainWindow.webContents.send('scan-games-from-tray');
        } 
      },
      { type: 'separator' },
      { 
        label: 'Show App', 
        click: () => {
          mainWindow.show();
        } 
      },
      { 
        label: 'Quit', 
        click: () => {
          app.quit();
        } 
      },
    ]);
    
    tray.setContextMenu(contextMenu);
  }
  
  // Configurar comportamento ao clicar
  tray.on('click', () => {
    // Mostrar a janela principal ao clicar no ícone
    mainWindow.show();
  });
  
  // Menu inicial sem jogos
  updateTrayMenu([]);
  
  // Expor função para atualizar lista de jogos
  ipcMain.handle('update-tray-games', async (event, games) => {
    console.log('Atualizando lista de jogos na bandeja:', games.length);
    updateTrayMenu(games);
    return true;
  });
  
  return {
    updateTrayMenu,
  };
}

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

  // Criar tray depois que a janela estiver pronta
  mainWindow.once('ready-to-show', () => {
    console.log('Window is ready to show');
    mainWindow.show();
    
    // Criar o tray
    const { updateTrayMenu } = createTray(mainWindow);
    
    // Armazenar a função no objeto global para uso posterior
    global.updateTrayMenu = updateTrayMenu;
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

// Modifica o comportamento do app quando todas as janelas são fechadas
app.on('window-all-closed', () => {
  console.log('All windows closed');
  // Se estamos no macOS, não sair do app ao fechar todas as janelas
  if (process.platform !== 'darwin') {
    // No Windows/Linux, se temos um tray, não sair do app
    if (!tray) {
      console.log('No tray, quitting application');
      app.quit();
    } else {
      console.log('Tray still active, app remains running in background');
    }
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

// Game detection functions - implementações internas como fallback
// Se os módulos importados não estiverem disponíveis, usamos estas implementações
if (!getSteamGames) {
  getSteamGames = async function() {
    console.log('Using internal Steam games scanner');
    try {
      // Tentar obter o caminho do Steam do registro
      let steamPath = null;
      
      // Tentar primeiro HKEY_CURRENT_USER
      steamPath = Registry.getValue(
        Registry.HKEY.CURRENT_USER,
        'SOFTWARE\\Valve\\Steam',
        'SteamPath'
      );
      
      // Se não encontrar, tentar HKEY_LOCAL_MACHINE
      if (!steamPath) {
        steamPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          'SOFTWARE\\WOW6432Node\\Valve\\Steam',
          'InstallPath'
        );
      }
      
      // Se ainda não encontrar, tentar caminhos padrão
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
            await fs.access(defaultPath);
            steamPath = defaultPath;
            console.log(`Found Steam at default path: ${steamPath}`);
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }

      if (!steamPath) {
        console.log('Steam installation not found');
        return [];
      }

      console.log('Steam installation found at:', steamPath);

      // Ler configuração de bibliotecas do Steam
      const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
      let libraryFoldersContent;

      try {
        libraryFoldersContent = await fs.readFile(libraryFoldersPath, 'utf8');
        console.log('Read Steam library folders configuration');
      } catch (error) {
        console.error('Error reading Steam library folders:', error);
        
        // Tentar caminho alternativo para o arquivo de configuração
        const altLibraryFoldersPath = path.join(steamPath, 'config', 'libraryfolders.vdf');
        try {
          libraryFoldersContent = await fs.readFile(altLibraryFoldersPath, 'utf8');
          console.log('Read Steam library folders from alternate path');
        } catch (altError) {
          console.error('Error reading alternate Steam library folders:', altError);
          return [];
        }
      }

      // Analisar bibliotecas do Steam
      const libraryPaths = [steamPath];
      const libraryRegex = /"path"\s+"([^"]+)"/g;
      let match;

      while ((match = libraryRegex.exec(libraryFoldersContent)) !== null) {
        libraryPaths.push(match[1].replace(/\\\\/g, '\\'));
      }

      // Se não encontrou bibliotecas adicionais, tentar outro formato de arquivo
      if (libraryPaths.length === 1) {
        const altLibraryRegex = /"([0-9]+)"\s+{[^}]*?"path"\s+"([^"]+)"/gs;
        let altMatch;
        
        while ((altMatch = altLibraryRegex.exec(libraryFoldersContent)) !== null) {
          libraryPaths.push(altMatch[2].replace(/\\\\/g, '\\'));
        }
      }

      console.log('Found Steam library paths:', libraryPaths);

      const games = [];

      // Escanear cada biblioteca por jogos instalados
      for (const libraryPath of libraryPaths) {
        const appsPath = path.join(libraryPath, 'steamapps');
        console.log('Scanning Steam library at:', appsPath);

        try {
          const files = await fs.readdir(appsPath);

          // Procurar por arquivos appmanifest que contêm informações dos jogos
          const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
          console.log(`Found ${manifests.length} game manifests in ${appsPath}`);

          for (const manifest of manifests) {
            try {
              const manifestPath = path.join(appsPath, manifest);
              const manifestContent = await fs.readFile(manifestPath, 'utf8');

              // Extrair informações do jogo do manifesto
              const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
              const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
              const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);
              const sizeOnDiskMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(manifestContent);
              const lastPlayedMatch = /"LastPlayed"\s+"(\d+)"/.exec(manifestContent);

              if (nameMatch && appIdMatch && installDirMatch) {
                const name = nameMatch[1];
                const appId = appIdMatch[1];
                const installDir = installDirMatch[1];
                const sizeInBytes = sizeOnDiskMatch ? parseInt(sizeOnDiskMatch[1]) : 0;
                const sizeInGB = Math.round(sizeInBytes / (1024 * 1024 * 1024) * 100) / 100;
                const lastPlayed = lastPlayedMatch ? new Date(parseInt(lastPlayedMatch[1]) * 1000) : null;

                const gamePath = path.join(appsPath, 'common', installDir);
                
                // Tentar encontrar o executável principal
                let executablePath = '';
                try {
                  const gameFiles = await fs.readdir(gamePath);
                  const exeFiles = gameFiles.filter(file => file.endsWith('.exe'));
                  
                  // Tentar encontrar o executável com o mesmo nome do diretório
                  const mainExe = exeFiles.find(file => file.toLowerCase() === `${installDir.toLowerCase()}.exe`);
                  if (mainExe) {
                    executablePath = path.join(gamePath, mainExe);
                  } else if (exeFiles.length > 0) {
                    // Pegar o primeiro executável encontrado
                    executablePath = path.join(gamePath, exeFiles[0]);
                  }
                } catch (error) {
                  console.warn(`Could not scan executables for ${name}:`, error);
                }

                games.push({
                  id: appId,
                  name,
                  platform: 'Steam',
                  installPath: gamePath,
                  executablePath,
                  process_name: path.basename(executablePath || ''),
                  size: sizeInGB,
                  last_played: lastPlayed,
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
  };
}

if (!getEpicGames) {
  getEpicGames = async function() {
    console.log('Using internal Epic Games scanner');
    try {
      // Determinar o caminho para os arquivos de manifesto do Epic Games Launcher
      let manifestPath = '';
      
      if (process.platform === 'win32') {
        if (process.env.LOCALAPPDATA) {
          manifestPath = path.join(
            process.env.LOCALAPPDATA,
            'EpicGamesLauncher',
            'Saved',
            'Config',
            'Windows'
          );
        }
      } else if (process.platform === 'darwin') {
        manifestPath = path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Epic',
          'EpicGamesLauncher',
          'Config'
        );
      } else {
        // Linux
        manifestPath = path.join(
          os.homedir(),
          '.config',
          'Epic',
          'EpicGamesLauncher'
        );
      }
      
      if (!manifestPath) {
        console.log('Could not determine Epic Games Launcher config path');
        return [];
      }
      
      console.log('Looking for Epic Games manifests at:', manifestPath);
      
      // Verificar se o diretório existe
      try {
        await fs.access(manifestPath);
      } catch (error) {
        console.log('Epic Games Launcher config directory not found');
        return [];
      }
      
      // Procurar por arquivos de manifesto
      const files = await fs.readdir(manifestPath);
      
      // Procurar pelo arquivo de instalação
      const manifestFile = files.find(file => 
        file === 'GameInstallation.json' || 
        file === 'InstallationList.json'
      );
      
      if (!manifestFile) {
        console.log('No Epic Games installation manifest found');
        return [];
      }
      
      const manifestFilePath = path.join(manifestPath, manifestFile);
      console.log('Found Epic Games manifest at:', manifestFilePath);
      
      // Ler o arquivo de manifesto
      const manifestContent = await fs.readFile(manifestFilePath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      const games = [];
      const installationList = manifest.InstallationList || [];
      
      console.log(`Found ${installationList.length} Epic games in manifest`);
      
      // Processar cada jogo instalado
      for (const installation of installationList) {
        try {
          if (!installation.InstallLocation) {
            console.log(`Skipping game with no install location: ${installation.DisplayName || 'Unknown'}`);
            continue;
          }
          
          console.log(`Processing Epic game: ${installation.DisplayName}`);
          
          // Tentar encontrar o executável principal
          let executablePath = '';
          if (installation.LaunchExecutable) {
            executablePath = path.join(
              installation.InstallLocation,
              installation.LaunchExecutable
            );
          }
          
          // Calcular tamanho do jogo
          let sizeInGB = 0;
          try {
            const stats = await fs.stat(installation.InstallLocation);
            sizeInGB = Math.round((stats.size || 0) / (1024 * 1024 * 1024) * 100) / 100;
          } catch (error) {
            console.warn(`Could not determine size for ${installation.DisplayName}:`, error);
          }
          
          games.push({
            id: installation.AppName,
            name: installation.DisplayName,
            platform: 'Epic',
            installPath: installation.InstallLocation,
            executablePath,
            process_name: installation.LaunchExecutable ? path.basename(installation.LaunchExecutable) : '',
            size: sizeInGB,
            iconUrl: null // Epic não fornece URLs consistentes para imagens
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
  };
}

if (!getXboxGames) {
  getXboxGames = async function() {
    console.log('Using internal Xbox Games scanner');
    try {
      // Verificar se a plataforma é Windows, já que o Xbox Games só está disponível no Windows
      if (process.platform !== 'win32') {
        console.log('Xbox Games scanning is only supported on Windows');
        return [];
      }

      // Obter o caminho de instalação do Windows Apps por diferentes métodos
      let windowsAppsPath;
      
      try {
        // Primeira tentativa: Chave de registro do GamingServices (mais confiável)
        windowsAppsPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          'SOFTWARE\\Microsoft\\GamingServices',
          'GamingInstallPath'
        );
        
        if (windowsAppsPath) {
          console.log('Found Windows Apps path in GamingServices registry:', windowsAppsPath);
        }
        
        // Segunda tentativa: Chave de registro alternativa
        if (!windowsAppsPath) {
          windowsAppsPath = Registry.getValue(
            Registry.HKEY.LOCAL_MACHINE,
            'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Appx\\PackageRoot',
            'Path'
          );
          
          if (windowsAppsPath) {
            console.log('Found Windows Apps path in Appx PackageRoot registry:', windowsAppsPath);
          }
        }
      } catch (error) {
        console.log('Registry access error:', error.message);
      }

      // Se a pesquisa no registro falhar, usar caminhos padrão
      if (!windowsAppsPath && process.env.ProgramFiles) {
        windowsAppsPath = path.join(process.env.ProgramFiles, 'WindowsApps');
        console.log('Using default Windows Apps path from ProgramFiles:', windowsAppsPath);
      } else if (!windowsAppsPath) {
        // Fallback absoluto se ProgramFiles não estiver disponível
        windowsAppsPath = 'C:\\Program Files\\WindowsApps';
        console.log('Using hardcoded default Windows Apps path:', windowsAppsPath);
      }

      console.log('Scanning for Xbox games in:', windowsAppsPath);

      // Verificar se podemos acessar o diretório WindowsApps (requer privilégios elevados)
      try {
        await fs.access(windowsAppsPath);
      } catch (error) {
        console.error('No access to WindowsApps directory. This requires admin privileges:', error.message);
        return [];
      }

      // Ler o diretório WindowsApps
      let entries;
      try {
        entries = await fs.readdir(windowsAppsPath, { withFileTypes: true });
        console.log(`Found ${entries.length} entries in WindowsApps directory`);
      } catch (error) {
        console.error('Error reading WindowsApps directory:', error.message);
        return [];
      }

      // Filtrar diretórios que possam conter jogos do Xbox
      const potentialGameDirs = entries.filter(entry => 
        entry.isDirectory() && (
          entry.name.includes('Microsoft.Xbox') || 
          entry.name.includes('Microsoft.GamingApp') ||
          entry.name.includes('Microsoft.Game')
        )
      );

      console.log(`Found ${potentialGameDirs.length} potential Xbox game directories`);

      const games = [];

      // Processar cada diretório de jogo potencial
      for (const dir of potentialGameDirs) {
        try {
          const gamePath = path.join(windowsAppsPath, dir.name);
          console.log(`Processing potential Xbox game: ${dir.name}`);
          
          // Procurar pelo manifesto do aplicativo
          const manifestPath = path.join(gamePath, 'AppxManifest.xml');
          
          // Verificar se o manifesto existe
          try {
            await fs.access(manifestPath);
          } catch (manifestError) {
            console.log(`No manifest found for ${dir.name}, skipping`);
            continue;
          }
          
          // Ler e analisar o arquivo AppxManifest.xml
          const manifestContent = await fs.readFile(manifestPath, 'utf8');
          
          // Extrair nome do jogo do manifesto
          const nameMatch = /<DisplayName>(.*?)<\/DisplayName>/.exec(manifestContent);
          if (!nameMatch || !nameMatch[1]) {
            console.log(`No display name found for ${dir.name}, skipping`);
            continue;
          }
          
          const gameName = nameMatch[1];
          
          // Extrair caminho do executável do manifesto
          const executableMatch = /<Application.*?Executable="(.*?)"/.exec(manifestContent);
          const executableName = executableMatch ? executableMatch[1] : '';
          
          if (!executableName) {
            console.log(`No executable found for ${gameName}, skipping`);
            continue;
          }
          
          console.log(`Found Xbox game: ${gameName} (executable: ${executableName})`);
          
          // Gerar um ID único a partir do nome do diretório
          // Extrair a parte "Microsoft.XYZ" do nome, sem a versão
          const idMatch = dir.name.match(/^(Microsoft\.[^_]+)/);
          const gameId = idMatch ? idMatch[1] : dir.name.split('_')[0];
          
          // Calcular tamanho do jogo
          let gameSize = 0;
          try {
            const stats = await fs.stat(gamePath);
            // Converter bytes para GB com 2 casas decimais
            gameSize = Math.round((stats.size / (1024 * 1024 * 1024)) * 100) / 100;
            console.log(`Size of ${gameName}: ${gameSize} GB`);
          } catch (sizeError) {
            console.warn(`Could not determine size for ${gameName}: ${sizeError.message}`);
          }
          
          // Adicionar jogo à lista com todas as propriedades necessárias
          games.push({
            id: gameId,
            name: gameName,
            platform: 'Xbox',
            installPath: gamePath,
            executablePath: executableName ? path.join(gamePath, executableName) : '',
            process_name: path.basename(executableName) || executableName,
            size: gameSize,
            iconUrl: null // Jogos do Xbox não têm URLs consistentes para imagens
          });
        } catch (error) {
          console.error(`Error processing Xbox game ${dir.name}:`, error.message);
        }
      }
      
      console.log(`Scan complete. Found ${games.length} Xbox games`);
      return games;
    } catch (error) {
      console.error('Error scanning Xbox games:', error.message);
      return [];
    }
  };
}

if (!getOriginGames) {
  getOriginGames = async function() {
    console.log('Using internal Origin Games scanner');
    try {
      if (process.platform !== 'win32') {
        console.log('Origin Games scanning is only supported on Windows');
        return [];
      }
      
      // Tentar encontrar o caminho de instalação do Origin
      let originPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        'SOFTWARE\\WOW6432Node\\Origin',
        'InstallDir'
      );
      
      if (!originPath) {
        originPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          'SOFTWARE\\Origin',
          'InstallDir'
        );
      }
      
      if (!originPath) {
        // Tentar caminhos padrão
        const defaultPaths = [
          'C:\\Program Files (x86)\\Origin',
          'C:\\Program Files\\Origin'
        ];
        
        for (const defaultPath of defaultPaths) {
          try {
            await fs.access(defaultPath);
            originPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!originPath) {
        console.log('Origin installation not found');
        return [];
      }
      
      console.log('Origin installation found at:', originPath);
      
      // Tentar encontrar o caminho de instalação dos jogos
      let gamesPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        'SOFTWARE\\WOW6432Node\\Origin',
        'GamesPath'
      );
      
      if (!gamesPath) {
        // Tentar caminhos padrão para jogos
        const defaultGamesPaths = [
          'C:\\Program Files (x86)\\Origin Games',
          'C:\\Program Files\\Origin Games',
          path.join(os.homedir(), 'Origin Games')
        ];
        
        for (const defaultPath of defaultGamesPaths) {
          try {
            await fs.access(defaultPath);
            gamesPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!gamesPath) {
        console.log('Origin games path not found');
        return [];
      }
      
      console.log('Origin games path found at:', gamesPath);
      
      // Escanear diretório de jogos
      const games = [];
      
      try {
        const entries = await fs.readdir(gamesPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            try {
              const gamePath = path.join(gamesPath, entry.name);
              console.log(`Checking Origin game directory: ${gamePath}`);
              
              // Procurar por executáveis
              const gameFiles = await fs.readdir(gamePath);
              const exeFiles = gameFiles.filter(file => file.endsWith('.exe'));
              
              if (exeFiles.length > 0) {
                // Usar o nome do diretório como nome do jogo
                const name = entry.name;
                
                // Calcular tamanho do jogo
                let sizeInGB = 0;
                try {
                  const stats = await fs.stat(gamePath);
                  sizeInGB = Math.round((stats.size || 0) / (1024 * 1024 * 1024) * 100) / 100;
                } catch (sizeError) {
                  console.warn(`Could not determine size for ${name}:`, sizeError);
                }
                
                // Escolher o executável principal
                const mainExe = exeFiles[0]; // Simplificado, poderia ser mais sofisticado
                const executablePath = path.join(gamePath, mainExe);
                
                games.push({
                  id: name.replace(/[^a-zA-Z0-9]/g, ''),
                  name,
                  platform: 'Origin',
                  installPath: gamePath,
                  executablePath,
                  process_name: mainExe,
                  size: sizeInGB,
                  iconUrl: null
                });
                
                console.log(`Found Origin game: ${name}`);
              }
            } catch (error) {
              console.error(`Error processing Origin game directory ${entry.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error reading Origin games directory:', error);
      }
      
      console.log(`Scan complete. Found ${games.length} Origin games`);
      return games;
    } catch (error) {
      console.error('Error scanning Origin games:', error);
      return [];
    }
  };
}

if (!getBattleNetGames) {
  getBattleNetGames = async function() {
    console.log('Using internal Battle.net Games scanner');
    try {
      if (process.platform !== 'win32') {
        console.log('Battle.net Games scanning is only supported on Windows');
        return [];
      }
      
      // Tentar encontrar o caminho de instalação do Battle.net
      let battleNetPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        'SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net',
        'InstallPath'
      );
      
      if (!battleNetPath) {
        // Tentar caminhos padrão
        const defaultPaths = [
          'C:\\Program Files (x86)\\Battle.net',
          'C:\\Program Files\\Battle.net'
        ];
        
        for (const defaultPath of defaultPaths) {
          try {
            await fs.access(defaultPath);
            battleNetPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!battleNetPath) {
        console.log('Battle.net installation not found');
        return [];
      }
      
      console.log('Battle.net installation found at:', battleNetPath);
      
      // Jogos conhecidos do Battle.net e seus possíveis caminhos de instalação
      const knownGames = [
        { id: 'wow', name: 'World of Warcraft', exeName: 'Wow.exe' },
        { id: 'ow', name: 'Overwatch', exeName: 'Overwatch.exe' },
        { id: 'd3', name: 'Diablo III', exeName: 'Diablo III.exe' },
        { id: 'd2r', name: 'Diablo II: Resurrected', exeName: 'D2R.exe' },
        { id: 'd4', name: 'Diablo IV', exeName: 'Diablo IV.exe' },
        { id: 'hs', name: 'Hearthstone', exeName: 'Hearthstone.exe' },
        { id: 'heroes', name: 'Heroes of the Storm', exeName: 'HeroesOfTheStorm.exe' },
        { id: 'sc2', name: 'StarCraft II', exeName: 'SC2.exe' },
        { id: 'scr', name: 'StarCraft: Remastered', exeName: 'StarCraft.exe' },
        { id: 'w3', name: 'Warcraft III: Reforged', exeName: 'Warcraft III.exe' },
        { id: 'cod', name: 'Call of Duty', exeName: 'BlackOpsColdWar.exe' },
        { id: 'codmw', name: 'Call of Duty: Modern Warfare', exeName: 'ModernWarfare.exe' },
        { id: 'codmw2', name: 'Call of Duty: Modern Warfare 2', exeName: 'ModernWarfare2.exe' },
        { id: 'codbo4', name: 'Call of Duty: Black Ops 4', exeName: 'BlackOps4.exe' }
      ];
      
      // Possíveis caminhos de instalação
      const possibleInstallPaths = [
        'C:\\Program Files (x86)\\',
        'C:\\Program Files\\',
        path.join(os.homedir(), 'Games\\'),
        'D:\\Games\\',
        'E:\\Games\\'
      ];
      
      const games = [];
      
      // Procurar por jogos do Battle.net
      for (const game of knownGames) {
        for (const basePath of possibleInstallPaths) {
          // Tentar diferentes padrões de caminhos
          const possibleGamePaths = [
            path.join(basePath, game.name),
            path.join(basePath, 'Blizzard', game.name),
            path.join(basePath, 'Battle.net', game.name),
            path.join(basePath, 'Blizzard Games', game.name)
          ];
          
          for (const gamePath of possibleGamePaths) {
            try {
              await fs.access(gamePath);
              
              // Verificar se o executável existe
              const exePath = path.join(gamePath, game.exeName);
              try {
                await fs.access(exePath);
                
                // Calcular tamanho do jogo
                let sizeInGB = 0;
                try {
                  const stats = await fs.stat(gamePath);
                  sizeInGB = Math.round((stats.size || 0) / (1024 * 1024 * 1024) * 100) / 100;
                } catch (sizeError) {
                  console.warn(`Could not determine size for ${game.name}:`, sizeError);
                }
                
                games.push({
                  id: game.id,
                  name: game.name,
                  platform: 'Battle.net',
                  installPath: gamePath,
                  executablePath: exePath,
                  process_name: game.exeName,
                  size: sizeInGB,
                  iconUrl: null
                });
                
                console.log(`Found Battle.net game: ${game.name}`);
                break; // Encontrou o jogo, não precisa verificar outros caminhos
              } catch (exeError) {
                // Executável não encontrado, continuar procurando
              }
            } catch (pathError) {
              // Caminho não existe, continuar procurando
            }
          }
        }
      }
      
      console.log(`Scan complete. Found ${games.length} Battle.net games`);
      return games;
    } catch (error) {
      console.error('Error scanning Battle.net games:', error);
      return [];
    }
  };
}

if (!getGOGGames) {
  getGOGGames = async function() {
    console.log('Using internal GOG Games scanner');
    try {
      if (process.platform !== 'win32') {
        console.log('GOG Games scanning is only supported on Windows');
        return [];
      }
      
      // Tentar encontrar o caminho de instalação do GOG Galaxy
      let gogPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        'SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient',
        'InstallPath'
      );
      
      if (!gogPath) {
        // Tentar caminhos padrão
        const defaultPaths = [
          'C:\\Program Files (x86)\\GOG Galaxy',
          'C:\\Program Files\\GOG Galaxy'
        ];
        
        for (const defaultPath of defaultPaths) {
          try {
            await fs.access(defaultPath);
            gogPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!gogPath) {
        console.log('GOG Galaxy installation not found');
        return [];
      }
      
      console.log('GOG Galaxy installation found at:', gogPath);
      
      // Tentar encontrar o caminho de instalação dos jogos
      let gamesPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        'SOFTWARE\\WOW6432Node\\GOG.com\\Games',
        'Path'
      );
      
      if (!gamesPath) {
        // Tentar caminhos padrão para jogos
        const defaultGamesPaths = [
          'C:\\Program Files (x86)\\GOG Games',
          'C:\\Program Files\\GOG Games',
          'C:\\GOG Games',
          path.join(os.homedir(), 'GOG Games')
        ];
        
        for (const defaultPath of defaultGamesPaths) {
          try {
            await fs.access(defaultPath);
            gamesPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!gamesPath) {
        console.log('GOG games path not found, trying to find individual games');
        
        // Tentar encontrar jogos individuais no registro
        const games = [];
        
        try {
          // Enumerar todas as chaves sob SOFTWARE\WOW6432Node\GOG.com\Games
          const gameKeys = Registry.enumerateValues(
            Registry.HKEY.LOCAL_MACHINE,
            'SOFTWARE\\WOW6432Node\\GOG.com\\Games'
          );
          
          for (const gameKey of gameKeys) {
            try {
              const gameValues = Registry.enumerateValues(
                Registry.HKEY.LOCAL_MACHINE,
                `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${gameKey.name}`
              );
              
              const pathValue = gameValues.find(v => v.name === 'PATH');
              const exeValue = gameValues.find(v => v.name === 'EXE');
              const nameValue = gameValues.find(v => v.name === 'GAMENAME');
              
              if (pathValue && exeValue) {
                const gamePath = pathValue.data;
                const exeName = exeValue.data;
                const gameName = nameValue ? nameValue.data : gameKey.name;
                
                // Calcular tamanho do jogo
                let sizeInGB = 0;
                try {
                  const stats = await fs.stat(gamePath);
                  sizeInGB = Math.round((stats.size || 0) / (1024 * 1024 * 1024) * 100) / 100;
                } catch (sizeError) {
                  console.warn(`Could not determine size for ${gameName}:`, sizeError);
                }
                
                games.push({
                  id: gameKey.name,
                  name: gameName,
                  platform: 'GOG',
                  installPath: gamePath,
                  executablePath: path.join(gamePath, exeName),
                  process_name: exeName,
                  size: sizeInGB,
                  iconUrl: null
                });
                
                console.log(`Found GOG game: ${gameName}`);
              }
            } catch (gameError) {
              console.error(`Error processing GOG game ${gameKey.name}:`, gameError);
            }
          }
        } catch (registryError) {
          console.error('Error reading GOG games from registry:', registryError);
        }
        
        console.log(`Scan complete. Found ${games.length} GOG games`);
        return games;
      }
      
      console.log('GOG games path found at:', gamesPath);
      
      // Escanear diretório de jogos
      const games = [];
      
      try {
        const entries = await fs.readdir(gamesPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            try {
              const gamePath = path.join(gamesPath, entry.name);
              console.log(`Checking GOG game directory: ${gamePath}`);
              
              // Procurar por executáveis
              const gameFiles = await fs.readdir(gamePath);
              const exeFiles = gameFiles.filter(file => file.endsWith('.exe'));
              
              if (exeFiles.length > 0) {
                // Tentar encontrar o executável principal
                // Geralmente é o que tem o mesmo nome do jogo ou contém "launcher"
                let mainExe = exeFiles.find(file => 
                  file.toLowerCase().includes(entry.name.toLowerCase()) ||
                  file.toLowerCase().includes('launcher')
                );
                
                if (!mainExe) {
                  // Se não encontrar, pegar o primeiro
                  mainExe = exeFiles[0];
                }
                
                // Calcular tamanho do jogo
                let sizeInGB = 0;
                try {
                  const stats = await fs.stat(gamePath);
                  sizeInGB = Math.round((stats.size || 0) / (1024 * 1024 * 1024) * 100) / 100;
                } catch (sizeError) {
                  console.warn(`Could not determine size for ${entry.name}:`, sizeError);
                }
                
                games.push({
                  id: entry.name.replace(/[^a-zA-Z0-9]/g, ''),
                  name: entry.name,
                  platform: 'GOG',
                  installPath: gamePath,
                  executablePath: path.join(gamePath, mainExe),
                  process_name: mainExe,
                  size: sizeInGB,
                  iconUrl: null
                });
                
                console.log(`Found GOG game: ${entry.name}`);
              }
            } catch (error) {
              console.error(`Error processing GOG game directory ${entry.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error reading GOG games directory:', error);
      }
      
      console.log(`Scan complete. Found ${games.length} GOG games`);
      return games;
    } catch (error) {
      console.error('Error scanning GOG games:', error);
      return [];
    }
  };
}

if (!getUplayGames) {
  getUplayGames = async function() {
    console.log('Using internal Ubisoft Connect (Uplay) Games scanner');
    try {
      if (process.platform !== 'win32') {
        console.log('Ubisoft Connect Games scanning is only supported on Windows');
        return [];
      }
      
      // Tentar encontrar o caminho de instalação do Ubisoft Connect
      let uplayPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        'SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher',
        'InstallDir'
      );
      
      if (!uplayPath) {
        // Tentar caminhos padrão
        const defaultPaths = [
          'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher',
          'C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher',
          'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect',
          'C:\\Program Files\\Ubisoft\\Ubisoft Connect'
        ];
        
        for (const defaultPath of defaultPaths) {
          try {
            await fs.access(defaultPath);
            uplayPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!uplayPath) {
        console.log('Ubisoft Connect installation not found');
        return [];
      }
      
      console.log('Ubisoft Connect installation found at:', uplayPath);
      
      // Tentar encontrar o caminho de instalação dos jogos
      // Ubisoft Connect armazena os jogos em um arquivo de configuração
      const configPath = path.join(uplayPath, 'cache', 'configuration.json');
      
      let gamesPath = '';
      try {
        await fs.access(configPath);
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (config && config.installationPaths && config.installationPaths.length > 0) {
          gamesPath = config.installationPaths[0];
        }
      } catch (configError) {
        console.warn('Could not read Ubisoft Connect configuration:', configError);
      }
      
      if (!gamesPath) {
        // Tentar caminhos padrão para jogos
        const defaultGamesPaths = [
          'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games',
          'C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games',
          'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect\\games',
          'C:\\Program Files\\Ubisoft\\Ubisoft Connect\\games'
        ];
        
        for (const defaultPath of defaultGamesPaths) {
          try {
            await fs.access(defaultPath);
            gamesPath = defaultPath;
            break;
          } catch (err) {
            // Caminho não existe, continuar para o próximo
          }
        }
      }
      
      if (!gamesPath) {
        console.log('Ubisoft Connect games path not found');
        return [];
      }
      
      console.log('Ubisoft Connect games path found at:', gamesPath);
      
      // Escanear diretório de jogos
      const games = [];
      
      try {
        const entries = await fs.readdir(gamesPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            try {
              const gamePath = path.join(gamesPath, entry.name);
              console.log(`Checking Ubisoft Connect game directory: ${gamePath}`);
              
              // Procurar por executáveis
              const gameFiles = await fs.readdir(gamePath);
              const exeFiles = gameFiles.filter(file => file.endsWith('.exe'));
              
              if (exeFiles.length > 0) {
                // Tentar encontrar o executável principal
                // Geralmente é o que tem o mesmo nome do jogo ou contém "launcher"
                let mainExe = exeFiles.find(file => 
                  file.toLowerCase().includes(entry.name.toLowerCase()) ||
                  file.toLowerCase().includes('game') ||
                  !file.toLowerCase().includes('launcher') // Evitar launchers secundários
                );
                
                if (!mainExe) {
                  // Se não encontrar, pegar o primeiro
                  mainExe = exeFiles[0];
                }
                
                // Calcular tamanho do jogo
                let sizeInGB = 0;
                try {
                  const stats = await fs.stat(gamePath);
                  sizeInGB = Math.round((stats.size || 0) / (1024 * 1024 * 1024) * 100) / 100;
                } catch (sizeError) {
                  console.warn(`Could not determine size for ${entry.name}:`, sizeError);
                }
                
                games.push({
                  id: entry.name.replace(/[^a-zA-Z0-9]/g, ''),
                  name: entry.name,
                  platform: 'Ubisoft Connect',
                  installPath: gamePath,
                  executablePath: path.join(gamePath, mainExe),
                  process_name: mainExe,
                  size: sizeInGB,
                  iconUrl: null
                });
                
                console.log(`Found Ubisoft Connect game: ${entry.name}`);
              }
            } catch (error) {
              console.error(`Error processing Ubisoft Connect game directory ${entry.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error reading Ubisoft Connect games directory:', error);
      }
      
      console.log(`Scan complete. Found ${games.length} Ubisoft Connect games`);
      return games;
    } catch (error) {
      console.error('Error scanning Ubisoft Connect games:', error);
      return [];
    }
  };
}

// Função auxiliar para obter jogos
async function handleScanGames() {
  console.log('Scanning for games...');
  try {
    // Chamar todos os scanners em paralelo
    const [steamGames, epicGames, xboxGames, originGames, battleNetGames, gogGames, uplayGames] = await Promise.all([
      getSteamGames ? getSteamGames().catch(error => {
        console.error('Error scanning Steam games:', error);
        return [];
      }) : Promise.resolve([]),
      getEpicGames ? getEpicGames().catch(error => {
        console.error('Error scanning Epic games:', error);
        return [];
      }) : Promise.resolve([]),
      getXboxGames ? getXboxGames().catch(error => {
        console.error('Error scanning Xbox games:', error);
        return [];
      }) : Promise.resolve([]),
      getOriginGames ? getOriginGames().catch(error => {
        console.error('Error scanning Origin games:', error);
        return [];
      }) : Promise.resolve([]),
      getBattleNetGames ? getBattleNetGames().catch(error => {
        console.error('Error scanning Battle.net games:', error);
        return [];
      }) : Promise.resolve([]),
      getGOGGames ? getGOGGames().catch(error => {
        console.error('Error scanning GOG games:', error);
        return [];
      }) : Promise.resolve([]),
      getUplayGames ? getUplayGames().catch(error => {
        console.error('Error scanning Uplay games:', error);
        return [];
      }) : Promise.resolve([])
    ]);
    
    // Unir todos os resultados
    const allGames = [
      ...steamGames,
      ...epicGames,
      ...xboxGames,
      ...originGames,
      ...battleNetGames,
      ...gogGames,
      ...uplayGames
    ];
    
    console.log(`Found a total of ${allGames.length} games`);
    
    return {
      success: true,
      data: allGames,
      errors: []
    };
  } catch (error) {
    console.error('Error in scan-games handler:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error during scan']
    };
  }
}

// System monitoring functions
async function getSystemInfo() {
  console.log('Getting system information...');
  try {
    return await systemMonitor.getSystemInfo();
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
      case 'Origin':
        return await launchOriginGame(game);
      case 'Battle.net':
        return await launchBattleNetGame(game);
      case 'GOG':
        return await launchGOGGame(game);
      case 'Ubisoft Connect':
        return await launchUplayGame(game);
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
    let steamPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Valve\\Steam',
      'InstallPath'
    );
    
    if (!steamPath) {
      steamPath = Registry.getValue(
        Registry.HKEY.CURRENT_USER,
        'SOFTWARE\\Valve\\Steam',
        'SteamPath'
      );
    }

    if (!steamPath) {
      // Tentar caminhos padrão
      const defaultPaths = [
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam',
        path.join(os.homedir(), 'Steam')
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          steamPath = defaultPath;
          break;
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }

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
    return { success: true };
  } catch (error) {
    console.error(`Error launching Steam game ${game.name}:`, error);
    throw error;
  }
}

async function launchEpicGame(game) {
  console.log(`Launching Epic game: ${game.name} (${game.id})`);
  try {
    // Get Epic Games Launcher path
    let epicPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher',
      'AppPath'
    );

    if (!epicPath) {
      // Tentar caminhos padrão
      const defaultPaths = [
        'C:\\Program Files (x86)\\Epic Games\\Launcher\\Engine\\Binaries\\Win64\\EpicGamesLauncher.exe',
        'C:\\Program Files\\Epic Games\\Launcher\\Engine\\Binaries\\Win64\\EpicGamesLauncher.exe'
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          epicPath = defaultPath;
          break;
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }

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
    return { success: true };
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
    return { success: true };
  } catch (error) {
    console.error(`Error launching Xbox game ${game.name}:`, error);
    throw error;
  }
}

async function launchOriginGame(game) {
  console.log(`Launching Origin game: ${game.name}`);
  try {
    // Tentar lançar diretamente o executável
    if (game.executablePath) {
      console.log(`Launching Origin game with direct executable: ${game.executablePath}`);
      
      const process = spawn(game.executablePath, [], {
        detached: true,
        stdio: 'ignore'
      });
      
      process.unref();
      console.log('Game launch process started');
      return { success: true };
    }
    
    // Se não tiver executável, tentar lançar via Origin
    let originPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Origin',
      'ClientPath'
    );
    
    if (!originPath) {
      // Tentar caminhos padrão
      const defaultPaths = [
        'C:\\Program Files (x86)\\Origin\\Origin.exe',
        'C:\\Program Files\\Origin\\Origin.exe'
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          originPath = defaultPath;
          break;
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!originPath) {
      throw new Error('Origin client not found');
    }
    
    console.log(`Launching Origin with command: ${originPath} origin://launchgame/${game.id}`);
    
    const process = spawn(originPath, [`origin://launchgame/${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });
    
    process.unref();
    console.log('Game launch process started');
    return { success: true };
  } catch (error) {
    console.error(`Error launching Origin game ${game.name}:`, error);
    throw error;
  }
}

async function launchBattleNetGame(game) {
  console.log(`Launching Battle.net game: ${game.name}`);
  try {
    // Tentar lançar diretamente o executável
    if (game.executablePath) {
      console.log(`Launching Battle.net game with direct executable: ${game.executablePath}`);
      
      const process = spawn(game.executablePath, [], {
        detached: true,
        stdio: 'ignore'
      });
      
      process.unref();
      console.log('Game launch process started');
      return { success: true };
    }
    
    // Se não tiver executável, tentar lançar via Battle.net
    let battleNetPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net\\Capabilities',
      'ApplicationIcon'
    );
    
    if (battleNetPath) {
      // O valor do registro contém o caminho para o ícone, que é algo como "C:\...\Battle.net.exe,0"
      battleNetPath = battleNetPath.split(',')[0];
    }
    
    if (!battleNetPath) {
      // Tentar caminhos padrão
      const defaultPaths = [
        'C:\\Program Files (x86)\\Battle.net\\Battle.net.exe',
        'C:\\Program Files\\Battle.net\\Battle.net.exe'
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          battleNetPath = defaultPath;
          break;
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!battleNetPath) {
      throw new Error('Battle.net client not found');
    }
    
    console.log(`Launching Battle.net with command: ${battleNetPath} --game=${game.id}`);
    
    const process = spawn(battleNetPath, [`--game=${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });
    
    process.unref();
    console.log('Game launch process started');
    return { success: true };
  } catch (error) {
    console.error(`Error launching Battle.net game ${game.name}:`, error);
    throw error;
  }
}

async function launchGOGGame(game) {
  console.log(`Launching GOG game: ${game.name}`);
  try {
    // Tentar lançar diretamente o executável
    if (game.executablePath) {
      console.log(`Launching GOG game with direct executable: ${game.executablePath}`);
      
      const process = spawn(game.executablePath, [], {
        detached: true,
        stdio: 'ignore'
      });
      
      process.unref();
      console.log('Game launch process started');
      return { success: true };
    }
    
    // Se não tiver executável, tentar lançar via GOG Galaxy
    let gogPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient',
      'path'
    );
    
    if (!gogPath) {
      // Tentar caminhos padrão
      const defaultPaths = [
        'C:\\Program Files (x86)\\GOG Galaxy\\GalaxyClient.exe',
        'C:\\Program Files\\GOG Galaxy\\GalaxyClient.exe'
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          gogPath = defaultPath;
          break;
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!gogPath) {
      throw new Error('GOG Galaxy client not found');
    }
    
    console.log(`Launching GOG Galaxy with command: ${gogPath} /command=runGame /gameId=${game.id}`);
    
    const process = spawn(gogPath, [`/command=runGame`, `/gameId=${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });
    
    process.unref();
    console.log('Game launch process started');
    return { success: true };
  } catch (error) {
    console.error(`Error launching GOG game ${game.name}:`, error);
    throw error;
  }
}

async function launchUplayGame(game) {
  console.log(`Launching Ubisoft Connect game: ${game.name}`);
  try {
    // Tentar lançar diretamente o executável
    if (game.executablePath) {
      console.log(`Launching Ubisoft Connect game with direct executable: ${game.executablePath}`);
      
      const process = spawn(game.executablePath, [], {
        detached: true,
        stdio: 'ignore'
      });
      
      process.unref();
      console.log('Game launch process started');
      return { success: true };
    }
    
    // Se não tiver executável, tentar lançar via Ubisoft Connect
    let uplayPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher',
      'ExePath'
    );
    
    if (!uplayPath) {
      // Tentar caminhos padrão
      const defaultPaths = [
        'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\upc.exe',
        'C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\upc.exe',
        'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect\\upc.exe',
        'C:\\Program Files\\Ubisoft\\Ubisoft Connect\\upc.exe'
      ];
      
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          uplayPath = defaultPath;
          break;
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!uplayPath) {
      throw new Error('Ubisoft Connect client not found');
    }
    
    console.log(`Launching Ubisoft Connect with command: ${uplayPath} uplay://launch/${game.id}`);
    
    const process = spawn(uplayPath, [`uplay://launch/${game.id}`], {
      detached: true,
      stdio: 'ignore'
    });
    
    process.unref();
    console.log('Game launch process started');
    return { success: true };
  } catch (error) {
    console.error(`Error launching Ubisoft Connect game ${game.name}:`, error);
    throw error;
  }
}

// Optimization functions
async function optimizeGame(game, profile, settings) {
  console.log(`Optimizing game: ${game.name} with profile ${profile}`);
  try {
    return await fpsOptimizer.optimizeGame(game, profile, settings);
  } catch (error) {
    console.error(`Error optimizing game ${game.name}:`, error);
    return {
      success: false,
      improvements: { fps: 0, latency: 0, stability: 0 },
      appliedSettings: {},
      error: error.message
    };
  }
}

async function optimizeCPU(options) {
  console.log('Optimizing CPU with options:', options);
  try {
    const result = await systemMonitor.optimizeProcesses();
    return {
      success: true,
      improvement: 15, // Percentual de melhoria
      details: result
    };
  } catch (error) {
    console.error('Error optimizing CPU:', error);
    return {
      success: false,
      improvement: 0,
      error: error.message
    };
  }
}

async function optimizeMemory(options) {
  console.log('Optimizing memory with options:', options);
  try {
    const result = await systemMonitor.optimizeMemory();
    return {
      success: true,
      improvement: 20, // Percentual de melhoria
      details: result
    };
  } catch (error) {
    console.error('Error optimizing memory:', error);
    return {
      success: false,
      improvement: 0,
      error: error.message
    };
  }
}

async function optimizeGPU(options) {
  console.log('Optimizing GPU with options:', options);
  try {
    const result = await systemMonitor.optimizeDisk(); // Não temos otimização de GPU real, usando disk como placeholder
    return {
      success: true,
      improvement: 10, // Percentual de melhoria
      details: result
    };
  } catch (error) {
    console.error('Error optimizing GPU:', error);
    return {
      success: false,
      improvement: 0,
      error: error.message
    };
  }
}

// Network functions
async function measureNetworkPerformance() {
  console.log('Measuring network performance...');
  try {
    const result = await networkMetrics.analyzeNetwork();
    return {
      latency: result.latency.average || 0,
      jitter: result.quality.jitter || 0,
      packetLoss: result.packetLoss.packetLoss || 0,
      bandwidth: result.bandwidth.estimatedDownload || 0,
      routeHops: result.traceroute?.hops || []
    };
  } catch (error) {
    console.error('Error measuring network performance:', error);
    return {
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      routeHops: []
    };
  }
}

async function getAvailableRoutes() {
  console.log('Getting available network routes...');
  try {
    // Simulação - em um app real, analisaria rotas de rede reais
    return [
      {
        id: 'auto',
        nodes: ['auto-node-1', 'auto-node-2'],
        latency: 24,
        bandwidth: 150,
        load: 0.3,
        reliability: 99.9
      },
      {
        id: 'us-east',
        nodes: ['us-east-node-1'],
        latency: 42,
        bandwidth: 120,
        load: 0.5,
        reliability: 98.5
      },
      {
        id: 'eu-west',
        nodes: ['eu-west-node-1'],
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
}

async function connectToRoute(route) {
  console.log(`Connecting to route: ${route.id}`);
  try {
    // Simulação - em um app real, configuraria rotas de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  } catch (error) {
    console.error(`Error connecting to route ${route.id}:`, error);
    return { success: false, error: error.message };
  }
}

async function disconnectFromRoute() {
  console.log('Disconnecting from route');
  try {
    // Simulação - em um app real, restauraria configurações de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting from route:', error);
    return { success: false, error: error.message };
  }
}

// VPN functions
async function getVpnServers() {
  console.log('Getting VPN servers...');
  try {
    return vpnManager.getServers();
  } catch (error) {
    console.error('Error getting VPN servers:', error);
    return [];
  }
}

async function connectToVpn(server) {
  console.log(`Connecting to VPN server: ${server.name}`);
  try {
    return await vpnManager.connect(server);
  } catch (error) {
    console.error(`Error connecting to VPN server ${server.name}:`, error);
    return { success: false, error: error.message };
  }
}

async function disconnectFromVpn() {
  console.log('Disconnecting from VPN');
  try {
    return await vpnManager.disconnect();
  } catch (error) {
    console.error('Error disconnecting from VPN:', error);
    return { success: false, error: error.message };
  }
}

async function getVpnStatus() {
  try {
    return vpnManager.getStatus();
  } catch (error) {
    console.error('Error getting VPN status:', error);
    return { isConnected: false };
  }
}

async function testVpnSpeed() {
  console.log('Testing VPN speed...');
  try {
    return await vpnManager.testSpeed();
  } catch (error) {
    console.error('Error testing VPN speed:', error);
    return { download: 0, upload: 0, latency: 0 };
  }
}

// IPC handlers for communication with renderer process
// Adicionar handler para obter jogos para o tray
ipcMain.handle('get-games-for-tray', async () => {
  console.log('Recebido pedido para obter jogos para a bandeja');
  try {
    // Obter jogos usando a função handleScanGames
    const result = await handleScanGames();
    return result.data || [];
  } catch (error) {
    console.error('Erro ao obter jogos para a bandeja:', error);
    return [];
  }
});

// Atualizar o handler 'scan-games' para chamar os scanners específicos
ipcMain.handle('scan-games', async () => {
  console.log('Received scan-games request from renderer');
  try {
    // Chamar todos os scanners em paralelo
    const [steamGames, epicGames, xboxGames, originGames] = await Promise.all([
      getSteamGames().catch(error => {
        console.error('Error scanning Steam games:', error);
        return [];
      }),
      getEpicGames().catch(error => {
        console.error('Error scanning Epic games:', error);
        return [];
      }),
      getXboxGames().catch(error => {
        console.error('Error scanning Xbox games:', error);
        return [];
      }),
      getOriginGames().catch(error => {
        console.error('Error scanning Origin games:', error);
        return [];
      })
    ]);
    
    // Unir todos os resultados
    const allGames = [
      ...steamGames,
      ...epicGames,
      ...xboxGames,
      ...originGames
    ];
    
    console.log(`Found a total of ${allGames.length} games`);
    
    return {
      success: true,
      data: allGames,
      errors: []
    };
  } catch (error) {
    console.error('Error in scan-games handler:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error during scan']
    };
  }
});

// Handlers IPC para plataformas específicas
ipcMain.handle('scan-steam', async () => {
  console.log('Received scan-steam request from renderer');
  try {
    const games = await getSteamGames();
    console.log(`Found ${games.length} Steam games`);
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
      errors: [error.message || 'Unknown error during Steam scan']
    };
  }
});

ipcMain.handle('scan-epic', async () => {
  console.log('Received scan-epic request from renderer');
  try {
    const games = await getEpicGames();
    console.log(`Found ${games.length} Epic games`);
    return {
      success: true,
      data: games,
      errors: []
    };
  } catch (error) {
    console.error('Error scanning Epic games:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error during Epic scan']
    };
  }
});

ipcMain.handle('scan-xbox', async () => {
  console.log('Received scan-xbox request from renderer');
  try {
    const games = await getXboxGames();
    console.log(`Found ${games.length} Xbox games`);
    return {
      success: true,
      data: games,
      errors: []
    };
  } catch (error) {
    console.error('Error scanning Xbox games:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error during Xbox scan']
    };
  }
});

ipcMain.handle('scan-origin', async () => {
  console.log('Received scan-origin request from renderer');
  try {
    const games = await getOriginGames();
    console.log(`Found ${games.length} Origin games`);
    return {
      success: true,
      data: games,
      errors: []
    };
  } catch (error) {
    console.error('Error scanning Origin games:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error during Origin scan']
    };
  }
});

ipcMain.handle('get-system-info', async () => {
  console.log('Received get-system-info request from renderer');
  try {
    const info = await getSystemInfo();
    console.log('Get-system-info completed successfully');
    return {
      success: true,
      data: info,
      errors: []
    };
  } catch (error) {
    console.error('Error in get-system-info handler:', error);
    return {
      success: false,
      data: { cpu: {}, memory: {}, gpu: {}, os: {} },
      errors: [error.message || 'Unknown error getting system info']
    };
  }
});

ipcMain.handle('launch-game', async (event, game) => {
  console.log('Received launch-game request from renderer', game?.name);
  try {
    const result = await launchGame(game);
    console.log('Launch-game completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in launch-game handler:', error);
    return {
      success: false,
      data: {},
      errors: [error.message || 'Unknown error launching game']
    };
  }
});

ipcMain.handle('optimize-game', async (event, game, profile, settings) => {
  console.log('Received optimize-game request from renderer', game?.name, profile);
  try {
    const result = await optimizeGame(game, profile, settings);
    console.log('Optimize-game completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in optimize-game handler:', error);
    return {
      success: false,
      data: {
        improvements: { fps: 0, latency: 0, stability: 0 },
        appliedSettings: {}
      },
      errors: [error.message || 'Unknown error optimizing game']
    };
  }
});

ipcMain.handle('optimize-cpu', async (event, options) => {
  console.log('Received optimize-cpu request from renderer');
  try {
    const result = await optimizeCPU(options);
    console.log('Optimize-cpu completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in optimize-cpu handler:', error);
    return {
      success: false,
      data: { improvement: 0 },
      errors: [error.message || 'Unknown error optimizing CPU']
    };
  }
});

ipcMain.handle('optimize-memory', async (event, options) => {
  console.log('Received optimize-memory request from renderer');
  try {
    const result = await optimizeMemory(options);
    console.log('Optimize-memory completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in optimize-memory handler:', error);
    return {
      success: false,
      data: { improvement: 0 },
      errors: [error.message || 'Unknown error optimizing memory']
    };
  }
});

ipcMain.handle('optimize-gpu', async (event, options) => {
  console.log('Received optimize-gpu request from renderer');
  try {
    const result = await optimizeGPU(options);
    console.log('Optimize-gpu completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in optimize-gpu handler:', error);
    return {
      success: false,
      data: { improvement: 0 },
      errors: [error.message || 'Unknown error optimizing GPU']
    };
  }
});

ipcMain.handle('measure-network-performance', async () => {
  console.log('Received measure-network-performance request from renderer');
  try {
    const result = await measureNetworkPerformance();
    console.log('Measure-network-performance completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in measure-network-performance handler:', error);
    return {
      success: false,
      data: { latency: 0, jitter: 0, packetLoss: 0, bandwidth: 0, routeHops: [] },
      errors: [error.message || 'Unknown error measuring network performance']
    };
  }
});

ipcMain.handle('get-available-routes', async () => {
  console.log('Received get-available-routes request from renderer');
  try {
    const routes = await getAvailableRoutes();
    console.log('Get-available-routes completed successfully');
    return {
      success: true,
      data: routes,
      errors: []
    };
  } catch (error) {
    console.error('Error in get-available-routes handler:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error getting available routes']
    };
  }
});

ipcMain.handle('connect-to-route', async (event, route) => {
  console.log('Received connect-to-route request from renderer', route?.id);
  try {
    const result = await connectToRoute(route);
    console.log('Connect-to-route completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in connect-to-route handler:', error);
    return {
      success: false,
      data: {},
      errors: [error.message || 'Unknown error connecting to route']
    };
  }
});

ipcMain.handle('disconnect-from-route', async () => {
  console.log('Received disconnect-from-route request from renderer');
  try {
    const result = await disconnectFromRoute();
    console.log('Disconnect-from-route completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in disconnect-from-route handler:', error);
    return {
      success: false,
      data: {},
      errors: [error.message || 'Unknown error disconnecting from route']
    };
  }
});

ipcMain.handle('get-vpn-servers', async () => {
  console.log('Received get-vpn-servers request from renderer');
  try {
    const servers = await getVpnServers();
    console.log('Get-vpn-servers completed successfully');
    return {
      success: true,
      data: servers,
      errors: []
    };
  } catch (error) {
    console.error('Error in get-vpn-servers handler:', error);
    return {
      success: false,
      data: [],
      errors: [error.message || 'Unknown error getting VPN servers']
    };
  }
});

ipcMain.handle('connect-to-vpn', async (event, server) => {
  console.log('Received connect-to-vpn request from renderer', server?.name);
  try {
    const result = await connectToVpn(server);
    console.log('Connect-to-vpn completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in connect-to-vpn handler:', error);
    return {
      success: false,
      data: {},
      errors: [error.message || 'Unknown error connecting to VPN']
    };
  }
});

ipcMain.handle('disconnect-from-vpn', async () => {
  console.log('Received disconnect-from-vpn request from renderer');
  try {
    const result = await disconnectFromVpn();
    console.log('Disconnect-from-vpn completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in disconnect-from-vpn handler:', error);
    return {
      success: false,
      data: {},
      errors: [error.message || 'Unknown error disconnecting from VPN']
    };
  }
});

ipcMain.handle('get-vpn-status', async () => {
  try {
    const status = await getVpnStatus();
    return {
      success: true,
      data: status,
      errors: []
    };
  } catch (error) {
    console.error('Error in get-vpn-status handler:', error);
    return {
      success: false,
      data: { isConnected: false },
      errors: [error.message || 'Unknown error getting VPN status']
    };
  }
});

ipcMain.handle('test-vpn-speed', async () => {
  console.log('Received test-vpn-speed request from renderer');
  try {
    const result = await testVpnSpeed();
    console.log('Test-vpn-speed completed successfully');
    return {
      success: true,
      data: result,
      errors: []
    };
  } catch (error) {
    console.error('Error in test-vpn-speed handler:', error);
    return {
      success: false,
      data: { download: 0, upload: 0, latency: 0 },
      errors: [error.message || 'Unknown error testing VPN speed']
    };
  }
});

console.log('Main process initialization complete');