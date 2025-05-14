const os = require('os');
const path = require('path');

// Definições de caminhos para configurações
const CONFIG_DIR = path.join(os.homedir(), '.gamepath-ai');
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');
const CACHE_DIR = path.join(CONFIG_DIR, 'cache');
const PROFILES_DIR = path.join(CONFIG_DIR, 'profiles');

// Configurações padrão
const DEFAULT_CONFIG = {
  general: {
    startWithSystem: false,
    minimizeToTray: true,
    checkForUpdates: true,
    theme: 'dark',
    language: 'auto'
  },
  performance: {
    updateInterval: 1000, // ms
    monitoringEnabled: true,
    loggingEnabled: true,
    logLevel: 'info'
  },
  network: {
    routeOptimizationEnabled: true,
    vpnEnabled: false,
    defaultVpnServer: 'auto'
  },
  games: {
    autoScanOnStartup: true,
    optimizeOnLaunch: false,
    defaultOptimizationProfile: 'balanced'
  }
};

module.exports = {
  CONFIG_DIR,
  LOGS_DIR,
  CACHE_DIR,
  PROFILES_DIR,
  DEFAULT_CONFIG
};