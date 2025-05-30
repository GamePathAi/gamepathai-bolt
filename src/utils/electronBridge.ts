// src/utils/electronBridge.ts
declare global {
  interface Window {
    require: any;
    electronAPI: any;
    process: any;
  }
}

export function initializeElectronAPI() {
  // Verificar se estamos no Electron e se o require está disponível
  if (typeof window !== 'undefined' && window.require && !window.electronAPI) {
    try {
      const { ipcRenderer } = window.require('electron');
      
      window.electronAPI = {
        // Game Detection & Launch
        scanGames: () => ipcRenderer.invoke('scan-games'),
        launchGame: (game: any, profile: any) => ipcRenderer.invoke('launch-game', game, profile),
        
        gameAPI: {
          launch: (executablePath: string, args: string[] = []) => {
            console.log('[ElectronBridge] gameAPI.launch chamado:', executablePath);
            return ipcRenderer.invoke('launch-game', executablePath, args);
          },
          detectGames: () => ipcRenderer.invoke('scan-games'),
          isGameRunning: (processName: string) => ipcRenderer.invoke('is-game-running', processName),
          openGameFolder: (folderPath: string) => ipcRenderer.invoke('open-game-folder', folderPath),
          getSteamGames: () => ipcRenderer.invoke('get-steam-games'),
          getXboxPackages: () => ipcRenderer.invoke('get-xbox-packages')
        },
        
        // File System
        fs: {
          exists: (path: string) => ipcRenderer.invoke('fs-exists', path),
          readDir: (path: string) => ipcRenderer.invoke('fs-read-dir', path),
          readFile: (path: string, encoding?: string) => ipcRenderer.invoke('fs-read-file', path, encoding),
          stat: (path: string) => ipcRenderer.invoke('fs-stat', path),
          getSystemPaths: () => ipcRenderer.invoke('get-system-paths'),
          getEnvVars: () => ipcRenderer.invoke('get-env-vars')
        },
        
        // FPS Booster
        getProcesses: () => ipcRenderer.invoke('get-processes'),
        killProcess: (pid: number) => ipcRenderer.invoke('kill-process', pid),
        clearMemory: () => ipcRenderer.invoke('clear-memory'),
        optimizeGPU: (level: string) => ipcRenderer.invoke('optimize-gpu', level),
        oneClickOptimize: () => ipcRenderer.invoke('one-click-optimize'),
        
        // System
        getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
      };
      
      console.log('[ElectronBridge] ✅ API do Electron inicializada com sucesso');
      window.dispatchEvent(new Event('electron-api-ready'));
      
      return true;
    } catch (error) {
      console.error('[ElectronBridge] ❌ Erro ao inicializar API:', error);
      return false;
    }
  }
  
  if (window.electronAPI) {
    console.log('[ElectronBridge] API já existe');
    return true;
  }
  
  console.log('[ElectronBridge] Não está no ambiente Electron');
  return false;
}

// Tentar inicializar automaticamente
if (typeof window !== 'undefined') {
  initializeElectronAPI();
}
