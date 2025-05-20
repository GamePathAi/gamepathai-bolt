import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { isLikelyGameExecutable } from "../gameDetectionUtils";

// Se estiver no Windows, usar o Registry
let Registry: any;
try {
  Registry = require("registry-js").Registry;
} catch {
  Registry = undefined;
}

interface GOGGame {
  id: string;
  name: string;
  platform: string;
  installPath: string;
  executablePath: string;
  process_name: string;
  size: number; // em MB
  icon_url?: string;
  last_played?: Date;
}

/**
 * Busca jogos instalados no GOG Galaxy
 */
export async function getGOGGames(): Promise<GOGGame[]> {
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
    
    console.log(`GOG Galaxy installation found at: ${gogPath}`);
    
    // Possíveis locais de jogos
    const gamePaths = [
      path.join(gogPath, "Games"),
      "C:\\GOG Games",
      "D:\\GOG Games",
      path.join(os.homedir(), "GOG Games")
    ];
    
    const games: GOGGame[] = [];
    
    // Escanear cada caminho possível
    for (const gamePath of gamePaths) {
      try {
        await fs.access(gamePath);
        console.log(`Scanning GOG games in: ${gamePath}`);
        
        const entries = await fs.readdir(gamePath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const gameDir = path.join(gamePath, entry.name);
            
            // Procurar pelo executável
            let executablePath = "";
            let processName = "";
            
            try {
              // Procurar recursivamente por executáveis
              const findExecutables = async (dir: string, depth = 0): Promise<string[]> => {
                if (depth > 2) return []; // Limitar profundidade da busca
                
                const files = await fs.readdir(dir, { withFileTypes: true });
                let executables: string[] = [];
                
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
                .replace(/\s*\(.*?\)$/, ''); // Remover sufixo entre parênteses
              
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

export default getGOGGames;