import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

interface EpicGame {
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
 * Busca jogos instalados no Epic Games Launcher
 */
export async function getEpicGames(): Promise<EpicGame[]> {
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
    let manifest: any = null;
    
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
    const games: EpicGame[] = [];
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
        
        games.push({
          id: appName,
          name,
          platform: "Epic",
          installPath: installLocation,
          executablePath,
          process_name: launchExecutable ? path.basename(launchExecutable) : "",
          size: sizeInMB,
          // Epic não oferece URLs consistentes para imagens
          icon_url: undefined,
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

export default getEpicGames;