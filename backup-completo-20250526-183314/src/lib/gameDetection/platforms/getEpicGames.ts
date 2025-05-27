const fs = require("fs/promises");
const path = require("path-browserify");
const os = require("os");
const {  isLikelyGameExecutable  } = require("../gameDetectionUtils.ts");
const {  isElectron  } = require("../isElectron.ts");

/**
 * Busca jogos instalados no Epic Games Launcher
 */
async function getEpicGames() {
  try {
    // Check if we're in Electron environment
    if (!isElectron()) {
      console.log("Epic Games detection requires Electron environment");
      return [];
    }

    const { fs, registry, Registry } = window.electronAPI;
    const envVars = await window.electronAPI.fs.getEnvVars();
    
    // Encontrar o arquivo de manifesto do Epic Games Launcher
    let manifestPath = "";
    
    if (window.electronAPI.system.platform === "win32") {
      const localAppData = envVars.LOCALAPPDATA || path.join(envVars.USERPROFILE, "AppData", "Local");
      manifestPath = path.join(
        localAppData,
        "EpicGamesLauncher",
        "Saved",
        "Config",
        "Windows"
      );
    } else if (window.electronAPI.system.platform === "darwin") {
      const homedir = (await window.electronAPI.fs.getSystemPaths()).home;
      manifestPath = path.join(
        homedir,
        "Library",
        "Application Support",
        "Epic",
        "EpicGamesLauncher",
        "Config"
      );
    } else {
      const homedir = (await window.electronAPI.fs.getSystemPaths()).home;
      manifestPath = path.join(
        homedir,
        ".config",
        "Epic",
        "EpicGamesLauncher"
      );
    }
    
    if (!manifestPath) {
      console.log("Epic Games Launcher config path not found");
      return [];
    }
    
    // Verificar se o diretório existe
    if (!await fs.exists(manifestPath)) {
      console.log("Epic Games Launcher config directory not found");
      return [];
    }
    
    // Ler os arquivos do diretório
    const files = await fs.readDir(manifestPath);
    
    // Encontrar o arquivo de manifesto
    const manifestFiles = [
      "GameInstallation.json",
      "InstallationList.json",
      "LauncherInstalled.dat" // Arquivo alternativo
    ];
    
    let manifestContent = "";
    let manifest = null;
    
    for (const manifestFile of manifestFiles) {
      const matchingFile = files.find(file => file.name === manifestFile);
      if (matchingFile) {
        try {
          const fullPath = matchingFile.path;
          manifestContent = await fs.readFile(fullPath);
          
          // Tentar analisar o JSON
          manifest = JSON.parse(manifestContent);
          break;
        } catch (error) {
          console.error("Error reading Epic manifest:", error);
        }
      }
    }
    
    if (!manifest) {
      console.log("No valid Epic Games installation manifest found");
      
      // Fallback to scan common installation directories
      const commonPaths = [
        "C:\\Program Files\\Epic Games",
        "C:\\Program Files (x86)\\Epic Games",
        "D:\\Epic Games",
        "E:\\Epic Games"
      ];
      
      return await scanEpicDirectories(fs, commonPaths);
    }
    
    // Extrair informações dos jogos instalados
    const games = [];
    const installations = manifest.InstallationList || [];
    
    console.log(`Found ${installations.length} Epic games in manifest`);
    
    for (const installation of installations) {
      try {
        if (!installation.InstallLocation) {
          console.log();
          continue;
        }
        
        const name = installation.DisplayName;
        const appName = installation.AppName;
        const installLocation = installation.InstallLocation;
        const launchExecutable = installation.LaunchExecutable;
        
        // Verificar se é realmente um jogo (não um aplicativo ou ferramenta)
        if (appName && (
          appName.includes("UE_") || 
          appName.includes("Editor") || 
          appName.includes("Launcher") ||
          appName.includes("Tool") ||
          appName.includes("SDK")
        )) {
          console.log();
          continue;
        }
        
        let executablePath = "";
        if (launchExecutable) {
          executablePath = path.join(installLocation, launchExecutable);
        }
        
        // Calcular tamanho do jogo
        let sizeInMB = 0;
        try {
          const stats = await fs.stat(installLocation);
          sizeInMB = Math.round(stats.size / (1024 * 1024));
        } catch (error) {
          console.warn(, error);
        }
        
        // Tentar encontrar um ícone para o jogo
        let iconUrl;
        if (appName) {
          // Usar o CDN da Epic para ícones (formato aproximado)
          iconUrl = `https://cdn1.epicgames.com/offer/store/item/${appName}/landscape-2560x1440`;
        }
        
        games.push(, "").toLowerCase()}`,
          name,
          platform: "Epic",
          installPath,
          executablePath,
          process_name ? path.basename(launchExecutable) : "",
          size,
          icon_url,
          last_played
        });
        
        console.log();
      } catch (error) {
        console.error(, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error(, error);
    return [];
  }
}

// Fallback function to scan common Epic Games directories
async function scanEpicDirectories(fs, directories) {
  const games = [];
  
  for (const dir of directories) {
    if (await fs.exists(dir)) {
      try {
        const entries = await fs.readDir(dir);
        
        for (const entry of entries) {
          if (entry.isDirectory && entry.name !== 'Launcher') {
            const gamePath = entry.path;
            
            // Try to find executable
            let executablePath = "";
            let processName = "";
            
            try {
              const gameFiles = await fs.readDir(gamePath);
              const exeFiles = gameFiles.filter((file) => file.name.toLowerCase().endsWith(".exe"));
              
              if (exeFiles.length > 0) {
                // Filter out non-game executables
                const gameExes = exeFiles.filter((file) => 
                  !file.name.toLowerCase().includes("installer") &&
                  !file.name.toLowerCase().includes("setup") &&
                  !file.name.toLowerCase().includes("unins") &&
                  !file.name.toLowerCase().includes("launcher")
                );
                
                const mainExe = gameExes.length > 0 ? gameExes[0] [0];
                executablePath = mainExe.path;
                processName = mainExe.name;
              }
            } catch (error) {
              console.warn(, error);
            }
            
            // Calculate size
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gamePath);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(, error);
            }
            
            if (executablePath) {
              games.push(, "").toLowerCase()}`,
                name.name,
                platform: "Epic",
                installPath,
                executablePath,
                process_name,
                size,
                icon_url,
                last_played
              });
              
              console.log();
            }
          }
        }
      } catch (error) {
        console.warn(, error);
      }
    }
  }
  
  return games;
}

module.exports = { getEpicGames };