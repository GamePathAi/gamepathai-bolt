const fs = require('fs');
const path = require('path');
const vdf = require('vdf');

async function getSteamGames() {
  try {
    console.log('🎮 Detectando jogos Steam...');
    
    // Possíveis localizações do Steam no Windows
    const possibleSteamPaths = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam',
      'D:\\Steam',
      'E:\\Steam',
      'F:\\Steam',
      'D:\\Program Files (x86)\\Steam',
      'D:\\Program Files\\Steam'
    ];
    
    // Encontrar onde o Steam está instalado
    let steamPath = null;
    for (const path of possibleSteamPaths) {
      console.log(`Verificando: ${path}`);
      if (fs.existsSync(path)) {
        steamPath = path;
        console.log(`✅ Steam encontrado em: ${steamPath}`);
        break;
      }
    }
    
    if (!steamPath) {
      console.log('❌ Steam installation not found');
      return [];
    }
    
    // Caminho para os manifestos dos apps
    const steamAppsPath = path.join(steamPath, 'steamapps');
    const commonPath = path.join(steamAppsPath, 'common');
    
    if (!fs.existsSync(steamAppsPath)) {
      console.log('❌ steamapps folder not found');
      return [];
    }
    
    const games = [];
    
    // Ler todos os arquivos .acf (manifestos dos jogos)
    const files = fs.readdirSync(steamAppsPath);
    const acfFiles = files.filter(file => file.startsWith('appmanifest_') && file.endsWith('.acf'));
    
    console.log(`📁 Encontrados ${acfFiles.length} manifestos de jogos`);
    
    for (const acfFile of acfFiles) {
      try {
        const manifestPath = path.join(steamAppsPath, acfFile);
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = vdf.parse(content);
        
        if (manifest && manifest.AppState) {
          const appState = manifest.AppState;
          const appId = appState.appid;
          const name = appState.name;
          const installDir = appState.installdir;
          
          if (name && installDir) {
            const gamePath = path.join(commonPath, installDir);
            
            if (fs.existsSync(gamePath)) {
              // Procurar executável
              const exePath = findGameExecutable(gamePath, name);
              
              games.push({
                id: `steam-${appId}`,
                name: name,
                platform: 'Steam',
                appId: appId,
                executablePath: exePath || gamePath,
                process_name: exePath ? path.basename(exePath) : `${name}.exe`,
                installPath: gamePath,
                icon_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
                optimized: false,
                last_played: null,
                steamId: appId
              });
              
              console.log(`✅ Jogo encontrado: ${name} (App ID: ${appId})`);
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao processar ${acfFile}:`, error.message);
      }
    }
    
    console.log(`🎮 Total de jogos Steam encontrados: ${games.length}`);
    return games;
    
  } catch (error) {
    console.error('❌ Erro em getSteamGames:', error);
    return [];
  }
}

// Função auxiliar para encontrar o executável do jogo
function findGameExecutable(gamePath, gameName) {
  try {
    // Padrões comuns de executáveis
    const possibleExeNames = [
      `${gameName}.exe`,
      `${gameName.replace(/\s+/g, '')}.exe`,
      'game.exe',
      'launcher.exe',
      'start.exe'
    ];
    
    // Procurar na pasta raiz
    for (const exeName of possibleExeNames) {
      const exePath = path.join(gamePath, exeName);
      if (fs.existsSync(exePath)) {
        return exePath;
      }
    }
    
    // Procurar executáveis na pasta
    const files = fs.readdirSync(gamePath);
    const exeFiles = files.filter(f => f.endsWith('.exe'));
    
    // Para Red Dead Redemption 2
    if (gameName.includes('Red Dead')) {
      const rdr2Exe = exeFiles.find(f => f.toLowerCase().includes('rdr2'));
      if (rdr2Exe) return path.join(gamePath, rdr2Exe);
    }
    
    // Retornar o primeiro .exe encontrado
    if (exeFiles.length > 0) {
      return path.join(gamePath, exeFiles[0]);
    }
    
  } catch (error) {
    console.error('Erro ao procurar executável:', error.message);
  }
  
  return null;
}

module.exports = { getSteamGames };