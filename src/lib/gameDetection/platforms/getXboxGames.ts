const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// APENAS apps que são CERTAMENTE jogos
const GAME_WHITELIST = [
  'Microsoft.GamingApp',
  'Microsoft.XboxGamingOverlay', 
  'Microsoft.MicrosoftSolitaireCollection',
  'Call of Duty'  // Adicionado!
];

// Ignorar stubs e DLCs
const IGNORE_PATTERNS = [
  'stub', 'dlc', 'tracker', 'cross-gen', 'beta', 'gamesave',
  'audio', 'control', 'panel', 'driver', 'realtek', 'nvidia'
];

function isRealGame(name) {
  const nameLower = name.toLowerCase();
  
  // Ignorar padrões conhecidos de não-jogos
  for (const pattern of IGNORE_PATTERNS) {
    if (nameLower.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

async function getXboxGames() {
  try {
    console.log('🎮 Detectando jogos Xbox...');
    const games = [];
    
    // 1. DETECTAR JOGOS EM C:\XboxGames
    const xboxGamesPath = 'C:\\XboxGames';
    if (fs.existsSync(xboxGamesPath)) {
      console.log('📁 Verificando pasta XboxGames...');
      
      const folders = await fs.promises.readdir(xboxGamesPath);
      
      for (const folder of folders) {
        if (isRealGame(folder)) {
          const gamePath = path.join(xboxGamesPath, folder);
          const stats = await fs.promises.stat(gamePath);
          
          if (stats.isDirectory()) {
            // Procurar executáveis
            const exes = await findExecutables(gamePath);
            
            if (exes.length > 0) {
              // Para Call of Duty, usar o cod.exe principal
              let mainExe = exes.find(exe => exe.name === 'cod.exe') || exes[0];
              
              games.push({
                id: 'xbox-' + folder.replace(/\s/g, '-'),
                name: folder,
                platform: 'Xbox',
                executablePath: mainExe.path,
                process_name: mainExe.name,
                installPath: gamePath,
                packageName: folder,
                publisher: 'Xbox Game Pass',
                size: 0,
                icon_url: '',
                optimized: false,
                last_played: null,
                // Adicionar info sobre sub-jogos
                subGames: folder === 'Call of Duty' ? [
                  { name: 'Modern Warfare 2', exe: 'cod22-cod.exe' },
                  { name: 'Modern Warfare 3', exe: 'cod23-cod.exe' },
                  { name: 'MW2 Campaign', exe: 'sp22-cod.exe' },
                  { name: 'MW3 Campaign', exe: 'sp23-cod.exe' }
                ] : []
              });
              
              console.log('✅ Jogo encontrado:', folder);
            }
          }
        }
      }
    }
    
    // 2. DETECTAR APPS UWP (código anterior simplificado)
    try {
      const command = 'powershell -ExecutionPolicy Bypass -Command "Get-AppxPackage | Where-Object {$_.Name -like \'*game*\' -or $_.Name -like \'*xbox*\'} | Select-Object Name, InstallLocation | ConvertTo-Json"';
      
      const { stdout } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });
      
      if (stdout) {
        let packages = JSON.parse(stdout);
        if (!Array.isArray(packages)) packages = [packages];
        
        for (const pkg of packages) {
          if (pkg && GAME_WHITELIST.includes(pkg.Name)) {
            games.push({
              id: 'xbox-' + pkg.Name,
              name: pkg.Name === 'Microsoft.GamingApp' ? 'Xbox' : pkg.Name,
              platform: 'Xbox',
              executablePath: pkg.InstallLocation,
              process_name: 'GameApp.exe',
              installPath: pkg.InstallLocation,
              packageName: pkg.Name,
              publisher: 'Microsoft',
              size: 0,
              icon_url: '',
              optimized: false,
              last_played: null
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao detectar apps UWP:', error.message);
    }
    
    console.log('🎮 Total de jogos Xbox encontrados:', games.length);
    return games;
    
  } catch (error) {
    console.error('❌ Erro em getXboxGames:', error);
    return [];
  }
}

// Função auxiliar para encontrar executáveis
async function findExecutables(dirPath, depth = 0) {
  if (depth > 3) return []; // Limitar profundidade
  
  const exes = [];
  try {
    const items = await fs.promises.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.promises.stat(itemPath);
      
      if (stats.isFile() && item.endsWith('.exe')) {
        if (!item.includes('crash') && !item.includes('helper') && !item.includes('uninstall')) {
          exes.push({ name: item, path: itemPath });
        }
      } else if (stats.isDirectory() && depth < 3) {
        const subExes = await findExecutables(itemPath, depth + 1);
        exes.push(...subExes);
      }
    }
  } catch (e) {
    // Ignorar erros de permissão
  }
  
  return exes;
}

module.exports = { getXboxGames };