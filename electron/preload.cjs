// PRELOAD.CJS - VERSÃO CORRIGIDA SEM O MÓDULO PATH
const { contextBridge, ipcRenderer } = require('electron');
// REMOVIDO: const path = require('path');

console.log('[Preload] Iniciando...');

// Função auxiliar para substituir path.join
function joinPath(...parts) {
  return parts.filter(Boolean).join('\\');
}

// Expor process
contextBridge.exposeInMainWorld('process', {
  platform: process.platform || 'win32',
  env: {
    USERNAME: process.env.USERNAME || 'User',
    USERPROFILE: process.env.USERPROFILE || 'C:\\Users\\User',
    APPDATA: process.env.APPDATA || 'C:\\Users\\User\\AppData\\Roaming',
    LOCALAPPDATA: process.env.LOCALAPPDATA || 'C:\\Users\\User\\AppData\\Local',
    PROGRAMFILES: process.env.PROGRAMFILES || 'C:\\Program Files',
    'PROGRAMFILES(X86)': process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'
  },
  versions: process.versions
});

// ⚡ CORREÇÃO CRÍTICA: Adicionar gamePathApi que o frontend está esperando
contextBridge.exposeInMainWorld('gamePathApi', {
  launch: async (gamePath) => {
    console.log('[Preload] gamePathApi.launch chamado com:', gamePath);
    try {
      const result = await ipcRenderer.invoke('launch-game-by-path', gamePath);
      return result;
    } catch (error) {
      console.error('[Preload] Erro ao lançar jogo:', error);
      throw error;
    }
  },
  openGameFolder: async (gamePath) => {
    console.log('[Preload] gamePathApi.openGameFolder chamado com:', gamePath);
    return await ipcRenderer.invoke('open-game-folder', gamePath);
  },
  detectGames: async () => {
    console.log('[Preload] gamePathApi.detectGames chamado');
    return await ipcRenderer.invoke('detect-all-games');
  },
  onGameDetectionProgress: (callback) => {
    ipcRenderer.on('game-detection-progress', (_event, data) => callback(data));
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('game-detection-progress');
  }
});

// Manter o electronAPI existente
contextBridge.exposeInMainWorld('electronAPI', {
  // Game Scanner
  scanGames: async () => {
    try {
      const result = await ipcRenderer.invoke('scan-games');
      return {
        success: true,
        data: Array.isArray(result) ? result : [],
        errors: []
      };
    } catch (error) {
      return { success: false, data: [], errors: [error.message] };
    }
  },
  
  getInstalledGames: async () => {
    try {
      const games = await ipcRenderer.invoke('scan-games');
      return Array.isArray(games) ? games : [];
    } catch (error) {
      return [];
    }
  },
  
  // Métricas FPS - ATUALIZADA com métricas completas
  getFPSMetrics: async () => {
    try {
      const result = await ipcRenderer.invoke('get-fps-metrics');
      return {
        currentFPS: result?.currentFPS || 60,
        averageFPS: result?.averageFPS || 75,
        minFPS: result?.minFPS || 45,
        maxFPS: result?.maxFPS || 120,
        usage: {
          cpu: result?.usage?.cpu || 25,
          gpu: result?.usage?.gpu || 50,
          memory: result?.usage?.memory || 40
        },
        // NOVO: Adicionar métricas completas
        cpu: {
          usage: result?.usage?.cpu || 25,
          cores: result?.cpuCores || 8,
          model: result?.cpuModel || 'Unknown CPU'
        },
        memory: {
          total: result?.totalMemory || 16,
          used: result?.usedMemory || 8,
          free: result?.freeMemory || 8,
          percentage: result?.memoryPercentage || 50
        },
        gpu: {
          usage: result?.usage?.gpu || 50,
          temperature: result?.gpuTemperature || 65,
          memory: result?.gpuMemory || 8
        },
        performance: {
          cpuPriority: result?.cpuPriority || 0,
          memoryLatency: result?.memoryLatency || 0,
          gpuPerformance: result?.gpuPerformance || 0,
          inputLag: result?.inputLag || 0
        }
      };
    } catch (error) {
      console.error('[Preload] Erro ao obter métricas FPS:', error);
      // Retornar valores padrão em caso de erro
      return {
        currentFPS: 60,
        averageFPS: 75,
        minFPS: 45,
        maxFPS: 120,
        usage: { cpu: 25, gpu: 50, memory: 40 },
        cpu: { usage: 25, cores: 8, model: 'Unknown CPU' },
        memory: { total: 16, used: 8, free: 8, percentage: 50 },
        gpu: { usage: 50, temperature: 65, memory: 8 },
        performance: {
          cpuPriority: 0,
          memoryLatency: 0,
          gpuPerformance: 0,
          inputLag: 0
        }
      };
    }
  },
  
  // === NOVO: APIs do FPS Booster ===
  
  // Otimizações de Sistema
  clearMemory: () => ipcRenderer.invoke('clear-memory'),
  optimizeGPU: (mode) => ipcRenderer.invoke('optimize-gpu', mode),
  setProcessPriority: (processName, priority) => 
    ipcRenderer.invoke('set-process-priority', processName, priority),
  
  // Gerenciamento de Processos
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  
  // Sistema
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // File System COMPLETO
  fs: {
    exists: (path) => ipcRenderer.invoke('fs-exists', path),
    readDir: (path) => ipcRenderer.invoke('fs-read-dir', path),
    readFile: (path, encoding) => ipcRenderer.invoke('fs-read-file', path, encoding),
    stat: (path) => ipcRenderer.invoke('fs-stat', path),
    getSystemPaths: async () => ({
      programFiles: process.env.PROGRAMFILES || 'C:\\Program Files',
      programFilesX86: process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)',
      appData: process.env.APPDATA,
      localAppData: process.env.LOCALAPPDATA,
      // CORRIGIDO: Usando joinPath ao invés de path.join
      documents: process.env.USERPROFILE ? joinPath(process.env.USERPROFILE, 'Documents') : ''
    }),
    getEnvVars: async () => ({
      USERPROFILE: process.env.USERPROFILE,
      APPDATA: process.env.APPDATA,
      LOCALAPPDATA: process.env.LOCALAPPDATA,
      PROGRAMFILES: process.env.PROGRAMFILES,
      'PROGRAMFILES(X86)': process.env['PROGRAMFILES(X86)'],
      USERNAME: process.env.USERNAME
    })
  },
  
  // Registry
  registry: {
    getValue: (hive, key, name) => ipcRenderer.invoke('registry-get-value', hive, key, name),
    enumerateValues: (hive, key) => ipcRenderer.invoke('registry-enumerate-values', hive, key),
    enumerateKeys: (hive, key) => ipcRenderer.invoke('registry-enumerate-keys', hive, key)
  },
  
  // Game API
  gameAPI: {
    launch: (path, args) => ipcRenderer.invoke('launch-game', path, args),
    detectGames: () => ipcRenderer.invoke('scan-games'),
    getSteamGames: () => ipcRenderer.invoke('get-steam-games'),
    getXboxPackages: () => ipcRenderer.invoke('get-xbox-packages'),
    // Métodos individuais de detecção de jogos por plataforma
    detectXboxGames: async () => {
      return await ipcRenderer.invoke('detect-xbox-games') || [];
    },
    detectSteamGames: async () => {
      return await ipcRenderer.invoke('detect-steam-games') || [];
    },
    detectEpicGames: async () => {
      return await ipcRenderer.invoke('detect-epic-games') || [];
    },
    detectOriginGames: async () => {
      return await ipcRenderer.invoke('detect-origin-games') || [];
    },
    detectGOGGames: async () => {
      return await ipcRenderer.invoke('detect-gog-games') || [];
    },
    detectBattleNetGames: async () => {
      return await ipcRenderer.invoke('detect-battlenet-games') || [];
    },
    detectUplayGames: async () => {
      return await ipcRenderer.invoke('detect-uplay-games') || [];
    }
  },
  
  // Network
  ping: (host) => ipcRenderer.invoke('ping', host),
  
  // Outros
  validateGameFiles: (id) => ipcRenderer.invoke('validate-game-files', id),
  launchGame: (id) => ipcRenderer.invoke('launch-game', id),
  optimizeGame: (id, profile) => ipcRenderer.invoke('optimize-game', id, profile),

  // Tray API
  tray: {
    updateGames: (games) => {
      try {
        console.log('[Preload] Tray update games:', games);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Sistema de eventos
  events: {
    on: (event, callback) => {
      ipcRenderer.on(event, (_, data) => callback(data));
    },
    removeAll: (event) => {
      ipcRenderer.removeAllListeners(event);
    }
  }
});

console.log('[Preload] ✅ API exposta com sucesso!');
console.log('[Preload] window.process.platform:', process.platform);