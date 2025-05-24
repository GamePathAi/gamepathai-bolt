// preload.cjs - Simplified version to fix HKEY error
const { contextBridge, ipcRenderer } = require('electron');

console.log('🔧 Preload script starting...');

try {
  // Define a minimal API that doesn't depend on registry-js
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
    getXboxPackages: () => ipcRenderer.invoke('get-xbox-packages')
  };

  // Expose the API to the renderer process
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('✅ Basic electronAPI exposed successfully');
} catch (error) {
  console.error('❌ Preload error:', error);
}