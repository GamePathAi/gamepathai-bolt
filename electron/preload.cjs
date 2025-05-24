// preload.cjs - GamePath AI Professional v3.0 - Bridge for System Monitoring
const { contextBridge, ipcRenderer } = require('electron');

console.log('🔧 Preload script starting...');

try {
  // Define a comprehensive API for the renderer process
  const electronAPI = {
    // Basic information
    isElectron: true,
    platform: process.platform,
    versions: process.versions,
    
    // File system operations
    fs: {
      exists: (path) => ipcRenderer.invoke('fs-exists', path),
      readDir: (path) => ipcRenderer.invoke('fs-read-dir', path),
      readFile: (path, encoding) => ipcRenderer.invoke('fs-read-file', path, encoding),
      stat: (path) => ipcRenderer.invoke('fs-stat', path),
      getSystemPaths: () => ipcRenderer.invoke('get-system-paths'),
      getEnvVars: () => ipcRenderer.invoke('get-env-vars')
    },
    
    // Game operations
    game: {
      launch: (executablePath, args) => ipcRenderer.invoke('launch-game', executablePath, args)
    },
    
    // Registry operations (simplified without direct HKEY dependency)
    registry: {
      getValue: (hive, key, valueName) => ipcRenderer.invoke('registry-get-value', hive, key, valueName),
      enumerateValues: (hive, key) => ipcRenderer.invoke('registry-enumerate-values', hive, key),
      enumerateKeys: (hive, key) => ipcRenderer.invoke('registry-enumerate-keys', hive, key)
    },
    
    // Registry constants (defined directly to avoid requiring registry-js)
    Registry: {
      HKEY: {
        CLASSES_ROOT: 0,
        CURRENT_USER: 1,
        LOCAL_MACHINE: 2,
        USERS: 3,
        CURRENT_CONFIG: 4
      }
    },
    
    // System monitoring
    monitoring: {
      // System information
      getSystemMetrics: () => ipcRenderer.invoke('get-system-info'),
      getCpuInfo: () => ipcRenderer.invoke('get-cpu-info'),
      getMemoryInfo: () => ipcRenderer.invoke('get-memory-info'),
      getGpuInfo: () => ipcRenderer.invoke('get-gpu-info'),
      getOsInfo: () => ipcRenderer.invoke('get-os-info'),
      getProcesses: () => ipcRenderer.invoke('get-processes'),
      
      // Network metrics
      getNetworkMetrics: () => ipcRenderer.invoke('get-network-metrics'),
      measureLatency: (servers) => ipcRenderer.invoke('measure-latency', servers),
      measureConnectionQuality: (host) => ipcRenderer.invoke('measure-connection-quality', host),
      traceRoute: (host) => ipcRenderer.invoke('trace-route', host),
      estimateBandwidth: () => ipcRenderer.invoke('estimate-bandwidth'),
      calculatePacketLoss: (host, count) => ipcRenderer.invoke('calculate-packet-loss', host, count),
      
      // System optimization
      optimizeCPU: (options) => ipcRenderer.invoke('optimize-cpu', options),
      optimizeMemory: (options) => ipcRenderer.invoke('optimize-memory', options),
      optimizeGPU: (options) => ipcRenderer.invoke('optimize-gpu', options),
      optimizeNetwork: (options) => ipcRenderer.invoke('optimize-network', options),
      
      // Diagnostics
      runDiagnostics: () => ipcRenderer.invoke('run-advanced-diagnostics')
    },
    
    // System information
    system: {
      platform: process.platform,
      version: '3.0.0',
      build: {
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
      }
    },
    
    // Game detection
    getSteamGames: () => ipcRenderer.invoke('get-steam-games'),
    getXboxPackages: () => ipcRenderer.invoke('get-xbox-packages'),
    
    // Event system
    events: {
      on: (channel, callback) => {
        const validChannels = [
          'tray-launch-game', 
          'tray-optimize-game', 
          'tray-scan-games', 
          'tray-optimize-system',
          'system-optimized',
          'game-launched',
          'games-detected'
        ];
        
        if (validChannels.includes(channel)) {
          // Convert to channel:event format for internal use
          const internalChannel = channel.replace(/-/g, ':');
          
          // Create a wrapper function to convert back to the expected format
          const wrappedCallback = (event, ...args) => callback(...args);
          
          // Store the mapping for later removal
          if (!window._eventMappings) window._eventMappings = new Map();
          window._eventMappings.set(callback, wrappedCallback);
          
          ipcRenderer.on(channel, wrappedCallback);
          
          console.log(`Registered event listener for ${channel}`);
        }
      },
      
      off: (channel, callback) => {
        if (!window._eventMappings) return;
        
        const wrappedCallback = window._eventMappings.get(callback);
        if (wrappedCallback) {
          ipcRenderer.removeListener(channel, wrappedCallback);
          window._eventMappings.delete(callback);
          
          console.log(`Removed event listener for ${channel}`);
        }
      },
      
      once: (channel, callback) => {
        const validChannels = [
          'tray-launch-game', 
          'tray-optimize-game', 
          'tray-scan-games', 
          'tray-optimize-system',
          'system-optimized',
          'game-launched',
          'games-detected'
        ];
        
        if (validChannels.includes(channel)) {
          // Create a wrapper function to convert back to the expected format
          const wrappedCallback = (event, ...args) => callback(...args);
          
          ipcRenderer.once(channel, wrappedCallback);
          
          console.log(`Registered one-time event listener for ${channel}`);
        }
      },
      
      emit: (channel, data) => {
        // This is just for compatibility with the web version
        // In Electron, we use ipcRenderer.send directly
        console.log(`Emitting event ${channel} with data:`, data);
      },
      
      removeAll: (channel) => {
        ipcRenderer.removeAllListeners(channel);
        console.log(`Removed all listeners for ${channel}`);
      }
    },
    
    // Tray functions
    tray: {
      updateGames: (games) => {
        try {
          ipcRenderer.send('update-tray-games', games);
          return { success: true };
        } catch (error) {
          console.error('Error updating tray games:', error);
          return { success: false, error: error.message };
        }
      }
    }
  };

  // Expose the API to the renderer process
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('✅ electronAPI exposed successfully');
  
  // Also expose as gamePathAI for compatibility
  contextBridge.exposeInMainWorld('gamePathAI', electronAPI);
  console.log('✅ gamePathAI alias exposed successfully');
  
  // Log available APIs for debugging
  console.log('Available APIs:', Object.keys(electronAPI));
  console.log('System monitoring APIs:', Object.keys(electronAPI.monitoring));
} catch (error) {
  console.error('❌ Preload error:', error);
}