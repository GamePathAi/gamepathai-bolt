const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { spawn } = require('child_process');

// CONFIG_DIR para armazenar configurações
const CONFIG_DIR = path.join(os.homedir(), '.gamepath-ai');

// Variáveis globais
let mainWindow;
let tray;
let isQuitting = false;

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

// Caminhos para módulos de sistema
let systemMonitor = {};
let networkMetrics = {};
let fpsOptimizer = {};
let vpnManager = {};

// Tentar carregar módulos de sistema
try {
  systemMonitor = require('./electron/system-monitor.cjs');
} catch (e) {
  console.warn('⚠ system-monitor.cjs não disponível, usando fallback');
  systemMonitor = {
    getSystemInfo: async () => ({ cpu: {}, memory: {}, gpu: {} })
  };
}

try {
  networkMetrics = require('./electron/network-metrics.cjs');
} catch (e) {
  console.warn('⚠ network-metrics.cjs não disponível, usando fallback');
  networkMetrics = {
    analyzeNetwork: async () => ({})
  };
}

try {
  fpsOptimizer = require('./electron/fps-optimizer.cjs');
} catch (e) {
  console.warn('⚠ fps-optimizer.cjs não disponível, usando fallback');
  fpsOptimizer = {
    optimizeGame: async () => ({ success: false, error: 'Módulo não disponível' })
  };
}

try {
  vpnManager = require('./electron/vpn-manager.cjs');
} catch (e) {
  console.warn('⚠ vpn-manager.cjs não disponível, usando fallback');
  vpnManager = {
    getServers: () => ([]),
    connect: async () => ({ success: false }),
    disconnect: async () => ({ success: false }),
    getStatus: () => ({ isConnected: false })
  };
}

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
      preload: path.join(__dirname, 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, 'public', 'icons', 'icon.ico'),
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
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
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
    let trayIconPath = path.join(__dirname, 'public', 'icons', 'tray-icon.png');
    try {
      const iconExists = fs.existsSync(trayIconPath);
      if (!iconExists) {
        console.warn('Ícone do tray não encontrado, usando ícone padrão');
        trayIconPath = path.join(__dirname, 'public', 'icons', 'icon.ico');
      }
    } catch (err) {
      trayIconPath = path.join(__dirname, 'public', 'icons', 'icon.ico');
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
  
  // Handler para otimizar jogos
  ipcMain.handle('optimize-game', async (event, gameId, profile = 'balanced') => {
    console.log(`Recebida solicitação para otimizar jogo com ID: ${gameId}`);
    try {
      if (!fpsOptimizer || !fpsOptimizer.optimizeGame) {
        console.warn('Módulo de otimização não disponível');
        return {
          success: false,
          error: 'Módulo de otimização não disponível'
        };
      }
      
      // Encontrar o jogo pelo ID
      const allGames = await getAllGames();
      const gameToOptimize = allGames.find(game => game.id === gameId);
      
      if (!gameToOptimize) {
        console.warn(`Jogo com ID ${gameId} não encontrado`);
        return {
          success: false,
          error: `Jogo com ID ${gameId} não encontrado`
        };
      }
      
      console.log(`Otimizando jogo: ${gameToOptimize.name}`);
      const optimizationResult = await fpsOptimizer.optimizeGame(gameToOptimize, profile);
      
      return optimizationResult;
    } catch (error) {
      console.error(`Erro ao otimizar jogo ${gameId}:`, error);
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
      if (!systemMonitor || !systemMonitor.getSystemInfo) {
        return {
          error: 'Módulo de monitoramento de sistema não disponível'
        };
      }
      return await systemMonitor.getSystemInfo();
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      return {
        error: error.message || 'Erro desconhecido ao obter informações do sistema'
      };
    }
  });
  
  // Diagnostic handler
  ipcMain.handle('list-detected-games', async () => {
    console.log('Recebida solicitação para listar jogos detectados');
    try {
      const games = await getAllGames();
      return {
        success: true,
        totalGames: games.length,
        games: games
      };
    } catch (error) {
      console.error('Erro ao listar jogos detectados:', error);
      return {
        success: false,
        totalGames: 0,
        games: [],
        error: error.message
      };
    }
  });
  
  console.log('Handlers IPC registrados com sucesso');
}

// Função para obter todos os jogos
async function getAllGames() {
  console.log('Iniciando detecção de jogos...');
  
  try {
    // Detectar jogos de diferentes plataformas
    const steamGames = await getSteamGamesInternal();
    const standaloneGames = await getStandaloneGamesInternal();
    
    // Combinar todos os jogos
    const allGames = [...steamGames, ...standaloneGames];
    
    // Remover duplicatas (jogos com o mesmo nome e plataforma)
    const uniqueGames = [];
    const gameKeys = new Set();
    
    for (const game of allGames) {
      // Criar uma chave única para cada jogo
      const key = `${game.name}|${game.platform}`.toLowerCase();
      if (!gameKeys.has(key)) {
        gameKeys.add(key);
        uniqueGames.push(game);
      }
    }
    
    console.log(`Detecção concluída: encontrados ${uniqueGames.length} jogos únicos`);
    return uniqueGames;
  } catch (error) {
    console.error('Erro geral na detecção de jogos:', error);
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
          const stats = await fs.stat(defaultPath);
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
      libraryFoldersContent = await fs.readFile(libraryFoldersPath, 'utf8');
      console.log('Configuração de bibliotecas do Steam lida com sucesso');
    } catch (error) {
      console.error('Erro ao ler bibliotecas do Steam:', error);
      
      // Tentar caminho alternativo para o arquivo de configuração
      const altLibraryFoldersPath = path.join(steamPath, 'config', 'libraryfolders.vdf');
      try {
        libraryFoldersContent = await fs.readFile(altLibraryFoldersPath, 'utf8');
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
        const files = await fs.readdir(appsPath);

        // Procurar por arquivos appmanifest que contêm informações dos jogos
        const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
        console.log(`Encontrados ${manifests.length} manifestos de jogos em ${appsPath}`);

        for (const manifest of manifests) {
          try {
            const manifestPath = path.join(appsPath, manifest);
            const manifestContent = await fs.readFile(manifestPath, 'utf8');

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
                iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
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
    if (!systemMonitor || !systemMonitor.optimizeForGaming) {
      throw new Error('Módulo de otimização de CPU não disponível');
    }
    
    return await systemMonitor.optimizeForGaming();
  } catch (error) {
    console.error('Erro ao otimizar CPU:', error);
    throw error;
  }
}

async function optimizeMemoryInternal(options = {}) {
  console.log('Otimizando memória...');
  
  try {
    if (!systemMonitor || !systemMonitor.optimizeMemory) {
      throw new Error('Módulo de otimização de memória não disponível');
    }
    
    return await systemMonitor.optimizeMemory();
  } catch (error) {
    console.error('Erro ao otimizar memória:', error);
    throw error;
  }
}

async function optimizeGPUInternal(options = {}) {
  console.log('Otimizando GPU...');
  
  try {
    if (!systemMonitor || !systemMonitor.optimizeGPU) {
      throw new Error('Módulo de otimização de GPU não disponível');
    }
    
    return await systemMonitor.optimizeGPU();
  } catch (error) {
    console.error('Erro ao otimizar GPU:', error);
    throw error;
  }
}

async function optimizeNetworkInternal(options = {}) {
  console.log('Otimizando rede...');
  
  try {
    if (!networkMetrics || !networkMetrics.optimizeNetwork) {
      throw new Error('Módulo de otimização de rede não disponível');
    }
    
    return await networkMetrics.optimizeNetwork();
  } catch (error) {
    console.error('Erro ao otimizar rede:', error);
    throw error;
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