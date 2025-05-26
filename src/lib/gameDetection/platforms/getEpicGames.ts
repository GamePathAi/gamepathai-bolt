const fs = require('fs/promises');
const path = require('path-browserify');
const { isLikelyGameExecutable, fileExists } = require('../gameDetectionUtils.ts');
async function getEpicGames() {
  try {
    // isElectron check removed - always runs in backend

    const games = [];
    
    // Caminhos possíveis da Epic Games
    const possibleEpicPaths = [
      'C:\\Program Files\\Epic Games',
      'C:\\Program Files (x86)\\Epic Games',
      'D:\\Epic Games',
      'E:\\Epic Games',
      'F:\\Epic Games'
    ];

    // Encontrar onde a Epic está instalada
    let epicPath = null;
    for (const testPath of possibleEpicPaths) {
      try {
        const exists = await window.electronAPI.fs.exists(testPath);
        if (exists) {
          epicPath = testPath;
          console.log('Epic Games found at:', epicPath);
          break;
        }
      } catch (error) {
        // Continuar tentando
      }
    }

    if (!epicPath) {
      console.log('Epic Games installation not found');
      return [];
    }

    // Listar pastas de jogos
    try {
      const gameFolders = await window.electronAPI.fs.readDirectory(epicPath);
      
      for (const folder of gameFolders) {
        // Pular Launcher da Epic
        if (folder.toLowerCase().includes('launcher')) continue;
        
        const gamePath = path.join(epicPath, folder);
        
        // Procurar executáveis recursivamente
        const findExecutables = async (dir, depth = 0) => {
          if (depth > 3) return null; // Limitar profundidade
          
          try {
            const files = await window.electronAPI.fs.readDirectory(dir);
            
            for (const file of files) {
              const fullPath = path.join(dir, file);
              
              // Se for um executável válido
              if (isLikelyGameExecutable(file)) {
                const exists = await fileExists(fullPath);
                if (exists) {
                  return { exe: file, path: fullPath };
                }
              }
              
              // Se for uma pasta, buscar dentro (Binaries, Win64, etc)
              if (file === 'Binaries' || file === 'Win64' || file === 'x64') {
                const result = await findExecutables(fullPath, depth + 1);
                if (result) return result;
              }
            }
          } catch (error) {
            // Ignorar erros de acesso
          }
          
          return null;
        };
        
        const gameExe = await findExecutables(gamePath);
        
        if (gameExe) {
          games.push({
            id: 'epic-' + folder.toLowerCase().replace(/\s+/g, '-'),
            name: folder,
            platform: 'Epic',
            executablePath: gameExe.path,
            process_name: gameExe.exe,
            installPath: gamePath,
            size: 0,
            icon_url: '',
            optimized: false,
            last_played: null
          });
          
          console.log('Found Epic game:', folder);
        }
      }
    } catch (error) {
      console.error('Error reading Epic Games folder:', error);
    }
    
    console.log('Total Epic games found:', games.length);
    return games;
    
  } catch (error) {
    console.error('Error in getEpicGames:', error);
    return [];
  }
}

module.exports = { getEpicGames };
