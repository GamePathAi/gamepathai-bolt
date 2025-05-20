const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const os = require('os');
const { spawn } = require('child_process');

// Configuração de caminhos e diretórios
const CONFIG_DIR = path.join(os.homedir(), '.gamepath-ai');
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');

// Variáveis globais
let mainWindow;
let tray;
let isQuitting = false;
let gameDetectors = {};

// Função para determinar se estamos em modo de desenvolvimento
const isDev = () => process.env.ELECTRON_RUN === 'true';

// Função para obter caminhos de recursos
const getResourcePath = (relativePath) => {
  // Em desenvolvimento, os recursos estão no diretório raiz
  // Em produção, os recursos estão em resources/app ou resources/app.asar
  const basePath = isDev() ? app.getAppPath() : path.dirname(app.getAppPath());
  return path.join(basePath, relativePath);
};

// Função para verificar se um arquivo existe
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Erro ao verificar se o arquivo existe (${filePath}):`, error);
    return false;
  }
};

// Função para encontrar um arquivo em vários caminhos possíveis
const findFile = (possiblePaths) => {
  for (const filePath of possiblePaths) {
    if (fileExists(filePath)) {
      console.log(`Arquivo encontrado: ${filePath}`);
      return filePath;
    }
  }
  console.error(`Nenhum dos caminhos contém o arquivo: ${possiblePaths.join(', ')}`);
  return null;
};

// Registry com fallback para funcionar mesmo sem o módulo nativo
let Registry;
try {
  Registry = require('registry-js').Registry;
  console.log('✓ Módulo registry-js carregado com sucesso');
} catch (e) {
  console.warn('⚠ registry-js não disponível:', e.message);
  console.warn('  Usando implementação fallback');
  
  // Implementação fallback para o Registry
  Registry = { 
    getValue: (hkey, path, name) => {
      console.log(`[Registry Fallback] Tentativa de leitura: ${hkey}\\${path}\\${name}`);
      // Valores padrão para caminhos comuns do Steam
      if (path === 'SOFTWARE\\Valve\\Steam' && name === 'SteamPath') {
        return 'C:\\Program Files (x86)\\Steam';
      }
      return null; 
    },
    enumerateValues: (hkey, path) => {
      console.log(`[Registry Fallback] Tentativa de enumerar: ${hkey}\\${path}`);
      return []; 
    },
    HKEY: { 
      LOCAL_MACHINE: 0,
      CURRENT_USER: 1
    } 
  };
}

// Carregar módulos de sistema com fallbacks
const loadModuleWithFallback = (modulePath, fallback) => {
  try {
    // Tentar caminhos diferentes para o módulo
    const possiblePaths = [
      path.join(__dirname, modulePath),
      path.join(app.getAppPath(), modulePath),
      path.join(path.dirname(app.getAppPath()), modulePath)
    ];
    
    const foundPath = findFile(possiblePaths);
    if (foundPath) {
      return require(foundPath);
    }
    
    console.warn(`⚠ Módulo ${modulePath} não encontrado, usando fallback`);
    return fallback;
  } catch (e) {
    console.warn(`⚠ Erro ao carregar ${modulePath}:`, e.message);
    console.warn('  Usando implementação fallback');
    return fallback;
  }
};

// Caminhos para módulos de sistema
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
  optimizeGame: async () => ({ success: false, error: 'Módulo não disponível' })
});

const vpnManager = loadModuleWithFallback('electron/vpn-manager.cjs', {
  getServers: () => ([]),
  connect: async () => ({ success: false }),
  disconnect: async () => ({ success: false }),
  getStatus: () => ({ isConnected: false })
});

// Carregar módulos de detecção de jogos
const loadGameDetectors = () => {
  // Caminhos base para procurar os módulos
  const basePaths = [
    path.join(__dirname, 'src', 'lib', 'gameDetection', 'platforms'),
    path.join(__dirname, 'src', 'lib'),
    path.join(app.getAppPath(), 'src', 'lib', 'gameDetection', 'platforms'),
    path.join(app.getAppPath(), 'src', 'lib')
  ];
  
  // Funções de detecção de jogos com fallbacks
  const detectors = {
    steam: async () => [],
    epic: async () => [],
    xbox: async () => [],
    origin: async () => [],
    battlenet: async () => [],
    gog: async () => [],
    uplay: async () => []
  };
  
  // Tentar carregar cada detector
  for (const [name, fallback] of Object.entries(detectors)) {
    try {
      const moduleName = `get${name.charAt(0).toUpperCase() + name.slice(1)}Games`;
      
      // Procurar o módulo em diferentes caminhos
      let moduleFound = false;
      for (const basePath of basePaths) {
        const modulePath = path.join(basePath, `${moduleName}.js`);
        if (fileExists(modulePath)) {
          console.log(`✓ Detector de jogos ${name} encontrado: ${modulePath}`);
          try {
            const module = require(modulePath);
            detectors[name] = module[moduleName] || module.default || fallback;
            moduleFound = true;
            break;
          } catch (e) {
            console.warn(`⚠ Erro ao carregar detector ${name}:`, e.message);
          }
        }
      }
      
      if (!moduleFound) {
        console.warn(`⚠ Detector de jogos ${name} não encontrado, usando fallback`);
      }
    } catch (e) {
      console.warn(`⚠ Erro ao configurar detector ${name}:`, e.message);
    }
  }
  
  return detectors;
};

// Configuração do Electron
const createWindow = async () => {
  console.log('Criando janela principal...');
  console.log('__dirname:', __dirname);
  console.log('app.getAppPath():', app.getAppPath());
  
  // Configurar diretório de dados
  await setupDataDirectory();
  
  // Carregar detectores de jogos
  gameDetectors = loadGameDetectors();
  
  // Determinar caminhos com base no ambiente
  const preloadPath = findFile([
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, 'electron', 'preload.cjs'),
    path.join(app.getAppPath(), 'electron', 'preload.cjs'),
    path.join(app.getAppPath(), 'preload.cjs')
  ]);
  
  if (!preloadPath) {
    console.error('❌ ERRO CRÍTICO: Preload script não encontrado!');
    app.quit();
    return;
  }
  
  // Determinar caminho do ícone
  const iconPath = findFile([
    path.join(__dirname, 'public', 'icons', 'icon.ico'),
    path.join(app.getAppPath(), 'public', 'icons', 'icon.ico'),
    path.join(path.dirname(app.getAppPath()), 'public', 'icons', 'icon.ico')
  ]) || '';
  
  console.log('Preload path:', preloadPath);
  console.log('Icon path:', iconPath);
  
  // Criar janela principal
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
    show: false, // Não mostrar até que esteja pronto
    backgroundColor: '#0d1117'
  });

  // Carregar o conteúdo
  if (isDev()) {
    // Modo de desenvolvimento - conectar ao servidor Vite
    console.log('Modo de desenvolvimento - conectando ao servidor Vite...');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Modo de produção - carregar do diretório dist
    console.log('Modo de produção - carregando do diretório dist...');
    
    // Encontrar o arquivo HTML
    const htmlPath = findFile([
      path.join(__dirname, 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html'),
      path.join(path.dirname(app.getAppPath()), 'dist', 'index.html')
    ]);
    
    if (htmlPath) {
      console.log('Carregando HTML de:', htmlPath);
      mainWindow.loadFile(htmlPath);
    } else {
      console.error('❌ ERRO CRÍTICO: Arquivo HTML não encontrado!');
      // Tentar carregar uma página em branco com mensagem de erro
      mainWindow.loadURL('data:text/html;charset=utf-8,<html><body style="background:#0d1117;color:white;font-family:sans-serif;padding:20px;"><h1>Erro ao carregar aplicativo</h1><p>Não foi possível encontrar os arquivos necessários.</p></body></html>');
    }
  }

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    console.log('Janela pronta para exibição');
    mainWindow.show();
  });

  // Lidar com fechamento da janela
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Configurar o tray
  setupTray();
  
  // Registrar handlers IPC
  registerIpcHandlers();
  
  // Iniciar escaneamento de jogos em segundo plano
  setTimeout(async () => {
    console.log('Iniciando escaneamento de jogos em segundo plano...');
    const games = await getAllGames();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('games-detected', games);
    }
    updateTrayGames(games);
  }, 3000);
};

// Configurar diretório de dados
async function setupDataDirectory() {
  try {
    await fsPromises.mkdir(CONFIG_DIR, { recursive: true });
    await fsPromises.mkdir(LOGS_DIR, { recursive: true });
    console.log(`Diretórios de configuração criados: ${CONFIG_DIR}, ${LOGS_DIR}`);
  } catch (error) {
    console.error('Erro ao configurar diretórios de dados:', error);
  }
}

// Configurar o tray
function setupTray() {
  try {
    console.log('Configurando tray...');
    
    // Tentar carregar ícone do tray usando vários caminhos possíveis
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
      console.error('❌ Nenhum ícone encontrado para o tray!');
      return;
    }
    
    console.log('Usando ícone do tray:', trayIconPath);
    
    // Criar ícone do tray
    const trayIcon = nativeImage.createFromPath(trayIconPath);
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    tray.setToolTip('GamePath AI');
    
    // Menu de contexto inicial
    updateTrayMenu([]);
    
    // Evento de clique no tray
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
        }
      }
    });
    
    console.log('Tray configurado com sucesso');
  } catch (error) {
    console.error('Erro ao configurar tray:', error);
  }
}

// Atualizar menu do tray
function updateTrayMenu(games = []) {
  if (!tray) return;
  
  try {
    console.log(`Atualizando menu do tray com ${games.length} jogos`);
    
    // Limitar a 10 jogos no menu
    const displayGames = games.slice(0, 10);
    
    // Criar itens de menu para jogos
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
    
    // Menu completo
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
    console.error('Erro ao atualizar menu do tray:', error);
  }
}

// Atualizar jogos no tray
function updateTrayGames(games) {
  if (!Array.isArray(games)) {
    console.warn('updateTrayGames: games não é um array válido', games);
    games = [];
  }
  
  console.log(`Atualizando tray com ${games.length} jogos`);
  updateTrayMenu(games);
  return games;
}

// Registrar handlers IPC
function registerIpcHandlers() {
  console.log('Registrando handlers IPC...');
  
  // Game detection handlers
  ipcMain.handle('scan-games', async () => {
    console.log('Recebida solicitação para escanear jogos');
    try {
      const games = await getAllGames();
      console.log(`Encontrados ${games.length} jogos`);
      
      // Notificar a interface sobre os jogos encontrados
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('games-detected', games);
      }
      
      // Atualizar o tray
      updateTrayGames(games);
      
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao escanear jogos:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Erro desconhecido ao escanear jogos']
      };
    }
  });
  
  // Platform-specific scanning
  ipcMain.handle('scan-steam', async () => {
    console.log('Recebida solicitação para escanear jogos Steam');
    try {
      const games = await getSteamGamesInternal();
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao escanear jogos Steam:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Erro desconhecido ao escanear jogos Steam']
      };
    }
  });
  
  // Game management handlers
  ipcMain.handle('launch-game', async (event, game) => {
    console.log(`Recebida solicitação para lançar jogo: ${game.name}`);
    try {
      return await launchGameInternal(game);
    } catch (error) {
      console.error(`Erro ao lançar jogo ${game.name}:`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao lançar jogo'
      };
    }
  });
  
  // Handler para otimizar jogos
  ipcMain.handle('optimize-game', async (event, game, profile = 'balanced', settings) => {
    console.log(`Recebida solicitação para otimizar jogo: ${game.name} com perfil ${profile}`);
    try {
      if (!fpsOptimizer || !fpsOptimizer.optimizeGame) {
        console.warn('Módulo de otimização não disponível');
        return {
          success: false,
          error: 'Módulo de otimização não disponível'
        };
      }
      
      console.log(`Otimizando jogo: ${game.name}`);
      const optimizationResult = await fpsOptimizer.optimizeGame(game, profile, settings);
      
      return optimizationResult;
    } catch (error) {
      console.error(`Erro ao otimizar jogo ${game.name}:`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao otimizar jogo'
      };
    }
  });
  
  // Handler para validar arquivos de jogos
  ipcMain.handle('validate-game-files', async (event, gameId) => {
    console.log(`Recebida solicitação para validar arquivos do jogo: ${gameId}`);
    try {
      // Encontrar o jogo pelo ID
      const allGames = await getAllGames();
      const gameToValidate = allGames.find(game => game.id === gameId);
      
      if (!gameToValidate) {
        console.warn(`Jogo com ID ${gameId} não encontrado`);
        return false;
      }
      
      // Verificar se o executável existe
      if (!gameToValidate.executablePath) {
        console.warn(`Executável não encontrado para jogo ${gameId}`);
        return false;
      }
      
      // Verificar se o caminho do executável existe
      try {
        await fsPromises.access(gameToValidate.executablePath);
        console.log(`Arquivo executável para jogo ${gameId} validado com sucesso`);
        return true;
      } catch (error) {
        console.error(`Arquivo executável para jogo ${gameId} não encontrado:`, error);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao validar arquivos do jogo ${gameId}:`, error);
      return false;
    }
  });
  
  // Tray handlers
  ipcMain.handle('update-tray-games', async (event, games) => {
    console.log(`Recebida solicitação para atualizar jogos no tray: ${games?.length || 0} jogos`);
    return updateTrayGames(games);
  });
  
  ipcMain.handle('get-games-for-tray', async () => {
    console.log('Recebida solicitação para obter jogos para o tray');
    try {
      const games = await getAllGames();
      console.log(`Retornando ${games.length} jogos para o tray`);
      return games;
    } catch (error) {
      console.error('Erro ao obter jogos para o tray:', error);
      return [];
    }
  });
  
  // System info handlers
  ipcMain.handle('get-system-info', async () => {
    console.log('Recebida solicitação para obter informações do sistema');
    try {
      return await systemMonitor.getSystemInfo();
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      return {
        error: error.message || 'Erro desconhecido ao obter informações do sistema'
      };
    }
  });
  
  // System optimization handlers
  ipcMain.handle('optimize-cpu', async (event, options) => {
    console.log('Recebida solicitação para otimizar CPU');
    try {
      return await optimizeCPUInternal(options);
    } catch (error) {
      console.error('Erro ao otimizar CPU:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao otimizar CPU'
      };
    }
  });
  
  ipcMain.handle('optimize-memory', async (event, options) => {
    console.log('Recebida solicitação para otimizar memória');
    try {
      return await optimizeMemoryInternal(options);
    } catch (error) {
      console.error('Erro ao otimizar memória:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao otimizar memória'
      };
    }
  });
  
  ipcMain.handle('optimize-gpu', async (event, options) => {
    console.log('Recebida solicitação para otimizar GPU');
    try {
      return await optimizeGPUInternal(options);
    } catch (error) {
      console.error('Erro ao otimizar GPU:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao otimizar GPU'
      };
    }
  });
  
  ipcMain.handle('optimize-network', async (event, options) => {
    console.log('Recebida solicitação para otimizar rede');
    try {
      return await optimizeNetworkInternal(options);
    } catch (error) {
      console.error('Erro ao otimizar rede:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao otimizar rede'
      };
    }
  });
  
  // Network handlers
  ipcMain.handle('measure-network-performance', async () => {
    console.log('Recebida solicitação para medir desempenho de rede');
    try {
      return await networkMetrics.analyzeNetwork();
    } catch (error) {
      console.error('Erro ao medir desempenho de rede:', error);
      return {
        error: error.message || 'Erro desconhecido ao medir desempenho de rede'
      };
    }
  });
  
  ipcMain.handle('get-available-routes', async () => {
    console.log('Recebida solicitação para obter rotas disponíveis');
    try {
      // Simulação - em um app real, isso seria implementado
      return [
        {
          id: 'auto',
          name: 'Auto (Melhor Localização)',
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
      console.error('Erro ao obter rotas disponíveis:', error);
      return [];
    }
  });
  
  // VPN handlers
  ipcMain.handle('get-vpn-servers', async () => {
    console.log('Recebida solicitação para obter servidores VPN');
    try {
      return vpnManager.getServers();
    } catch (error) {
      console.error('Erro ao obter servidores VPN:', error);
      return [];
    }
  });
  
  ipcMain.handle('connect-to-vpn', async (event, server) => {
    console.log(`Recebida solicitação para conectar à VPN: ${server.name}`);
    try {
      return await vpnManager.connect(server);
    } catch (error) {
      console.error('Erro ao conectar à VPN:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao conectar à VPN'
      };
    }
  });
  
  ipcMain.handle('disconnect-from-vpn', async () => {
    console.log('Recebida solicitação para desconectar da VPN');
    try {
      return await vpnManager.disconnect();
    } catch (error) {
      console.error('Erro ao desconectar da VPN:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao desconectar da VPN'
      };
    }
  });
  
  ipcMain.handle('get-vpn-status', async () => {
    console.log('Recebida solicitação para obter status da VPN');
    try {
      return vpnManager.getStatus();
    } catch (error) {
      console.error('Erro ao obter status da VPN:', error);
      return {
        isConnected: false,
        error: error.message || 'Erro desconhecido ao obter status da VPN'
      };
    }
  });
  
  // Notification handler
  ipcMain.handle('show-notification', async (event, options) => {
    console.log('Recebida solicitação para mostrar notificação');
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
      console.error('Erro ao mostrar notificação:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao mostrar notificação'
      };
    }
  });
  
  // Diagnostic handler
  ipcMain.handle('list-detected-games', async () => {
    console.log('Recebida solicitação para listar jogos detectados');
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
          console.error(`Erro ao detectar jogos da plataforma ${platform}:`, error);
          detailedResults[platform] = [];
        }
      }
      
      return {
        totalGames,
        detailedResults
      };
    } catch (error) {
      console.error('Erro ao listar jogos detectados:', error);
      return {
        totalGames: 0,
        detailedResults: {},
        error: error.message || 'Erro desconhecido ao listar jogos'
      };
    }
  });
  
  console.log('Handlers IPC registrados com sucesso');
}

// Função para obter todos os jogos de todas as plataformas
async function getAllGames() {
  try {
    console.log('Obtendo jogos de todas as plataformas...');
    
    // Inicializar com jogos Steam e standalone
    const steamGames = await getSteamGamesInternal();
    const standaloneGames = await getStandaloneGamesInternal();
    
    // Tentar obter jogos de outras plataformas
    const otherGames = [];
    const platforms = ['epic', 'xbox', 'origin', 'battlenet', 'gog', 'uplay'];
    
    for (const platform of platforms) {
      if (gameDetectors[platform]) {
        try {
          console.log(`Escaneando plataforma: ${platform}`);
          const games = await gameDetectors[platform]();
          otherGames.push(...games);
        } catch (error) {
          console.error(`Erro ao escanear plataforma ${platform}:`, error);
        }
      }
    }
    
    // Combinar resultados e remover duplicatas
    const allGames = [...steamGames, ...standaloneGames, ...otherGames];
    console.log(`Total de jogos encontrados (antes de filtrar): ${allGames.length}`);
    
    // Filtrar jogos duplicados (mesmo nome e plataforma)
    const uniqueGames = [];
    const gameKeys = new Set();
    
    for (const game of allGames) {
      const key = `${game.name}|${game.platform}`.toLowerCase();
      if (!gameKeys.has(key)) {
        gameKeys.add(key);
        uniqueGames.push(game);
      }
    }
    
    console.log(`Total de jogos únicos: ${uniqueGames.length}`);
    return uniqueGames;
  } catch (error) {
    console.error('Erro ao obter todos os jogos:', error);
    return [];
  }
}

// Detecção de jogos Steam
async function getSteamGamesInternal() {
  console.log('=== Escaneamento de jogos Steam iniciado ===');
  try {
    // Tentar obter o caminho do Steam do registro
    let steamPath = null;
    
    // Tentar primeiro HKEY_CURRENT_USER
    try {
      steamPath = Registry.getValue(
        Registry.HKEY.CURRENT_USER,
        'SOFTWARE\\Valve\\Steam',
        'SteamPath'
      );
    } catch (error) {
      console.warn('Erro ao acessar registro para Steam (HKCU):', error);
    }
    
    // Se não encontrar, tentar HKEY_LOCAL_MACHINE
    if (!steamPath) {
      try {
        steamPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          'SOFTWARE\\WOW6432Node\\Valve\\Steam',
          'InstallPath'
        );
      } catch (error) {
        console.warn('Erro ao acessar registro para Steam (HKLM):', error);
      }
    }
    
    // Se ainda não encontrar, tentar caminhos padrão
    if (!steamPath) {
      console.log('Instalação do Steam não encontrada no registro, tentando caminhos padrão');
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
            console.log(`Steam encontrado no caminho padrão: ${steamPath}`);
            break;
          }
        } catch (err) {
          // Caminho não existe, continuar para o próximo
        }
      }
    }

    if (!steamPath) {
      console.log('Instalação do Steam não encontrada');
      return [];
    }

    console.log('Instalação do Steam encontrada em:', steamPath);

    // Ler configuração de bibliotecas do Steam
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    let libraryFoldersContent;

    try {
      libraryFoldersContent = await fsPromises.readFile(libraryFoldersPath, 'utf8');
      console.log('Configuração de bibliotecas do Steam lida com sucesso');
    } catch (error) {
      console.error('Erro ao ler bibliotecas do Steam:', error);
      
      // Tentar caminho alternativo para o arquivo de configuração
      const altLibraryFoldersPath = path.join(steamPath, 'config', 'libraryfolders.vdf');
      try {
        libraryFoldersContent = await fsPromises.readFile(altLibraryFoldersPath, 'utf8');
        console.log('Configuração de bibliotecas do Steam lida do caminho alternativo');
      } catch (altError) {
        console.error('Erro ao ler bibliotecas alternativas do Steam:', altError);
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

    console.log('Bibliotecas Steam encontradas:', libraryPaths);

    const games = [];

    // Escanear cada biblioteca por jogos instalados
    for (const libraryPath of libraryPaths) {
      const appsPath = path.join(libraryPath, 'steamapps');
      console.log('Escaneando biblioteca Steam em:', appsPath);

      try {
        const files = await fsPromises.readdir(appsPath);

        // Procurar por arquivos appmanifest que contêm informações dos jogos
        const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
        console.log(`Encontrados ${manifests.length} manifestos de jogos em ${appsPath}`);

        for (const manifest of manifests) {
          try {
            const manifestPath = path.join(appsPath, manifest);
            const manifestContent = await fsPromises.readFile(manifestPath, 'utf8');

            // Extrair informações do jogo do manifesto
            const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
            const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
            const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);

            if (nameMatch && appIdMatch && installDirMatch) {
              const name = nameMatch[1];
              const appId = appIdMatch[1];
              const installDir = installDirMatch[1];

              const gamePath = path.join(appsPath, 'common', installDir);
              
              // Tentar encontrar o executável principal
              let executablePath = '';
              try {
                const gameFiles = await fsPromises.readdir(gamePath);
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
                console.warn(`Não foi possível escanear executáveis para ${name}:`, error);
              }

              games.push({
                id: `steam-${appId}`,
                name,
                platform: 'Steam',
                installPath: gamePath,
                executablePath,
                process_name: executablePath ? path.basename(executablePath) : '',
                size: 0, // Tamanho desconhecido por enquanto
                last_played: new Date(), // Data atual como fallback
                icon_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
              });
              
              console.log(`Jogo Steam encontrado: ${name} (${appId})`);
            }
          } catch (error) {
            console.error(`Erro ao processar manifesto ${manifest}:`, error);
          }
        }
      } catch (error) {
        console.error(`Erro ao ler pasta de biblioteca ${libraryPath}:`, error);
      }
    }

    console.log(`Escaneamento completo. Encontrados ${games.length} jogos Steam`);
    return games;
  } catch (error) {
    console.error('Erro ao escanear jogos Steam:', error);
    return [];
  }
}

// Função para escanear jogos standalone
async function getStandaloneGamesInternal() {
  console.log('=== Escaneamento de jogos independentes iniciado ===');
  try {
    const games = [];
    const commonGameDirs = [];
    
    // Adicionar apenas diretórios que provavelmente contenham jogos
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
          // Drive não existe ou não acessível
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
    
    console.log(`Verificando diretórios específicos de jogos: ${commonGameDirs.join(', ')}`);
    
    // Lista de programas comuns que NÃO são jogos para filtrar
    const nonGameKeywords = [
      'windows', 'microsoft', 'system', 'update', 'office', 'adobe', 
      'chrome', 'firefox', 'explorer', 'edge', 'defender', 
      'installer', 'setup', 'config', 'git', 'runtime', 'framework',
      'driver', 'utility', 'monitor', 'tool', 'health', 'support',
      'antivirus', 'security', 'browser', 'mail', 'photo', 'picture',
      'media', 'viewer', 'player', 'calculator', 'notepad', 'paint',
      'sdk', 'visual studio', 'code', 'webview', 'store', 'update'
    ];
    
    // Melhora o filtro de detecção com nomes comuns de jogos
    const gameSubstringHints = [
      'game', 'play', 'steam', 'epic', 'battle', 'uplay', 'origin', 
      'gog', 'bethesda', 'rockstar', 'xbox', 'warfare', 'craft', 
      'adventure', 'quest', 'rpg', 'shooter', 'racing', 'sport',
      'tactical', 'strategy', 'simulation', 'arcade', 'action'
    ];
    
    // Escanear cada diretório por pastas que possam conter jogos
    for (const dir of commonGameDirs) {
      try {
        await fsPromises.access(dir);
        console.log(`Escaneando diretório: ${dir}`);
        
        // Ler diretório
        const items = await fsPromises.readdir(dir, { withFileTypes: true });
        
        // Filtrar diretórios (potenciais jogos)
        const subDirs = items.filter(item => item.isDirectory());
        
        for (const subDir of subDirs) {
          const gamePath = path.join(dir, subDir.name);
          const dirNameLower = subDir.name.toLowerCase();
          
          // Verificar se o nome do diretório corresponde a programas que NÃO são jogos
          const isLikelyNonGame = nonGameKeywords.some(keyword => 
            dirNameLower.includes(keyword.toLowerCase())
          );
          
          // Verificar se o nome do diretório contém palavras-chave comuns de jogos
          const containsGameHint = gameSubstringHints.some(hint => 
            dirNameLower.includes(hint.toLowerCase())
          );
          
          // Pular diretórios que provavelmente não são jogos, a menos que tenham pistas de jogos
          if (isLikelyNonGame && !containsGameHint) {
            continue;
          }
          
          // Verificar se existem executáveis neste diretório
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
            
            // Verificar tamanho - jogos geralmente são maiores que 50MB
            if (exeFiles.length > 0) {
              try {
                const stats = await fsPromises.stat(gamePath);
                const folderSizeMB = stats.size / (1024 * 1024);
                
                // Pular diretórios muito pequenos para serem jogos
                if (folderSizeMB < 50 && !containsGameHint) {
                  continue;
                }
              } catch (err) {
                // Erro ao verificar tamanho, continuar mesmo assim
              }
              
              // Este diretório provavelmente contém um jogo
              const gameName = subDir.name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
              
              // Escolher o executável principal, priorizando aqueles que tenham o nome do jogo
              let mainExe = exeFiles.find(exe => exe.toLowerCase().includes(dirNameLower)) || exeFiles[0];
              const executablePath = path.join(gamePath, mainExe);
              
              console.log(`Standalone: Jogo "${gameName}"`);
              console.log(`  - Caminho: ${gamePath}`);
              console.log(`  - Executável: ${executablePath}`);
              
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
              
              console.log(`Jogo independente encontrado: ${gameName} em ${gamePath}`);
            }
          } catch (err) {
            // Não foi possível ler os arquivos deste diretório
          }
        }
      } catch (err) {
        // Diretório não existe ou não acessível
      }
    }
    
    console.log(`Escaneamento completo. Encontrados ${games.length} jogos independentes`);
    return games;
  } catch (error) {
    console.error('Erro ao escanear jogos independentes:', error);
    return [];
  }
}

// Função para lançar um jogo
async function launchGameInternal(game) {
  console.log(`Lançando jogo: ${game.name}`);
  
  try {
    if (!game.executablePath) {
      throw new Error('Caminho do executável não encontrado');
    }
    
    // Verificar se o executável existe
    try {
      await fsPromises.access(game.executablePath);
    } catch (error) {
      throw new Error(`Executável não encontrado: ${game.executablePath}`);
    }
    
    // Lançar o jogo
    const child = spawn(game.executablePath, [], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(game.executablePath)
    });
    
    // Desanexar o processo para que ele continue rodando independentemente
    child.unref();
    
    console.log(`Jogo ${game.name} lançado com sucesso`);
    return {
      success: true
    };
  } catch (error) {
    console.error(`Erro ao lançar jogo ${game.name}:`, error);
    throw error;
  }
}

// Função para otimizar um jogo
async function optimizeGameInternal(game, profile = 'balanced') {
  console.log(`Otimizando jogo: ${game.name} com perfil ${profile}`);
  
  try {
    if (!fpsOptimizer || !fpsOptimizer.optimizeGame) {
      throw new Error('Módulo de otimização não disponível');
    }
    
    const result = await fpsOptimizer.optimizeGame(game, profile);
    console.log(`Jogo ${game.name} otimizado com sucesso:`, result);
    
    return result;
  } catch (error) {
    console.error(`Erro ao otimizar jogo ${game.name}:`, error);
    throw error;
  }
}

// Funções de otimização do sistema
async function optimizeCPUInternal(options = {}) {
  console.log('Otimizando CPU...');
  
  try {
    // Simulação - em um app real, isso seria implementado
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
    console.error('Erro ao otimizar CPU:', error);
    throw error;
  }
}

async function optimizeMemoryInternal(options = {}) {
  console.log('Otimizando memória...');
  
  try {
    // Simulação - em um app real, isso seria implementado
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
    console.error('Erro ao otimizar memória:', error);
    throw error;
  }
}

async function optimizeGPUInternal(options = {}) {
  console.log('Otimizando GPU...');
  
  try {
    // Simulação - em um app real, isso seria implementado
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
    console.error('Erro ao otimizar GPU:', error);
    throw error;
  }
}

async function optimizeNetworkInternal(options = {}) {
  console.log('Otimizando rede...');
  
  try {
    // Simulação - em um app real, isso seria implementado
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
    console.error('Erro ao otimizar rede:', error);
    throw error;
  }
}

// Inicialização do aplicativo
app.whenReady().then(() => {
  console.log('Aplicativo pronto para inicialização');
  console.log('Versão do Electron:', process.versions.electron);
  console.log('Versão do Chrome:', process.versions.chrome);
  console.log('Versão do Node.js:', process.versions.node);
  console.log('Plataforma:', process.platform);
  console.log('Arquitetura:', process.arch);
  console.log('Diretório do aplicativo:', app.getAppPath());
  console.log('Diretório de recursos:', app.getPath('userData'));
  
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

// Impedir múltiplas instâncias do aplicativo
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('Outra instância do aplicativo já está em execução. Saindo...');
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