const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Busca jogos instalados no Epic Games Launcher
 */
async function getEpicGames() {
  try {
    // Encontrar o arquivo de manifesto do Epic Games Launcher
    let manifestPath = "";
    
    if (process.platform === "win32") {
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
      manifestPath = path.join(
        localAppData,
        "EpicGamesLauncher",
        "Saved",
        "Config",
        "Windows"
      );
    } else if (process.platform === "darwin") {
      manifestPath = path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Epic",
        "EpicGamesLauncher",
        "Config"
      );
    } else {
      manifestPath = path.join(
        os.homedir(),
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
    try {
      await fs.access(manifestPath);
    } catch {
      console.log("Epic Games Launcher config directory not found");
      return [];
    }
    
    // Ler os arquivos do diretório
    const files = await fs.readdir(manifestPath);
    
    // Encontrar o arquivo de manifesto
    const manifestFiles = [
      "GameInstallation.json",
      "InstallationList.json",
      "LauncherInstalled.dat" // Arquivo alternativo
    ];
    
    let manifestContent = "";
    let manifest = null;
    
    for (const manifestFile of manifestFiles) {
      if (files.includes(manifestFile)) {
        try {
          const fullPath = path.join(manifestPath, manifestFile);
          manifestContent = await fs.readFile(fullPath, "utf8");
          
          // Tentar analisar o JSON
          manifest = JSON.parse(manifestContent);
          break;
        } catch (error) {
          console.error(`Error reading Epic manifest ${manifestFile}:`, error);
        }
      }
    }
    
    if (!manifest) {
      console.log("No valid Epic Games installation manifest found");
      return [];
    }
    
    // Extrair informações dos jogos instalados
    const games = [];
    const installations = manifest.InstallationList || [];
    
    console.log(`Found ${installations.length} Epic games in manifest`);
    
    for (const installation of installations) {
      try {
        if (!installation.InstallLocation) {
          console.log(`Skipping Epic game with no install location: ${installation.DisplayName || "Unknown"}`);
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
          console.log(`Skipping Epic non-game application: ${name}`);
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
          console.warn(`Could not determine size for Epic game ${name}:`, error);
        }
        
        // Tentar encontrar um ícone para o jogo
        let iconUrl;
        if (appName) {
          // Usar o CDN da Epic para ícones (formato aproximado)
          iconUrl = `https://cdn1.epicgames.com/offer/store/item/${appName}/landscape-2560x1440`;
        }
        
        games.push({
          id: appName || name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
          name,
          platform: "Epic",
          installPath: installLocation,
          executablePath,
          process_name: launchExecutable ? path.basename(launchExecutable) : "",
          size: sizeInMB,
          icon_url: iconUrl,
          last_played: undefined
        });
        
        console.log(`Found Epic game: ${name}`);
      } catch (error) {
        console.error(`Error processing Epic game:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Epic games:", error);
    return [];
  }
}

module.exports = { getEpicGames };