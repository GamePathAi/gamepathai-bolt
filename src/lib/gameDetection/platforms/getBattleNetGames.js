const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const { isLikelyGameExecutable } = require("../gameDetectionUtils");

// Se estiver no Windows, usar o Registry
let Registry;
try {
  Registry = require("registry-js").Registry;
} catch {
  Registry = undefined;
}

/**
 * Busca jogos instalados no Battle.net
 */
async function getBattleNetGames() {
  try {
    // Verificar se estamos no Windows
    if (process.platform !== "win32") {
      console.log("Battle.net scanning is only supported on Windows");
      return [];
    }
    
    // Encontrar o diretório de instalação do Battle.net
    let battleNetPath = "";
    
    // Tentar encontrar pelo registro
    if (Registry?.getValue) {
      battleNetPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net",
        "InstallPath"
      );
      
      if (!battleNetPath) {
        battleNetPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\Blizzard Entertainment\\Battle.net",
          "InstallPath"
        );
      }
    }
    
    // Caminhos padrão
    const defaultPaths = [
      "C:\\Program Files (x86)\\Battle.net",
      "C:\\Program Files\\Battle.net"
    ];
    
    if (!battleNetPath) {
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          battleNetPath = defaultPath;
          break;
        } catch {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!battleNetPath) {
      console.log("Battle.net installation not found");
      return [];
    }
    
    console.log(`Battle.net installation found at: ${battleNetPath}`);
    
    // Possíveis locais de jogos
    const gamePaths = [
      path.join(battleNetPath, "Games"),
      "C:\\Program Files (x86)\\Blizzard Entertainment",
      "C:\\Program Files\\Blizzard Entertainment"
    ];
    
    // Mapeamento de diretórios para jogos conhecidos
    const knownGames = {
      "Overwatch": {
        name: "Overwatch 2",
        process: "Overwatch.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0c8f82b1d7a78e4e/622906a991f4232f0085d3cc/Masthead_Overwatch2_Logo.png"
      },
      "World of Warcraft": {
        name: "World of Warcraft",
        process: "Wow.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltd6b49a2d33e715e1/62f5dcd2c1d5855da1673a4e/WoW_Masthead_Logo.png"
      },
      "Diablo III": {
        name: "Diablo III",
        process: "Diablo III.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltc209ebc106231822/6165ee2c0f19b5111d77c273/D3_Masthead_Logo.png"
      },
      "Diablo IV": {
        name: "Diablo IV",
        process: "Diablo IV.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt7c7f5dec2a3fd536/63c5c7f3a8b0b4111ff3fe7c/Diablo_Masthead_Logo.png"
      },
      "Hearthstone": {
        name: "Hearthstone",
        process: "Hearthstone.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt499f79e3aa1a3b97/62f5dcd2c1d5855da1673a4e/HS_Masthead_Logo.png"
      },
      "StarCraft II": {
        name: "StarCraft II",
        process: "SC2.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltf0f1d06b6f24a8a1/62f5dcd2c1d5855da1673a4e/SC2_Masthead_Logo.png"
      },
      "Call of Duty": {
        name: "Call of Duty",
        process: "BlackOpsColdWar.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0b41c9f1f5d9c542/62f5dcd2c1d5855da1673a4e/COD_Masthead_Logo.png"
      }
    };
    
    const games = [];
    
    // Escanear cada caminho possível
    for (const gamePath of gamePaths) {
      try {
        await fs.access(gamePath);
        console.log(`Scanning Battle.net games in: ${gamePath}`);
        
        const entries = await fs.readdir(gamePath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const gameDir = path.join(gamePath, entry.name);
            
            // Verificar se é um jogo conhecido
            const knownGameEntry = Object.entries(knownGames).find(([key]) => 
              entry.name.includes(key)
            );
            
            if (knownGameEntry) {
              const [key, gameInfo] = knownGameEntry;
              
              // Procurar pelo executável
              let executablePath = "";
              try {
                const files = await fs.readdir(gameDir);
                const exeFiles = files.filter(file => file.endsWith('.exe'));
                
                // Procurar pelo executável conhecido
                const mainExe = exeFiles.find(exe => exe === gameInfo.process) || 
                                exeFiles.find(exe => isLikelyGameExecutable(path.join(gameDir, exe)));
                
                if (mainExe) {
                  executablePath = path.join(gameDir, mainExe);
                }
              } catch (error) {
                console.warn(`Could not scan executables for Battle.net game ${gameInfo.name}:`, error);
              }
              
              // Calcular tamanho
              let sizeInMB = 0;
              try {
                const stats = await fs.stat(gameDir);
                sizeInMB = Math.round(stats.size / (1024 * 1024));
              } catch (error) {
                console.warn(`Could not determine size for Battle.net game ${gameInfo.name}:`, error);
              }
              
              if (executablePath) {
                games.push({
                  id: key.replace(/\s+/g, '').toLowerCase(),
                  name: gameInfo.name,
                  platform: "Battle.net",
                  installPath: gameDir,
                  executablePath,
                  process_name: path.basename(executablePath),
                  size: sizeInMB,
                  icon_url: gameInfo.icon
                });
                
                console.log(`Found Battle.net game: ${gameInfo.name}`);
              }
            } else {
              // Verificar se é um diretório de jogo genérico
              try {
                const files = await fs.readdir(gameDir);
                const exeFiles = files.filter(file => 
                  file.endsWith('.exe') && 
                  isLikelyGameExecutable(path.join(gameDir, file))
                );
                
                if (exeFiles.length > 0) {
                  const gameName = entry.name.replace(/([A-Z])/g, ' $1').trim();
                  const mainExe = exeFiles[0];
                  const executablePath = path.join(gameDir, mainExe);
                  
                  // Calcular tamanho
                  let sizeInMB = 0;
                  try {
                    const stats = await fs.stat(gameDir);
                    sizeInMB = Math.round(stats.size / (1024 * 1024));
                  } catch (error) {
                    console.warn(`Could not determine size for Battle.net game ${gameName}:`, error);
                  }
                  
                  games.push({
                    id: entry.name.replace(/\s+/g, '').toLowerCase(),
                    name: gameName,
                    platform: "Battle.net",
                    installPath: gameDir,
                    executablePath,
                    process_name: mainExe,
                    size: sizeInMB,
                    icon_url: undefined
                  });
                  
                  console.log(`Found Battle.net game: ${gameName}`);
                }
              } catch (error) {
                console.warn(`Could not scan Battle.net game directory ${gameDir}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not access Battle.net games path ${gamePath}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Battle.net games:", error);
    return [];
  }
}

module.exports = { getBattleNetGames };