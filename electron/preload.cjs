import { contextBridge, ipcRenderer } from 'electron';

// Expõe APIs do Electron para o processo de renderização de forma segura
contextBridge.exposeInMainWorld('electronAPI', {
  // Game functions
  scanGames: () => ipcRenderer.invoke('scan-games'),
  launchGame: (game) => ipcRenderer.invoke('launch-game', game),
  
  // System functions
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
});