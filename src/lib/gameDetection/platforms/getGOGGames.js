import fs from "fs/promises";
import path from "path";
import os from "os";
import { isLikelyGameExecutable } from "../gameDetectionUtils";

// Se estiver no Windows, usar o Registry
let Registry;
try {
  // Registry import removed - will use mock
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
    
    // Encontrar o diretÃ³rio de instalaÃ§Ã£o do GOG Galaxy
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
    
    // Caminhos padrÃ£o
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
          // Caminho nÃ£o existe, continuar para o prÃ³ximo
        }
      }
    }
    
    if (!gogPath) {
      console.log("GOG Galaxy installation not found");
      return [];
    }
    
    console.log(`GOG Galaxy installation found at: ${gogPath}`);
    
    // PossÃ­veis locais de jogos
    const gamePaths = [
      path.join(gogPath, "Games"),
      "C:\\GOG Games",
      "D:\\GOG Games",
      path.join(os.homedir(), "GOG Games")
    ];
    
    const games = [];
    
    // Escanear cada caminho possÃ­vel
    for (const gamePath of gamePaths) {
      try {
        await fs.access(gamePath);
        console.log(`Scanning GOG games in: ${gamePath}`);
        
        const entries = await fs.readdir(gamePath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const gameDir = path.join(gamePath, entry.name);
            
            // Procurar pelo executÃ¡vel
            let executablePath = "";
            let processName = "";
            
            try {
              // Procurar recursivamente por executÃ¡veis
              const findExecutables = async (dir, depth = 0) => {
                if (depth > 2) return []; // Limitar profundidade da busca
                
                const files = await fs.readdir(dir, { withFileTypes: true });
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
              
              // Filtrar executÃ¡veis que sÃ£o provavelmente jogos
              const gameExecutables = executables.filter(exe => 
                isLikelyGameExecutable(exe) &&
                !exe.toLowerCase().includes('unins') &&
                !exe.toLowerCase().includes('setup') &&
                !exe.toLowerCase().includes('launcher') &&
                !exe.toLowerCase().includes('config')
              );
              
              if (gameExecutables.length > 0) {
                // Preferir executÃ¡vel com o mesmo nome que o diretÃ³rio
                const dirName = entry.name.toLowerCase();
                const mainExe = gameExecutables.find(exe => 
                  path.basename(exe).toLowerCase().includes(dirName)
                ) || gameExecutables[0];
                
                executablePath = mainExe;
                processName = path.basename(mainExe);
              }
            } catch (error) {
              console.warn(`Could not scan executables for GOG game ${entry.name}:`, error);
            }
            
            // Calcular tamanho
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gameDir);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for GOG game ${entry.name}:`, error);
            }
            
            if (executablePath) {
              // Formatar nome do jogo
              const gameName = entry.name
                .replace(/^GOG\s+/, '') // Remover prefixo "GOG "
                .replace(/\s*\(.*?\)$/, ''); // Remover sufixo entre parÃªnteses
              
              games.push({
                id: `gog-${Buffer.from(gameDir).toString('base64')}`,
                name: gameName,
                platform: "GOG",
                installPath: gameDir,
                executablePath,
                process_name: processName,
                size: sizeInMB,
                icon_url: undefined
              });
              
              console.log(`Found GOG game: ${gameName}`);
            }
          }
        }
      } catch (error) {
        console.warn(`Could not access GOG games path ${gamePath}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning GOG games:", error);
    return [];
  }
}

export { getGOGGames };