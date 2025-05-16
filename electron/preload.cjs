// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs do Electron para o processo de renderização de forma segura
contextBridge.exposeInMainWorld('electronAPI', {
  // Game functions
  scanGames: () => ipcRenderer.invoke('scan-games'),
  launchGame: (game) => ipcRenderer.invoke('launch-game', game),
  optimizeGame: (game, profile, settings) => ipcRenderer.invoke('optimize-game', game, profile, settings),
  
  // Platform-specific scanning functions
  scanSteam: () => ipcRenderer.invoke('scan-steam'),
  scanEpic: () => ipcRenderer.invoke('scan-epic'),
  scanXbox: () => ipcRenderer.invoke('scan-xbox'),
  scanOrigin: () => ipcRenderer.invoke('scan-origin'),
  
  // System functions
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  optimizeCPU: (options) => ipcRenderer.invoke('optimize-cpu', options),
  optimizeMemory: (options) => ipcRenderer.invoke('optimize-memory', options),
  optimizeGPU: (options) => ipcRenderer.invoke('optimize-gpu', options),
  optimizeNetwork: (options) => ipcRenderer.invoke('optimize-network', options),
  
  // Network functions
  measureNetworkPerformance: () => ipcRenderer.invoke('measure-network-performance'),
  getAvailableRoutes: () => ipcRenderer.invoke('get-available-routes'),
  connectToRoute: (route) => ipcRenderer.invoke('connect-to-route', route),
  disconnectFromRoute: () => ipcRenderer.invoke('disconnect-from-route'),
  
  // VPN functions
  getVpnServers: () => ipcRenderer.invoke('get-vpn-servers'),
  connectToVpn: (server) => ipcRenderer.invoke('connect-to-vpn', server),
  disconnectFromVpn: () => ipcRenderer.invoke('disconnect-from-vpn'),
  getVpnStatus: () => ipcRenderer.invoke('get-vpn-status'),
  testVpnSpeed: () => ipcRenderer.invoke('test-vpn-speed')
});