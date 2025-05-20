const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { Registry } = require('registry-js');
const { getSteamGames } = require('./src/lib/gameDetection/platforms/getSteamGames');
const { getEpicGames } = require('./src/lib/gameDetection/platforms/getEpicGames');
const { getXboxGames } = require('./src/lib/gameDetection/platforms/getXboxGames');
const { getOriginGames } = require('./src/lib/gameDetection/platforms/getOriginGames');
const { getBattleNetGames } = require('./src/lib/gameDetection/platforms/getBattleNetGames');
const { getGOGGames } = require('./src/lib/gameDetection/platforms/getGOGGames');
const { getUplayGames } = require('./src/lib/gameDetection/platforms/getUplayGames');
const systemMonitor = require('./electron/system-monitor.cjs');
const networkMetrics = require('./electron/network-metrics.cjs');
const fpsOptimizer = require('./electron/fps-optimizer.cjs');
const vpnManager = require('./electron/vpn-manager.cjs');
const { CONFIG_DIR } = require('./electron/config.cjs');
const { spawn } = require('child_process');

// Variáveis globais
let mainWindow;
let tray;
let isQuitting = false;
let gameDetectors = {
  steam: getSteamGames,
  epic: getEpicGames,
  xbox: getXboxGames,
  origin: getOriginGames,
  battlenet: getBattleNetGames,
  gog: getGOGGames,
  uplay: getUplayGames,
  standalone: getStandaloneGamesInternal
};

// Configuração do Electron
const createWindow = async () => {
  console.log('Criando janela principal...');
  
  // Configurar diretório de dados
  await setupDataDirectory();
  
  // Criar janela principal
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, 'public/icons/icon.ico'),
    show: false, // Não mostrar até que esteja pronto
    backgroundColor: '#0d1117'
  });

  // Carregar o conteúdo
  if (process.env.ELECTRON_RUN === 'true') {
    // Modo de desenvolvimento - conectar ao servidor Vite
    console.log('Modo de desenvolvimento - conectando ao servidor Vite...');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Modo de produção - carregar do diretório dist
    console.log('Modo de produção - carregando do diretório dist...');
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
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
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    console.log(`Diretório de configuração criado: ${CONFIG_DIR}`);
  } catch (error) {
    console.error('Erro ao configurar diretório de dados:', error);
  }
}

// Configurar o tray
function setupTray() {
  try {
    console.log('Configurando tray...');
    
    // Tentar carregar ícone do tray
    let trayIconPath = path.join(__dirname, 'public/icons/tray-icon.png');
    if (!fs.existsSync(trayIconPath)) {
      console.warn('Ícone do tray não encontrado, usando ícone padrão');
      trayIconPath = path.join(__dirname, 'public/icons/icon.ico');
    }
    
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
      const games = await getSteamGames();
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
  
  ipcMain.handle('scan-epic', async () => {
    console.log('Recebida solicitação para escanear jogos Epic');
    try {
      const games = await getEpicGames();
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao escanear jogos Epic:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Erro desconhecido ao escanear jogos Epic']
      };
    }
  });
  
  ipcMain.handle('scan-xbox', async () => {
    console.log('Recebida solicitação para escanear jogos Xbox');
    try {
      const games = await getXboxGames();
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao escanear jogos Xbox:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Erro desconhecido ao escanear jogos Xbox']
      };
    }
  });
  
  ipcMain.handle('scan-origin', async () => {
    console.log('Recebida solicitação para escanear jogos Origin');
    try {
      const games = await getOriginGames();
      return {
        success: true,
        data: games,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao escanear jogos Origin:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Erro desconhecido ao escanear jogos Origin']
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
        await fs.access(gameToValidate.executablePath);
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
        icon: options.icon || path.join(__dirname, 'public/icons/icon.ico')
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
    
    const platforms = ['steam', 'epic', 'xbox', 'origin', 'battlenet', 'gog', 'uplay', 'standalone'];
    const results = await Promise.all(
      platforms.map(platform => {
        if (gameDetectors[platform]) {
          console.log(`Escaneando plataforma: ${platform}`);
          return gameDetectors[platform]().catch(error => {
            console.error(`Erro ao escanear plataforma ${platform}:`, error);
            return [];
          });
        }
        return Promise.resolve([]);
      })
    );
    
    // Combinar resultados e remover duplicatas
    const allGames = results.flat();
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

// Função para lançar um jogo
async function launchGameInternal(game) {
  console.log(`Lançando jogo: ${game.name}`);
  
  try {
    if (!game.executablePath) {
      throw new Error('Caminho do executável não encontrado');
    }
    
    // Verificar se o executável existe
    try {
      await fs.access(game.executablePath);
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
          await fs.access(drive);
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
        await fs.access(dir);
        console.log(`Escaneando diretório: ${dir}`);
        
        // Ler diretório
        const items = await fs.readdir(dir, { withFileTypes: true });
        
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
            const gameFiles = await fs.readdir(gamePath);
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
                const stats = await fs.stat(gamePath);
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

// Inicialização do aplicativo
app.whenReady().then(() => {
  console.log('Aplicativo pronto para inicialização');
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