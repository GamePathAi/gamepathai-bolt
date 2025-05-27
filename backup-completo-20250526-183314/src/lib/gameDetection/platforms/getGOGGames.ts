const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const {  isLikelyGameExecutable  } = require("../gameDetectionUtils.ts");

// Se estiver no Windows, usar o Registry
let Registry;
try {
  Registry = require("registry-js").Registry;
} catch {
  Registry = undefined;
}

/**
 * Busca jogos instalados no GOG Galaxy
 */
async function getGOGGames() {
  try {
    // Verificar se estamos no Windows
    if (process.platform !== "win32") {
      console.log("GOG Galaxy scanning is only supported on Windows");
      return [];
    }
    
    // Encontrar o diretório de instalação do GOG Galaxy
    let gogPath = "";
    
    // Tentar encontrar pelo registro
    if (Registry?.getValue) {
      gogPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient",
        "InstallPath"
      );
      
      if (!gogPath) {
        gogPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\GOG.com\\GalaxyClient",
          "InstallPath"
        );
      }
    }
    
    // Caminhos padrão
    const defaultPaths = [
      "C:\\Program Files (x86)\\GOG Galaxy",
      "C:\\Program Files\\GOG Galaxy"
    ];
    
    if (!gogPath) {
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          gogPath = defaultPath;
          break;
        } catch {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!gogPath) {
      console.log("GOG Galaxy installation not found");
      return [];
    }
    
    console.log();
    
    // Possíveis locais de jogos
    const gamePaths = [
      path.join(gogPath, "Games"),
      "C:\\GOG Games",
      "D:\\GOG Games",
      path.join(os.homedir(), "GOG Games")
    ];
    
    const games = [];
    
    // Escanear cada caminho possível
    for (const gamePath of gamePaths) {
      try {
        await fs.access(gamePath);
        console.log();
        
        const entries = await fs.readdir(gamePath, { withFileTypes });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const gameDir = path.join(gamePath, entry.name);
            
            // Procurar pelo executável
            let executablePath = "";
            let processName = "";
            
            try {
              // Procurar recursivamente por executáveis
              const findExecutables = async (dir, depth = 0) => {
                if (depth > 2) return []; // Limitar profundidade da busca
                
                const files = await fs.readdir(dir, { withFileTypes });
                let executables = [];
                
                for (const file of files) {
                  const filePath = path.join(dir, file.name);
                  
                  if (file.isDirectory()) {
                    const subDirExecutables = await findExecutables(filePath, depth + 1);
                    executables = executables.concat(subDirExecutables);
                  } else if (file.name.endsWith('.exe')) {
                    executables.push(filePath);
                  }
                }
                
                return executables;
              };
              
              const executables = await findExecutables(gameDir);
              
              // Filtrar executáveis que são provavelmente jogos
              const gameExecutables = executables.filter(exe => 
                isLikelyGameExecutable(exe) &&
                !exe.toLowerCase().includes('unins') &&
                !exe.toLowerCase().includes('setup') &&
                !exe.toLowerCase().includes('launcher') &&
                !exe.toLowerCase().includes('config')
              );
              
              if (gameExecutables.length > 0) {
                // Preferir executável com o mesmo nome que o diretório
                const dirName = entry.name.toLowerCase();
                const mainExe = gameExecutables.find(exe => 
                  path.basename(exe).toLowerCase().includes(dirName)
                ) || gameExecutables[0];
                
                executablePath = mainExe;
                processName = path.basename(mainExe);
              }
            } catch (error) {
              console.warn(, error);
            }
            
            // Calcular tamanho
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gameDir);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(, error);
            }
            
            if (executablePath) {
              // Formatar nome do jogo
              const gameName = entry.name
                .replace(/^GOG\s+/, '') // Remover prefixo "GOG "
                .replace(/\s*\(.*?\)$/, ''); // Remover sufixo entre parênteses
              
              games.push().toString('base64')}`,
                name,
                platform: "GOG",
                installPath,
                executablePath,
                process_name,
                size,
                icon_url
              });
              
              console.log();
            }
          }
        }
      } catch (error) {
        console.warn(, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error(, error);
    return [];
  }
}

module.exports = { getGOGGames };