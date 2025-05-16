import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// Se estiver no Windows, usar o Registry
let Registry: any;
try {
  Registry = require("registry-js").Registry;
} catch {
  Registry = undefined;
}

interface SteamGame {
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
 * Busca jogos instalados no Steam
 */
export async function getSteamGames(): Promise<SteamGame[]> {
  try {
    // Encontrar o diretório de instalação do Steam
    let steamPath = "";
    
    // No Windows, tentar pelo registro
    if (process.platform === "win32" && Registry?.getValue) {
      steamPath = Registry.getValue(
        Registry.HKEY.CURRENT_USER,
        "SOFTWARE\\Valve\\Steam",
        "SteamPath"
      );
      
      // Se não encontrar pelo CURRENT_USER, tentar LOCAL_MACHINE
      if (!steamPath) {
        steamPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\WOW6432Node\\Valve\\Steam",
          "InstallPath"
        );
      }
    }
    
    // Caminhos padrão para diferentes plataformas
    if (!steamPath) {
      const defaultPaths = {
        win32: [
          "C:\\Program Files (x86)\\Steam",
          "C:\\Program Files\\Steam",
        ],
        darwin: [
          path.join(os.homedir(), "Library/Application Support/Steam"),
        ],
        linux: [
          path.join(os.homedir(), ".steam/steam"),
          path.join(os.homedir(), ".local/share/Steam"),
        ],
      };
      
      const platformPaths = defaultPaths[process.platform as keyof typeof defaultPaths] || [];
      
      // Verificar cada caminho padrão
      for (const defaultPath of platformPaths) {
        try {
          await fs.access(defaultPath);
          steamPath = defaultPath;
          break;
        } catch {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!steamPath) {
      console.log("Steam installation not found");
      return [];
    }
    
    console.log(`Steam installation found at: ${steamPath}`);
    
    // Encontrar as bibliotecas de jogos do Steam
    const libraries = [steamPath];
    
    // Ler o arquivo libraryfolders.vdf para encontrar mais bibliotecas
    try {
      // Caminhos possíveis para o arquivo libraryfolders.vdf
      const libraryFoldersPaths = [
        path.join(steamPath, "steamapps", "libraryfolders.vdf"), // Caminho mais recente
        path.join(steamPath, "config", "libraryfolders.vdf"), // Caminho mais antigo
      ];
      
      let libraryFoldersContent = "";
      
      for (const libPath of libraryFoldersPaths) {
        try {
          await fs.access(libPath);
          libraryFoldersContent = await fs.readFile(libPath, "utf8");
          break;
        } catch {
          // Arquivo não existe, continuar para o próximo
        }
      }
      
      if (libraryFoldersContent) {
        // Extrair caminhos das bibliotecas
        const pathRegex = /"path"\s+"([^"]+)"/g;
        let match;
        
        while ((match = pathRegex.exec(libraryFoldersContent)) !== null) {
          libraries.push(match[1].replace(/\\\\/g, "\\"));
        }
        
        // Se não encontrar com o regex acima, tentar outro formato
        if (libraries.length === 1) {
          const altRegex = /"([0-9]+)"\s+{[^}]*?"path"\s+"([^"]+)"/g;
          while ((match = altRegex.exec(libraryFoldersContent)) !== null) {
            libraries.push(match[2].replace(/\\\\/g, "\\"));
          }
        }
      }
    } catch (error) {
      console.error("Error reading Steam library folders:", error);
    }
    
    console.log(`Found ${libraries.length} Steam libraries: ${libraries.join(", ")}`);
    
    // Escanear cada biblioteca por jogos
    const games: SteamGame[] = [];
    
    for (const library of libraries) {
      const appsDir = path.join(library, "steamapps");
      
      try {
        // Verificar se o diretório steamapps existe
        await fs.access(appsDir);
        
        // Ler o diretório em busca de arquivos de manifesto
        const files = await fs.readdir(appsDir);
        
        // Filtrar por arquivos de manifesto de jogos
        const manifestFiles = files.filter(file => file.startsWith("appmanifest_") && file.endsWith(".acf"));
        
        for (const manifestFile of manifestFiles) {
          try {
            const manifestPath = path.join(appsDir, manifestFile);
            const manifestContent = await fs.readFile(manifestPath, "utf8");
            
            // Extrair informações do manifesto
            const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
            const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
            const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);
            const sizeOnDiskMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(manifestContent);
            const lastPlayedMatch = /"LastPlayed"\s+"(\d+)"/.exec(manifestContent);
            
            if (appIdMatch && nameMatch && installDirMatch) {
              const appId = appIdMatch[1];
              const name = nameMatch[1];
              const installDir = installDirMatch[1];
              
              // Calcular tamanho em MB
              const sizeInBytes = sizeOnDiskMatch ? parseInt(sizeOnDiskMatch[1]) : 0;
              const sizeInMB = Math.round(sizeInBytes / (1024 * 1024));
              
              // Data da última vez jogado
              const lastPlayed = lastPlayedMatch ? new Date(parseInt(lastPlayedMatch[1]) * 1000) : undefined;
              
              // Caminho de instalação do jogo
              const installPath = path.join(appsDir, "common", installDir);
              
              // Encontrar o executável principal
              let executablePath = "";
              let processName = "";
              
              try {
                const gameFiles = await fs.readdir(installPath);
                const exeFiles = gameFiles.filter(file => file.toLowerCase().endsWith(".exe"));
                
                if (exeFiles.length > 0) {
                  // Preferir executável com o mesmo nome que o diretório de instalação
                  const mainExe = exeFiles.find(file => 
                    file.toLowerCase() === `${installDir.toLowerCase()}.exe`
                  ) || exeFiles[0];
                  
                  executablePath = path.join(installPath, mainExe);
                  processName = mainExe;
                }
              } catch (error) {
                console.log(`Could not scan executables for ${name}: ${error}`);
              }
              
              // URL do ícone do Steam para o jogo
              const iconUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
              
              games.push({
                id: appId,
                name,
                platform: "Steam",
                installPath,
                executablePath,
                process_name: processName,
                size: sizeInMB,
                icon_url: iconUrl,
                last_played: lastPlayed
              });
              
              console.log(`Found Steam game: ${name} (${appId})`);
            }
          } catch (error) {
            console.error(`Error processing Steam manifest ${manifestFile}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error reading Steam apps directory ${appsDir}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Steam games:", error);
    return [];
  }
}

export default getSteamGames;