import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { Registry } from 'registry-js';
import * as si from 'systeminformation';
import Store from 'electron-store';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

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

// Game detection functions
async function scanForGames() {
  const steamGames = getSteamGames();
  const epicGames = getEpicGames();
  const xboxGames = getXboxGames();

  return {
    steam: await steamGames,
    epic: await epicGames,
    xbox: await xboxGames
  };
}

async function getSteamGames() {
  try {
    // Get Steam installation path from registry
    const steamPath = Registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      'SOFTWARE\\WOW6432Node\\Valve\\Steam',
      'InstallPath'
    );

    if (!steamPath) {
      console.log('Steam installation not found');
      return [];
    }

    // Read Steam library folders configuration
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    let libraryFoldersContent;
    
    try {
      libraryFoldersContent = await fs.readFile(libraryFoldersPath, 'utf8');
    } catch (error) {
      console.error('Error reading Steam library folders:', error);
      return [];
    }

    // Parse library folders VDF file
    const libraryPaths = [steamPath];
    const libraryRegex = /"path"\s+"([^"]+)"/g;
    let match;
    
    while ((match = libraryRegex.exec(libraryFoldersContent)) !== null) {
      libraryPaths.push(match[1].replace(/\\\\/g, '\\'));
    }

    const games = [];

    // Scan each library folder for installed games
    for (const libraryPath of libraryPaths) {
      const appsPath = path.join(libraryPath, 'steamapps');
      
      try {
        const files = await fs.readdir(appsPath);
        
        // Look for appmanifest files which contain game information
        const manifests = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
        
        for (const manifest of manifests) {
          try {
            const manifestPath = path.join(appsPath, manifest);
            const manifestContent = await fs.readFile(manifestPath, 'utf8');
            
            // Parse game information from manifest
            const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
            const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
            const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);
            const sizeOnDiskMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(manifestContent);
            
            if (nameMatch && appIdMatch && installDirMatch) {
              const name = nameMatch[1];
              const appId = appIdMatch[1];
              const installDir = installDirMatch[1];
              const sizeInBytes = sizeOnDiskMatch ? parseInt(sizeOnDiskMatch[1]) : 0;
              const sizeInGB = Math.round(sizeInBytes / (1024 * 1024 * 1024));
              
              const gamePath = path.join(appsPath, 'common', installDir);
              const executablePath = path.join(gamePath, `${installDir}.exe`);
              
              games.push({
                id: appId,
                name,
                platform: 'Steam',
                installPath: gamePath,
                executablePath,
                size: sizeInGB,
                iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
              });
            }
          } catch (error) {
            console.error(`Error processing manifest ${manifest}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error reading library folder ${libraryPath}:`, error);
      }
    }

    return games;
  } catch (error) {
    console.error('Error scanning Steam games:', error);
    return [];
  }
}

function getEpicGames() {
  const epicPath = Registry.getValue(
    Registry.HKEY.LOCAL_MACHINE,
    'SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher',
    'AppDataPath'
  );

  // Implementation for Epic games detection
  return [];
}

function getXboxGames() {
  const xboxPath = Registry.getValue(
    Registry.HKEY.LOCAL_MACHINE,
    'SOFTWARE\\Microsoft\\Xbox',
    'InstallPath'
  );

  // Implementation for Xbox games detection
  return [];
}

// System monitoring functions
async function getSystemInfo() {
  const cpu = await si.cpu();
  const mem = await si.mem();
  const gpu = await si.graphics();
  const os = await si.osInfo();

  return {
    cpu,
    memory: mem,
    gpu: gpu.controllers[0],
    os
  };
}

// IPC handlers for communication with renderer process
import { ipcMain } from 'electron';

ipcMain.handle('scan-games', async () => {
  return await scanForGames();
});

ipcMain.handle('get-system-info', async () => {
  return await getSystemInfo();
});

ipcMain.handle('launch-game', async (event, gamePath) => {
  // Implementation for game launching
});