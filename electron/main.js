import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { Registry } from 'registry-js';
import * as si from 'systeminformation';
import Store from 'electron-store';

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

function getSteamGames() {
  const steamPath = Registry.getValue(
    Registry.HKEY.LOCAL_MACHINE,
    'SOFTWARE\\WOW6432Node\\Valve\\Steam',
    'InstallPath'
  );

  // Implementation for Steam games detection
  return [];
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