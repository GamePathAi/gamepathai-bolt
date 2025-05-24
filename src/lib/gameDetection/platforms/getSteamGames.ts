import * as fs from "fs/promises";
import * as path from "path-browserify";
import * as os from "os";
import { isLikelyGameExecutable, fileExists } from "../gameDetectionUtils";
import { isElectron } from "../isElectron";

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

// Steam game blacklist - these are not actual games but tools, redistributables, etc.
const STEAM_GAME_BLACKLIST = [
  'Steamworks Common Redistributables',
  'Steam Linux Runtime',
  'Proton',
  'Steam Controller Configs',
  'Steamworks Shared',
  'Steam Workshop Tools',
  'Dedicated Server',
  'SDK',
  'Server',
  'Demo',
  'Test',
  'Tool',
  'Redistributable',
  'Redist',
  'VR',
  'Runtime',
  'Common',
  'DirectX',
  'dotNET',
  'PhysX',
  'Visual C++',
  'Microsoft Visual C++',
  'Microsoft DirectX',
  'Microsoft .NET',
  'Microsoft XNA',
  'Microsoft Games for Windows',
  'Microsoft Games for Windows - LIVE',
  'Microsoft Games for Windows Marketplace',
  'Microsoft Games for Windows - LIVE Redistributable',
  'Microsoft Games for Windows - LIVE Client',
  'Microsoft Games for Windows - LIVE Redistributable'
];

// Maximum number of games to return per platform to prevent overwhelming the UI
const MAX_GAMES_PER_PLATFORM = 50;

/**
 * Checks if a Steam game should be included in the results
 */
function isSteamGameValid(name: string): boolean {
  // Check if the game is in the blacklist
  return !STEAM_GAME_BLACKLIST.some(blacklisted => 
    name.toLowerCase().includes(blacklisted.toLowerCase())
  );
}

/**
 * Busca jogos instalados no Steam
 */
export async function getSteamGames(): Promise<SteamGame[]> {
  try {
    // Check if we're in Electron environment
    if (!isElectron()) {
      console.log("Steam detection requires Electron environment");
      return [];
    }

    const { fs, registry, Registry } = window.electronAPI;
    const homedir = (await window.electronAPI.fs.getSystemPaths()).home;

    // Encontrar o diretório de instalação do Steam
    let steamPath = "";
    
    // No Windows, tentar pelo registro
    if (window.electronAPI.system.platform === "win32") {
      try {
        steamPath = await registry.getValue(
          Registry.HKEY.CURRENT_USER,
          "SOFTWARE\\Valve\\Steam",
          "SteamPath"
        );
        
        // Se não encontrar pelo CURRENT_USER, tentar LOCAL_MACHINE
        if (!steamPath) {
          steamPath = await registry.getValue(
            Registry.HKEY.LOCAL_MACHINE,
            "SOFTWARE\\WOW6432Node\\Valve\\Steam",
            "InstallPath"
          );
        }
      } catch (error) {
        console.error("Error reading Steam path from registry:", error);
      }
    }
    
    // Caminhos padrão para diferentes plataformas
    if (!steamPath) {
      const defaultPaths: Record<string, string[]> = {
        win32: [
          "C:\\Program Files (x86)\\Steam",
          "C:\\Program Files\\Steam",
        ],
        darwin: [
          path.join(homedir, "Library/Application Support/Steam"),
        ],
        linux: [
          path.join(homedir, ".steam/steam"),
          path.join(homedir, ".local/share/Steam"),
        ],
      };
      
      const platformPaths = defaultPaths[window.electronAPI.system.platform as keyof typeof defaultPaths] || [];
      
      // Verificar cada caminho padrão
      for (const defaultPath of platformPaths) {
        if (await fs.exists(defaultPath)) {
          steamPath = defaultPath;
          break;
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
          if (await fs.exists(libPath)) {
            libraryFoldersContent = await fs.readFile(libPath);
            break;
          }
        } catch {
          // Arquivo não existe, continuar para o próximo
        }
      }
      
      if (libraryFoldersContent) {
        // Extrair caminhos das bibliotecas
        const pathRegex = /"path"\s+"([^"]+)"/g;
        const matches = Array.from(libraryFoldersContent.matchAll(pathRegex));
        
        for (const match of matches) {
          libraries.push(match[1].replace(/\\\\/g, "\\"));
        }
        
        // Se não encontrar com o regex acima, tentar outro formato
        if (libraries.length === 1) {
          const altRegex = /"([0-9]+)"\s+{[^}]*?"path"\s+"([^"]+)"/g;
          const altMatches = Array.from(libraryFoldersContent.matchAll(altRegex));
          
          for (const match of altMatches) {
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
        if (await fs.exists(appsDir)) {
          // Ler o diretório em busca de arquivos de manifesto
          const files = await fs.readDir(appsDir);
          
          // Filtrar por arquivos de manifesto de jogos
          const manifestFiles = files.filter(file => 
            file.name.startsWith("appmanifest_") && file.name.endsWith(".acf")
          );
          
          for (const manifestFile of manifestFiles) {
            try {
              const manifestPath = manifestFile.path;
              const manifestContent = await fs.readFile(manifestPath);
              
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
                
                // Skip blacklisted games
                if (!isSteamGameValid(name)) {
                  console.log(`Skipping blacklisted Steam item: ${name}`);
                  continue;
                }
                
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
                
                if (await fs.exists(installPath)) {
                  try {
                    const gameFiles = await fs.readDir(installPath);
                    const exeFiles = gameFiles.filter(file => file.name.toLowerCase().endsWith(".exe"));
                    
                    if (exeFiles.length > 0) {
                      // Preferir executável com o mesmo nome que o diretório de instalação
                      const mainExe = exeFiles.find(file => 
                        file.name.toLowerCase() === `${installDir.toLowerCase()}.exe`
                      ) || exeFiles[0];
                      
                      executablePath = mainExe.path;
                      processName = mainExe.name;
                    }
                  } catch (error) {
                    console.log(`Could not scan executables for ${name}: ${error}`);
                  }
                }
                
                // URL do ícone do Steam para o jogo
                const iconUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
                
                games.push({
                  id: `steam-${appId}`,
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
                
                // Limit the number of games to prevent overwhelming the UI
                if (games.length >= MAX_GAMES_PER_PLATFORM) {
                  console.log(`Reached maximum number of Steam games (${MAX_GAMES_PER_PLATFORM}), stopping scan`);
                  break;
                }
              }
            } catch (error) {
              console.error(`Error processing Steam manifest ${manifestFile.name}:`, error);
            }
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