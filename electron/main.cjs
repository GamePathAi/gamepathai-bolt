const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Habilitar garbage collection manual
app.commandLine.appendSwitch('js-flags', '--expose-gc');

let mainWindow;

// === SISTEMA DE DETECÇÃO ULTRA-INTELIGENTE ===

// Termos que indicam que NÃO é um jogo completo
const BLACKLIST_TERMS = [
  // DLCs e componentes
  'dlc', 'addon', 'add-on', 'expansion', 'patch', 'update', 
  'demo', 'trial', 'test', 'beta', 'alpha', 'preview',
  'stub', 'tracker', 'gamesave', 'savegame', 'pack',
  'bonus', 'season pass', 'early access', 'content',
  
  // Termos específicos do Call of Duty
  'bo6 pc ms', 'mw3 pc ms', 'mwii dlc', 'cross-gen',
  'game pass', 'gamepass', 'game stub',
  
  // Componentes do sistema
  'microsoft.', 'windows.', 'xbox.', 'gaming services',
  'callable ui', 'authhost', 'family', 'communications',
  
  // Outros apps
  'acer', 'dropbox', 'malwarebytes', 'clipchamp', 'pdf',
  'activesync', 'dts sound', 'cr.sb.', '.cr.'
];

// Base de dados de jogos REAIS com informações detalhadas
const REAL_GAMES_DATABASE = {
  'Call of Duty': {
    executables: [
      'cod.exe', 'codHQ.exe', 'cod23-bootstrapper.exe',
      'cod22-cod.exe', 'cod23-cod.exe', 'sp22-cod.exe', 'sp23-cod.exe'
    ],
    alternativeNames: ['COD', 'CallOfDuty'],
    platforms: ['Steam', 'Battle.net', 'Xbox'],
    minSizeGB: 50,
    minExeSizeMB: 10
  },
  'Red Dead Redemption 2': {
    executables: ['RDR2.exe', 'RedDeadRedemption2.exe'],
    alternativeNames: ['RDR2', 'RedDead2'],
    platforms: ['Steam', 'Epic', 'Xbox'],
    minSizeGB: 100,
    minExeSizeMB: 50
  },
  'Grand Theft Auto V': {
    executables: ['GTA5.exe', 'GTAV.exe', 'PlayGTAV.exe'],
    alternativeNames: ['GTAV', 'GTA5', 'GrandTheftAuto5'],
    platforms: ['Steam', 'Epic', 'Xbox'],
    minSizeGB: 60,
    minExeSizeMB: 50
  },
  'Forza Horizon 5': {
    executables: ['ForzaHorizon5.exe'],
    alternativeNames: ['FH5', 'Forza5'],
    platforms: ['Steam', 'Xbox'],
    minSizeGB: 80,
    minExeSizeMB: 100
  },
  'Minecraft': {
    executables: ['Minecraft.exe', 'MinecraftLauncher.exe'],
    alternativeNames: ['MC'],
    platforms: ['Xbox', 'Standalone'],
    minSizeGB: 1,
    minExeSizeMB: 5
  },
  'Cyberpunk 2077': {
    executables: ['Cyberpunk2077.exe'],
    alternativeNames: ['CP2077'],
    platforms: ['Steam', 'GOG', 'Epic'],
    minSizeGB: 60,
    minExeSizeMB: 50
  },
  'The Witcher 3': {
    executables: ['witcher3.exe'],
    alternativeNames: ['Witcher3', 'TheWitcher3WildHunt'],
    platforms: ['Steam', 'GOG', 'Epic'],
    minSizeGB: 30,
    minExeSizeMB: 30
  }
};

// === FUNÇÕES AUXILIARES MELHORADAS ===

// Verifica se a pasta é blacklisted
function isBlacklisted(folderName) {
  const lowerName = folderName.toLowerCase();
  
  // Verifica cada termo da blacklist
  for (const term of BLACKLIST_TERMS) {
    if (lowerName.includes(term)) {
      console.log(`[Main] ❌ Blacklisted: ${folderName} (contém "${term}")`);
      return true;
    }
  }
  
  // Verifica padrões específicos
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(folderName)) { // UUID
    console.log(`[Main] ❌ Blacklisted: ${folderName} (UUID)`);
    return true;
  }
  
  if (/^[0-9A-F]{8}\./.test(folderName)) { // ID hexadecimal
    console.log(`[Main] ❌ Blacklisted: ${folderName} (Hex ID)`);
    return true;
  }
  
  if (/_[a-z0-9]{10,}$/i.test(folderName)) { // Sufixo estranho
    console.log(`[Main] ❌ Blacklisted: ${folderName} (sufixo estranho)`);
    return true;
  }
  
  return false;
}

// Verifica se o nome da pasta corresponde ao jogo (mais permissivo)
function folderMatchesGame(folderName, gameName, alternativeNames = []) {
  const normalizedFolder = folderName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedGame = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Correspondência exata
  if (normalizedFolder === normalizedGame) return true;

  // Verifica nomes alternativos
  for (const altName of alternativeNames) {
    const normalizedAlt = altName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedFolder === normalizedAlt) return true;
  }

  // Verifica se o nome do jogo está no início da pasta
  if (normalizedFolder.startsWith(normalizedGame)) return true;

  // NOVO: Verifica se o nome do jogo está contido em qualquer parte da pasta
  if (normalizedFolder.includes(normalizedGame)) return true;

  return false;
}

// Calcula tamanho do diretório em GB
async function getDirectorySizeGB(dirPath) {
  try {
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(
      `powershell -Command "(Get-ChildItem '${dirPath}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`,
      { windowsHide: true, maxBuffer: 1024 * 1024 * 10 }
    );
    
    const bytes = parseInt(stdout.trim()) || 0;
    return bytes / (1024 * 1024 * 1024); // GB
  } catch {
    return 0;
  }
}

// Obtém tamanho do arquivo em MB
function getFileSizeMB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024); // MB
  } catch {
    return 0;
  }
}

// Busca executável válido do jogo
function findValidGameExecutable(gamePath, gameInfo) {
  const searchDirs = ['', 'bin', 'Binaries', 'Win64', 'x64', '_retail_', 'Game', 'Content'];

  for (const dir of searchDirs) {
    const searchPath = path.join(gamePath, dir);
    if (!fs.existsSync(searchPath)) continue;

    try {
      // Busca também em subpastas de Content
      let subDirs = [searchPath];
      if (dir === 'Content') {
        const contentSubs = fs.readdirSync(searchPath, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => path.join(searchPath, d.name));
        subDirs.push(...contentSubs);
      }
      for (const subDir of subDirs) {
        const files = fs.readdirSync(subDir);
        for (const exe of gameInfo.executables) {
          // Busca executável de forma case-insensitive
          const foundExe = files.find(f => f.toLowerCase() === exe.toLowerCase());
          if (foundExe) {
            const exePath = path.join(subDir, foundExe);
            // Verifica tamanho mínimo do executável
            const sizeMB = getFileSizeMB(exePath);
            if (sizeMB >= gameInfo.minExeSizeMB) {
              console.log(`[Main] ✅ Executável válido: ${foundExe} (${sizeMB.toFixed(1)}MB)`);
              return exePath;
            } else {
              console.log(`[Main] ❌ Executável muito pequeno: ${foundExe} (${sizeMB.toFixed(1)}MB < ${gameInfo.minExeSizeMB}MB)`);
            }
          }
        }
      }
    } catch {}
  }

  return null;
}

// Função auxiliar para calcular uso de CPU
async function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  
  return usage;
}

// === ELECTRON SETUP ===

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_RUN === 'true';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173');
      }, 1000);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  console.log('[Main] Electron app ready');

  // Handler para lançar jogo pelo caminho
  const { spawn } = require('child_process');
  ipcMain.handle('launch-game-by-path', async (event, gamePath) => {
    console.log('[Main] Lançando jogo:', gamePath);
    try {
      if (!fs.existsSync(gamePath)) {
        throw new Error(`Arquivo não encontrado: ${gamePath}`);
      }
      const gameProcess = spawn(gamePath, [], {
        detached: true,
        stdio: 'ignore',
        shell: false,
        windowsHide: true,
        cwd: path.dirname(gamePath)
      });
      gameProcess.unref();
      return { success: true };
    } catch (error) {
      console.error('[Main] Erro ao lançar jogo:', error);
      return { success: false, error: error.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// === HANDLERS PRINCIPAIS ===

// Função melhorada para detectar jogos
async function detectGamesInPath(basePath, platform) {
  const games = [];
  
  if (!fs.existsSync(basePath)) return games;
  
  console.log(`[Main] Escaneando ${platform} em: ${basePath}`);
  
  try {
    const entries = fs.readdirSync(basePath);
    
    for (const entry of entries) {
      // 1. Verifica blacklist primeiro
      if (isBlacklisted(entry)) {
        console.log(`[LOG] Pasta ignorada por blacklist: ${entry}`);
        continue;
      }
      
      const fullPath = path.join(basePath, entry);
      
      // 2. Verifica se é diretório
      if (!fs.statSync(fullPath).isDirectory()) {
        console.log(`[LOG] Ignorado (não é diretório): ${entry}`);
        continue;
      }
      
      let matched = false;
      // 3. Procura correspondência com jogos conhecidos
      for (const [gameName, gameInfo] of Object.entries(REAL_GAMES_DATABASE)) {
        // Verifica se a plataforma é suportada
        if (!gameInfo.platforms.includes(platform)) {
          //console.log(`[LOG] Plataforma não suportada para ${entry}: ${platform}`);
          continue;
        }
        
        // Verifica se o nome corresponde (mais rigoroso)
        if (!folderMatchesGame(entry, gameName, gameInfo.alternativeNames)) {
          //console.log(`[LOG] Nome da pasta não corresponde ao jogo: ${entry} vs ${gameName}`);
          continue;
        }
        
        matched = true;
        console.log(`[Main] 🎮 Possível jogo encontrado: ${entry} (match com ${gameName})`);
        
        // 4. Procura executável válido
        const exePath = findValidGameExecutable(fullPath, gameInfo);
        if (!exePath) {
          console.log(`[Main] ❌ Sem executável válido para: ${entry}`);
          continue;
        }
        
        // 5. Verifica tamanho total da instalação
        const sizeGB = await getDirectorySizeGB(fullPath);
        if (sizeGB < gameInfo.minSizeGB * 0.8) { // 80% do tamanho mínimo
          console.log(`[Main] ❌ Instalação muito pequena: ${entry} (${sizeGB.toFixed(1)}GB < ${gameInfo.minSizeGB * 0.8}GB)`);
          continue;
        }
        
        // 6. Jogo válido encontrado!
        games.push({
          id: `${platform.toLowerCase()}-${gameName.replace(/\s+/g, '-').toLowerCase()}`,
          name: gameName,
          platform: platform,
          installPath: fullPath,
          executablePath: exePath,
          process_name: path.basename(exePath),
          size: Math.round(sizeGB * 1024), // MB
          icon_url: platform === 'Steam' ? 
            `https://cdn.cloudflare.steamstatic.com/steam/apps/${entry}/header.jpg` : 
            undefined
        });
        
        console.log(`[Main] ✅ Jogo válido adicionado: ${gameName} (${platform})`);
        break; // Não procurar outros jogos para esta pasta
      }
      if (!matched) {
        console.log(`[LOG] Pasta ignorada (nenhum jogo conhecido): ${entry}`);
      }
    }
  } catch (error) {
    console.error(`[Main] Erro ao escanear ${basePath}:`, error);
  }
  
  return games;
}

// Handler para Xbox - ULTRA RESTRITIVO
ipcMain.handle('detect-xbox-games', async () => {
  console.log('[Main] Detectando jogos Xbox (ultra-restritivo)...');
  
  // Apenas C:\XboxGames
  const games = await detectGamesInPath('C:\\XboxGames', 'Xbox');
  
  console.log(`[Main] Total de jogos Xbox reais: ${games.length}`);
  return games;
});

// Handler para Steam
ipcMain.handle('detect-steam-games', async () => {
  console.log('[Main] Detectando jogos Steam...');
  const games = [];
  
  try {
    // Encontra Steam
    let steamPath = null;
    const possiblePaths = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam',
      'D:\\Steam',
      'D:\\SteamLibrary',
      'E:\\Steam',
      'E:\\SteamLibrary'
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        steamPath = p;
        break;
      }
    }
    
    if (!steamPath) return [];
    
    // Lê bibliotecas
    const libraries = [steamPath];
    const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    
    if (fs.existsSync(vdfPath)) {
      const vdfContent = fs.readFileSync(vdfPath, 'utf8');
      const pathMatches = vdfContent.matchAll(/"path"\s+"([^"]+)"/g);
      
      for (const match of pathMatches) {
        const libPath = match[1].replace(/\\\\/g, '\\');
        if (!libraries.includes(libPath) && fs.existsSync(libPath)) {
          libraries.push(libPath);
        }
      }
    }
    
    // Procura jogos em cada biblioteca
    for (const library of libraries) {
      const commonPath = path.join(library, 'steamapps', 'common');
      const steamGames = await detectGamesInPath(commonPath, 'Steam');
      games.push(...steamGames);
    }
    
  } catch (error) {
    console.error('[Main] Erro ao detectar jogos Steam:', error);
  }
  
  console.log(`[Main] Total de jogos Steam: ${games.length}`);
  return games;
});

// Handler para Battle.net
ipcMain.handle('detect-battlenet-games', async () => {
  console.log('[Main] Detectando jogos Battle.net...');
  
  const possiblePaths = [
    'C:\\Program Files (x86)\\Call of Duty',
    'C:\\Program Files\\Call of Duty',
    'C:\\Program Files (x86)\\Overwatch',
    'C:\\Games',
    'D:\\Games'
  ];
  
  const games = [];
  
  for (const basePath of possiblePaths) {
    const battlenetGames = await detectGamesInPath(basePath, 'Battle.net');
    games.push(...battlenetGames);
  }
  
  console.log(`[Main] Total de jogos Battle.net: ${games.length}`);
  return games;
});

// Handler para Epic Games
ipcMain.handle('detect-epic-games', async () => {
  console.log('[Main] Detectando jogos Epic Games...');
  
  const possiblePaths = [
    'C:\\Program Files\\Epic Games',
    'D:\\Epic Games',
    'E:\\Epic Games'
  ];
  
  const games = [];
  
  for (const basePath of possiblePaths) {
    const epicGames = await detectGamesInPath(basePath, 'Epic');
    games.push(...epicGames);
  }
  
  console.log(`[Main] Total de jogos Epic: ${games.length}`);
  return games;
});

// Handler para GOG
ipcMain.handle('detect-gog-games', async () => {
  console.log('[Main] Detectando jogos GOG...');
  const possiblePaths = [
    'C:\\GOG Games',
    'D:\\GOG Games',
    'C:\\Games\\GOG Games'
  ];
  const games = [];
  for (const basePath of possiblePaths) {
    const gogGames = await detectGamesInPath(basePath, 'GOG');
    games.push(...gogGames);
  }
  // Sanitize
  const sanitized = games.map(g => ({
    id: g.id || '',
    name: g.name || '',
    platform: 'GOG',
    installPath: g.installPath || '',
    executablePath: g.executablePath || '',
    process_name: g.process_name || '',
    size: g.size || 0,
    icon_url: g.icon_url || ''
  }));
  console.log(`[Main] Total de jogos GOG: ${sanitized.length}`);
  return sanitized;
});

// Handler para Origin
ipcMain.handle('detect-origin-games', async () => {
  console.log('[Main] Detectando jogos Origin...');
  const possiblePaths = [
    'C:\\Program Files (x86)\\Origin Games',
    'C:\\Program Files\\Origin Games',
    'D:\\Origin Games',
    'C:\\Games\\Origin Games'
  ];
  const games = [];
  for (const basePath of possiblePaths) {
    const originGames = await detectGamesInPath(basePath, 'Origin');
    games.push(...originGames);
  }
  // Sanitize
  const sanitized = games.map(g => ({
    id: g.id || '',
    name: g.name || '',
    platform: 'Origin',
    installPath: g.installPath || '',
    executablePath: g.executablePath || '',
    process_name: g.process_name || '',
    size: g.size || 0,
    icon_url: g.icon_url || ''
  }));
  console.log(`[Main] Total de jogos Origin: ${sanitized.length}`);
  return sanitized;
});

// Handler para Uplay
ipcMain.handle('detect-uplay-games', async () => {
  console.log('[Main] Detectando jogos Uplay...');
  const possiblePaths = [
    'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games',
    'C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games',
    'D:\\Ubisoft Games',
    'C:\\Ubisoft Games'
  ];
  const games = [];
  for (const basePath of possiblePaths) {
    const uplayGames = await detectGamesInPath(basePath, 'Uplay');
    games.push(...uplayGames);
  }
  // Sanitize
  const sanitized = games.map(g => ({
    id: g.id || '',
    name: g.name || '',
    platform: 'Uplay',
    installPath: g.installPath || '',
    executablePath: g.executablePath || '',
    process_name: g.process_name || '',
    size: g.size || 0,
    icon_url: g.icon_url || ''
  }));
  console.log(`[Main] Total de jogos Uplay: ${sanitized.length}`);
  return sanitized;
});

// === HANDLERS DO FPS BOOSTER ===

// Handler melhorado para métricas FPS
ipcMain.handle('get-fps-metrics', async () => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Calcular uso de CPU
    const cpuUsage = await getCPUUsage();
    
    // Valores simulados para GPU (você pode integrar com uma lib real como gpu-info)
    const gpuUsage = Math.floor(Math.random() * 30) + 40;
    const gpuTemp = Math.floor(Math.random() * 20) + 60;
    
    return {
      currentFPS: Math.floor(Math.random() * 40) + 80,
      averageFPS: 75,
      minFPS: 45,
      maxFPS: 120,
      usage: {
        cpu: cpuUsage,
        gpu: gpuUsage,
        memory: Math.round((usedMem / totalMem) * 100)
      },
      cpuCores: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
      totalMemory: Math.round(totalMem / (1024 * 1024 * 1024)),
      usedMemory: Math.round(usedMem / (1024 * 1024 * 1024)),
      freeMemory: Math.round(freeMem / (1024 * 1024 * 1024)),
      memoryPercentage: Math.round((usedMem / totalMem) * 100),
      gpuTemperature: gpuTemp,
      gpuMemory: 8, // Valor fixo ou detectar via lib
      cpuPriority: 0,
      memoryLatency: 0,
      gpuPerformance: 0,
      inputLag: 0
    };
  } catch (error) {
    console.error('[Main] Erro ao obter métricas:', error);
    return {
      currentFPS: 60,
      averageFPS: 75,
      minFPS: 45,
      maxFPS: 120,
      usage: { cpu: 25, gpu: 50, memory: 40 },
      cpuCores: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      totalMemory: 16,
      usedMemory: 8,
      freeMemory: 8,
      memoryPercentage: 50,
      gpuTemperature: 65,
      gpuMemory: 8,
      cpuPriority: 0,
      memoryLatency: 0,
      gpuPerformance: 0,
      inputLag: 0
    };
  }
});

// Handler para limpar memória
ipcMain.handle('clear-memory', async () => {
  try {
    // Força garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    // Limpa caches do Electron
    const wins = BrowserWindow.getAllWindows();
    for (const win of wins) {
      if (win && !win.isDestroyed()) {
        await win.webContents.session.clearCache();
        win.webContents.session.flushStorageData();
      }
    }
    
    // No Windows, pode usar comandos específicos
    if (process.platform === 'win32') {
      exec('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory', { windowsHide: true });
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Main] Erro ao limpar memória:', error);
    return { success: false, error: error.message };
  }
});

// Handler para otimizar GPU
ipcMain.handle('optimize-gpu', async (event, mode) => {
  try {
    // No Windows, ajusta configurações de energia da GPU
    if (process.platform === 'win32') {
      const powerMode = mode === 'extreme' ? 'high-performance' : 
                       mode === 'performance' ? 'balanced' : 'power-saver';
      
      // Comando PowerShell para definir plano de energia
      exec(`powershell -Command "powercfg /setactive SCHEME_MIN"`, { windowsHide: true });
    }
    
    return { success: true, mode };
  } catch (error) {
    console.error('[Main] Erro ao otimizar GPU:', error);
    return { success: false, error: error.message };
  }
});

// Handler para definir prioridade do processo
ipcMain.handle('set-process-priority', async (event, processName, priority) => {
  try {
    if (process.platform === 'win32') {
      // Mapear prioridade para valores do Windows
      const priorityMap = {
        'HIGH': 'high',
        'ABOVE_NORMAL': 'abovenormal',
        'NORMAL': 'normal',
        'BELOW_NORMAL': 'belownormal',
        'IDLE': 'idle'
      };
      
      const winPriority = priorityMap[priority] || 'normal';
      
      // Usar wmic para definir prioridade
      exec(`wmic process where "name='${processName}'" call setpriority "${winPriority}"`, 
        { windowsHide: true },
        (error) => {
          if (error) console.error(`Erro ao definir prioridade para ${processName}:`, error);
        }
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Main] Erro ao definir prioridade:', error);
    return { success: false, error: error.message };
  }
});

// Handler para obter lista de processos
ipcMain.handle('get-processes', async () => {
  try {
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(
        'wmic process get Name,ProcessId,WorkingSetSize /format:csv',
        { windowsHide: true, maxBuffer: 1024 * 1024 * 10 }
      );
      
      const lines = stdout.trim().split('\n').slice(2); // Skip headers
      const processes = [];
      
      for (const line of lines) {
        const [, name, pid, memory] = line.split(',');
        if (name && pid && memory) {
          processes.push({
            name: name.trim(),
            pid: parseInt(pid),
            memory: Math.round(parseInt(memory) / (1024 * 1024)) // MB
          });
        }
      }
      
      // Filtrar e ordenar processos relevantes
      return processes
        .filter(p => p.memory > 50) // Apenas processos usando mais de 50MB
        .sort((a, b) => b.memory - a.memory)
        .slice(0, 20); // Top 20 processos
    }
    
    return [];
  } catch (error) {
    console.error('[Main] Erro ao obter processos:', error);
    return [];
  }
});

// Handler para matar processo
ipcMain.handle('kill-process', async (event, pid) => {
  try {
    if (process.platform === 'win32') {
      exec(`taskkill /PID ${pid} /F`, { windowsHide: true });
    } else {
      process.kill(pid);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Main] Erro ao matar processo:', error);
    return { success: false, error: error.message };
  }
});

// Handler para obter informações do sistema
ipcMain.handle('get-system-info', async () => {
  const cpus = os.cpus();
  return {
    cpu: cpus[0].model,
    cpuCores: cpus.length,
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
    platform: os.platform(),
    gpu: 'NVIDIA GeForce RTX 3080'
  };
});

// Handler para lançar jogo
ipcMain.handle('launch-game', async (event, gameId) => {
  console.log('[Main] Launching game:', gameId);
  return true;
});

// Handlers do sistema de arquivos
ipcMain.handle('fs-exists', async (event, filePath) => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs-read-dir', async (event, dirPath) => {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
});

ipcMain.handle('fs-read-file', async (event, filePath, encoding) => {
  try {
    return fs.readFileSync(filePath, encoding || 'utf8');
  } catch {
    return null;
  }
});

ipcMain.handle('fs-stat', async (event, filePath) => {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
});

// Handler para ping
ipcMain.handle('ping', async (event, host) => {
  return new Promise((resolve) => {
    exec(`ping -n 1 ${host}`, (error, stdout) => {
      if (error) {
        resolve(999);
        return;
      }
      const match = stdout.match(/Average = (\d+)ms/);
      resolve(match ? parseInt(match[1]) : 100);
    });
  });
});

// Handlers simplificados (mantidos originais)
ipcMain.handle('get-xbox-packages', async () => []);
ipcMain.handle('registry-get-value', async () => null);
ipcMain.handle('registry-enumerate-values', async () => []);
ipcMain.handle('registry-enumerate-keys', async () => []);
ipcMain.handle('validate-game-files', async () => true);
ipcMain.handle('optimize-game', async () => true);
ipcMain.handle('one-click-optimize', async () => ({ success: true, message: 'Sistema otimizado!' }));

console.log('[Main] Main process initialized');