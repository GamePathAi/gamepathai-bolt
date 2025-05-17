// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

// Log para saber que o preload está sendo executado
console.log('Preload script está carregando...');

// Rastreamento de listeners registrados para evitar duplicatas
const registeredListeners = {
  'scan-games-from-tray': new Set(),
  'launch-game-from-tray': new Set(),
  'optimize-game-from-tray': new Set(),
  'optimize-memory-from-tray': new Set(),
  'optimize-cpu-from-tray': new Set(),
  'optimize-network-from-tray': new Set()
};

// Expõe APIs do Electron para o processo de renderização de forma segura
contextBridge.exposeInMainWorld('electronAPI', {
  // Game functions
  scanGames: () => {
    console.log('Preload: Chamando scanGames via IPC');
    return ipcRenderer.invoke('scan-games');
  },
  getInstalledGames: () => {
    console.log('Preload: Chamando getInstalledGames via IPC');
    // Podemos usar scan-games como alternativa se não tiver um handler específico
    return ipcRenderer.invoke('scan-games');
  },
  validateGameFiles: (gameId) => {
    console.log(`Preload: Chamando validateGameFiles(${gameId}) via IPC`);
    return ipcRenderer.invoke('validate-game-files', gameId);
  },
  launchGame: (game) => {
    console.log('Preload: Chamando launchGame via IPC', game);
    return ipcRenderer.invoke('launch-game', game);
  },
  optimizeGame: (game, profile, settings) => {
    console.log('Preload: Chamando optimizeGame via IPC', game, profile, settings);
    return ipcRenderer.invoke('optimize-game', game, profile, settings);
  },
  
  // Tray functions
  updateTrayGames: (games) => {
    console.log('Preload: Atualizando jogos no tray', games?.length);
    return ipcRenderer.invoke('update-tray-games', games);
  },
  getGamesForTray: () => {
    console.log('Preload: Obtendo jogos para o tray');
    return ipcRenderer.invoke('get-games-for-tray');
  },
  
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
  testVpnSpeed: () => ipcRenderer.invoke('test-vpn-speed'),
  
  // Test function to check if Electron API is working
  testElectronAPI: () => {
    console.log('Preload: Função de teste chamada');
    return Promise.resolve({ success: true, message: 'API do Electron está funcionando!' });
  },
  
  // Notification function
  showNotification: (options) => {
    console.log('Preload: Mostrando notificação', options);
    return ipcRenderer.invoke('show-notification', options);
  }
});

// Expor o ipcRenderer para permitir escutar eventos
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, listener) => {
    // Lista de canais permitidos para garantir segurança
    const allowedChannels = [
      'scan-games-from-tray',
      'launch-game-from-tray',
      'optimize-game-from-tray',
      'optimize-memory-from-tray',
      'optimize-cpu-from-tray',
      'optimize-network-from-tray'
    ];
    
    if (allowedChannels.includes(channel)) {
      // Verificar se esse listener já está registrado
      if (registeredListeners[channel] && registeredListeners[channel].has(listener)) {
        console.log(`Preload: Listener já registrado para ${channel}, ignorando`);
        return;
      }
      
      console.log(`Preload: Registrando listener para ${channel}`);
      registeredListeners[channel].add(listener);
      ipcRenderer.on(channel, listener);
    }
  },
  
  removeListener: (channel, listener) => {
    const allowedChannels = [
      'scan-games-from-tray',
      'launch-game-from-tray',
      'optimize-game-from-tray',
      'optimize-memory-from-tray',
      'optimize-cpu-from-tray',
      'optimize-network-from-tray'
    ];
    
    if (allowedChannels.includes(channel)) {
      console.log(`Preload: Removendo listener para ${channel}`);
      if (registeredListeners[channel]) {
        registeredListeners[channel].delete(listener);
      }
      ipcRenderer.removeListener(channel, listener);
    }
  },
  
  send: (channel, ...args) => {
    const allowedChannels = [
      'request-scan-games',
      'request-launch-game',
      'request-optimize-game'
    ];
    
    if (allowedChannels.includes(channel)) {
      console.log(`Preload: Enviando mensagem para ${channel}`, args);
      ipcRenderer.send(channel, ...args);
    }
  }
});

console.log('Preload script carregado com sucesso!');
console.log('APIs expostas em electronAPI:', Object.keys(window.electronAPI || {}));
console.log('APIs expostas em ipcRenderer:', Object.keys(window.ipcRenderer || {}));