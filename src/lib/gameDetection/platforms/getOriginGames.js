import fs from "fs/promises";
import path from "path";
import os from "os";

// Se estiver no Windows, usar o Registry
let Registry;
try {
  // Registry import removed - will use mock
} catch {
  Registry = undefined;
}

/**
 * Busca jogos instalados no Origin/EA Desktop
 */
async function getOriginGames() {
  try {
    // Verificar se estamos no Windows
    if (process.platform !== "win32") {
      console.log("Origin/EA Desktop scanning is only supported on Windows");
      return [];
    }
    
    // Encontrar o diretÃ³rio de instalaÃ§Ã£o da Origin
    let originPath = "";
    let eaDesktopPath = "";
    
    // Tentar encontrar a Origin
    if (Registry?.getValue) {
      originPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Origin",
        "InstallDir"
      );
      
      if (!originPath) {
        originPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\Origin",
          "InstallDir"
        );
      }
    }
    
    // Tentar encontrar o EA Desktop
    if (Registry?.getValue) {
      eaDesktopPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Electronic Arts\\EA Desktop",
        "InstallDir"
      );
    }
    
    // Caminhos padrÃ£o
    const defaultOriginPaths = [
      "C:\\Program Files (x86)\\Origin",
      "C:\\Program Files\\Origin"
    ];
    
    const defaultEADesktopPaths = [
      "C:\\Program Files\\Electronic Arts\\EA Desktop",
      "C:\\Program Files (x86)\\Electronic Arts\\EA Desktop"
    ];
    
    if (!originPath) {
      for (const defaultPath of defaultOriginPaths) {
        try {
          await fs.access(defaultPath);
          originPath = defaultPath;
          break;
        } catch {
          // Caminho nÃ£o existe, continuar para o prÃ³ximo
        }
      }
    }
    
    if (!eaDesktopPath) {
      for (const defaultPath of defaultEADesktopPaths) {
        try {
          await fs.access(defaultPath);
          eaDesktopPath = defaultPath;
          break;
        } catch {
          // Caminho nÃ£o existe, continuar para o prÃ³ximo
        }
      }
    }
    
    if (!originPath && !eaDesktopPath) {
      console.log("Origin/EA Desktop installation not found");
      return [];
    }
    
    // Encontrar os diretÃ³rios de jogos
    let gamesPaths = [];
    
    // Origin
    if (originPath) {
      console.log(`Origin installation found at: ${originPath}`);
      
      // Tentar encontrar o caminho dos jogos pelo registro
      if (Registry?.getValue) {
        const originGamesPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\WOW6432Node\\Origin",
          "GamesPath"
        );
        
        if (originGamesPath) {
          gamesPaths.push(originGamesPath);
        }
      }
      
      // Caminhos padrÃ£o para jogos da Origin
      const defaultOriginGamesPaths = [
        "C:\\Program Files (x86)\\Origin Games",
        "C:\\Program Files\\Origin Games",
        path.join(os.homedir(), "Origin Games")
      ];
      
      for (const defaultPath of defaultOriginGamesPaths) {
        try {
          await fs.access(defaultPath);
          if (!gamesPaths.includes(defaultPath)) {
            gamesPaths.push(defaultPath);
          }
        } catch {
          // Caminho nÃ£o existe, continuar para o prÃ³ximo
        }
      }
    }
    
    // EA Desktop
    if (eaDesktopPath) {
      console.log(`EA Desktop installation found at: ${eaDesktopPath}`);
      
      // Verificar Local Content para jogos
      const eaContentPath = path.join(
        process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
        "Electronic Arts",
        "EA Desktop",
        "LocalContent"
      );
      
      try {
        await fs.access(eaContentPath);
        if (!gamesPaths.includes(eaContentPath)) {
          gamesPaths.push(eaContentPath);
        }
      } catch {
        // Caminho nÃ£o existe
      }
    }
    
    if (gamesPaths.length === 0) {
      console.log("No Origin/EA Desktop games paths found");
      return [];
    }
    
    console.log(`Found ${gamesPaths.length} Origin/EA games paths: ${gamesPaths.join(", ")}`);
    
    // Escanear cada diretÃ³rio de jogos
    const games = [];
    
    for (const gamesPath of gamesPaths) {
      try {
        const entries = await fs.readdir(gamesPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            try {
              const gamePath = path.join(gamesPath, entry.name);
              const name = entry.name;
              
              // Tentar encontrar executÃ¡veis
              let executablePath = "";
              let processName = "";
              
              try {
                const gameFiles = await fs.readdir(gamePath);
                const exeFiles = gameFiles.filter(file => file.toLowerCase().endsWith(".exe"));
                
                if (exeFiles.length > 0) {
                  // Preferir executÃ¡vel com o mesmo nome que o diretÃ³rio
                  const mainExe = exeFiles.find(file => 
                    file.toLowerCase().includes(name.toLowerCase()) 
                  ) || exeFiles[0];
                  
                  executablePath = path.join(gamePath, mainExe);
                  processName = mainExe;
                }
              } catch (error) {
                console.warn(`Could not scan executables for Origin game ${name}:`, error);
              }
              
              // Calcular tamanho
              let sizeInMB = 0;
              try {
                const stats = await fs.stat(gamePath);
                sizeInMB = Math.round(stats.size / (1024 * 1024));
              } catch (error) {
                console.warn(`Could not determine size for Origin game ${name}:`, error);
              }
              
              if (executablePath) {
                games.push({
                  id: name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
                  name,
                  platform: "Origin",
                  installPath: gamePath,
                  executablePath,
                  process_name: processName,
                  size: sizeInMB,
                  icon_url: undefined,
                  last_played: undefined
                });
                
                console.log(`Found Origin game: ${name}`);
              }
            } catch (error) {
              console.error(`Error processing Origin game directory ${entry.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading Origin games directory ${gamesPath}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Origin games:", error);
    return [];
  }
}

export { getOriginGames };