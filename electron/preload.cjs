const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Detecção de jogos
  scanGames: () => ipcRenderer.invoke('scan-games'),
  
  // Games API para os hooks - USANDO OS NOMES CORRETOS
  games: {
    detectSteam: () => ipcRenderer.invoke('get-steam-games'),
    detectEpic: () => ipcRenderer.invoke('get-epic-games'),
    detectXbox: () => ipcRenderer.invoke('get-xbox-packages'),
    detectOrigin: () => ipcRenderer.invoke('get-origin-games'),
    detectBattleNet: () => ipcRenderer.invoke('get-battlenet-games'),
    detectGOG: () => ipcRenderer.invoke('get-gog-games'),
    detectUplay: () => ipcRenderer.invoke('get-uplay-games')
  },
  
  // Lançamento de jogos
  launchGame: (game, profile) => ipcRenderer.invoke('launch-game', game, profile),
  
  // Otimização
  optimizeGame: (game, profile) => ipcRenderer.invoke('optimize-game', game, profile),
  optimizeSystem: (component, profile) => ipcRenderer.invoke('optimize-system', component, profile),
  
  // Rede
  findBestRoute: () => ipcRenderer.invoke('find-best-route'),
  optimizeNetworkRoute: (server) => ipcRenderer.invoke('optimize-network-route', server),
  
  // Profiles
  getGameProfile: (gameId) => ipcRenderer.invoke('get-game-profile', gameId),
  setGameProfile: (gameId, profile) => ipcRenderer.invoke('set-game-profile', gameId, profile),
  
  // Monitoramento
  startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  
  // Sistema
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Cache
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  
  // Diagnóstico
  runDiagnostics: () => ipcRenderer.invoke('run-diagnostics'),
  
  // Listeners
  onGamesDetected: (callback) => ipcRenderer.on('games-detected', callback),
  onGameMetrics: (callback) => ipcRenderer.on('game-metrics', callback),
  onRealTimeMetrics: (callback) => ipcRenderer.on('real-time-metrics', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
