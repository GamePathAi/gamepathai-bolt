import * as fs from "fs/promises";
import * as path from "path-browserify";
import * as os from "os";
import { isLikelyGameExecutable, fileExists } from "../gameDetectionUtils";
import { isElectron } from "../isElectron";

interface XboxGame {
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
 * Busca jogos instalados via Xbox App/Microsoft Store
 */
export async function getXboxGames(): Promise<XboxGame[]> {
  try {
    // Check if we're in Electron environment
    if (!isElectron()) {
      console.log("Xbox detection requires Electron environment");
      return [];
    }

    const { fs, registry, Registry } = window.electronAPI;
    
    // Verificar se estamos no Windows
    if (window.electronAPI.system.platform !== "win32") {
      console.log("Xbox Games scanning is only supported on Windows");
      return [];
    }
    
    // Possíveis locais de instalação de jogos do Xbox
    const possiblePaths = [
      "C:\\XboxGames",
      "D:\\XboxGames", 
      "E:\\XboxGames",
      "C:\\Program Files\\WindowsApps",
      "C:\\Program Files\\ModifiableWindowsApps"
    ];
    
    // Tentar encontrar caminhos adicionais pelo registro
    try {
      const xboxPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\Microsoft\\GamingServices",
        "GameInstallPath"
      );
      
      if (xboxPath && !possiblePaths.includes(xboxPath)) {
        possiblePaths.push(xboxPath);
      }
    } catch (error) {
      console.warn("Could not read Xbox game path from registry:", error);
    }
    
    // Get environment variables for additional paths
    const envVars = await fs.getEnvVars();
    if (envVars.LOCALAPPDATA) {
      possiblePaths.push(path.join(envVars.LOCALAPPDATA, "Packages"));
    }
    
    if (envVars.PROGRAMFILES) {
      possiblePaths.push(path.join(envVars.PROGRAMFILES, "WindowsApps"));
    }
    
    if (envVars['PROGRAMFILES(X86)']) {
      possiblePaths.push(path.join(envVars['PROGRAMFILES(X86)'], "WindowsApps"));
    }
    
    const games: XboxGame[] = [];
    
    // Escanear cada caminho possível
    for (const basePath of possiblePaths) {
      try {
        if (await fs.exists(basePath)) {
          console.log(`Scanning Xbox games in: ${basePath}`);
          
          const entries = await fs.readDir(basePath);
          
          for (const entry of entries) {
            if (entry.isDirectory) {
              const gamePath = entry.path;
              
              // Verificar se é um diretório de jogo do Xbox
              const isXboxGame = entry.name.startsWith("Microsoft.") || 
                                gamePath.includes("XboxGames") ||
                                await containsGameFiles(fs, gamePath);
              
              if (!isXboxGame) {
                continue;
              }
              
              // Tentar encontrar o nome do jogo
              let gameName = entry.name;
              
              // Remover prefixos comuns da Microsoft
              if (gameName.startsWith("Microsoft.")) {
                gameName = gameName.replace(/^Microsoft\.[^_]+_[\d\.]+_[^_]+_[^\\]+\\?/, "");
                
                // Limpar ainda mais o nome
                gameName = gameName
                  .replace(/([a-z])([A-Z])/g, '$1 $2') // Adicionar espaços entre camelCase
                  .replace(/^[a-z]/, c => c.toUpperCase()); // Capitalizar primeira letra
              }
              
              // Special case for Call of Duty
              if (gameName.includes("CallofDuty") || gameName.includes("COD") || 
                  gameName.includes("ModernWarfare") || gameName.includes("Warzone")) {
                gameName = "Call of Duty";
              }
              
              // Tentar encontrar o executável principal
              let executablePath = "";
              let processName = "";
              
              try {
                const gameFiles = await findExecutablesRecursively(fs, gamePath);
                
                // Filtrar para executáveis que parecem ser jogos
                const gameExecutables = gameFiles.filter(file => 
                  isLikelyGameExecutable(file) && 
                  !path.basename(file).toLowerCase().includes("setup") &&
                  !path.basename(file).toLowerCase().includes("unins") &&
                  !path.basename(file).toLowerCase().includes("crash") &&
                  !path.basename(file).toLowerCase().includes("launcher")
                );
                
                if (gameExecutables.length > 0) {
                  executablePath = gameExecutables[0];
                  processName = path.basename(executablePath);
                } else if (gameFiles.length > 0) {
                  // Se não encontrar executáveis que parecem ser jogos, usar o primeiro executável
                  executablePath = gameFiles[0];
                  processName = path.basename(executablePath);
                }
              } catch (error) {
                console.warn(`Could not scan executables for Xbox game ${gameName}:`, error);
              }
              
              // Calcular tamanho do jogo
              let sizeInMB = 0;
              try {
                const stats = await fs.stat(gamePath);
                if (stats && stats.size) {
                  sizeInMB = Math.round(stats.size / (1024 * 1024));
                }
              } catch (error) {
                console.warn(`Could not determine size for Xbox game ${gameName}:`, error);
              }
              
              // Adicionar jogo à lista mesmo sem executável para Xbox (UWP apps)
              games.push({
                id: `xbox-${entry.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
                name: gameName,
                platform: "Xbox",
                installPath: gamePath,
                executablePath: executablePath || gamePath, // Use path as fallback
                process_name: processName || entry.name,
                size: sizeInMB,
                icon_url: undefined,
                last_played: undefined
              });
              
              console.log(`Found Xbox game: ${gameName}`);
            }
          }
        }
      } catch (error) {
        console.warn(`Could not access Xbox games path ${basePath}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Xbox games:", error);
    return [];
  }
}

/**
 * Verifica se um diretório contém arquivos de jogo
 */
async function containsGameFiles(fs: any, dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readDir(dirPath);
    
    // Verificar extensões comuns de jogos
    const gameExtensions = [".exe", ".dll", ".pak", ".dat", ".bin", ".ini", ".cfg"];
    
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (gameExtensions.includes(ext)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Encontra executáveis recursivamente em um diretório
 */
async function findExecutablesRecursively(fs: any, dirPath: string, maxDepth = 3): Promise<string[]> {
  if (maxDepth <= 0) return [];
  
  try {
    const entries = await fs.readDir(dirPath);
    let executables: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory) {
        // Recursivamente buscar em subdiretórios
        const subDirExecutables = await findExecutablesRecursively(fs, entry.path, maxDepth - 1);
        executables = executables.concat(subDirExecutables);
      } else if (entry.name.toLowerCase().endsWith(".exe")) {
        executables.push(entry.path);
      }
    }
    
    return executables;
  } catch (error) {
    return [];
  }
}

export default getXboxGames;