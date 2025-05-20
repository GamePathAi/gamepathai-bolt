const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { Registry } = require('registry-js');

/**
 * Busca jogos instalados via Xbox App/Microsoft Store
 */
async function getXboxGames() {
  try {
    // Verificar se estamos no Windows
    if (process.platform !== "win32") {
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
      const xboxPath = Registry.getValue(
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
    
    const games = [];
    
    // Escanear cada caminho possível
    for (const basePath of possiblePaths) {
      try {
        await fs.access(basePath);
        
        // Ler diretório
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const gamePath = path.join(basePath, entry.name);
            
            // Verificar se é um diretório de jogo do Xbox
            const isXboxGame = entry.name.startsWith("Microsoft.") || 
                              gamePath.includes("XboxGames") ||
                              await containsGameFiles(gamePath);
            
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
            
            // Tentar encontrar o executável principal
            let executablePath = "";
            let processName = "";
            
            try {
              const gameFiles = await findExecutablesRecursively(gamePath);
              
              // Filtrar para executáveis que parecem ser jogos
              const gameExecutables = gameFiles.filter(file => 
                isLikelyGameExecutable(file) && 
                !file.toLowerCase().includes("setup") &&
                !file.toLowerCase().includes("unins") &&
                !file.toLowerCase().includes("crash") &&
                !file.toLowerCase().includes("launcher")
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
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for Xbox game ${gameName}:`, error);
            }
            
            // Adicionar jogo à lista
            if (executablePath) {
              games.push({
                id: entry.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
                name: gameName,
                platform: "Xbox",
                installPath: gamePath,
                executablePath,
                process_name: processName,
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
async function containsGameFiles(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    
    // Verificar extensões comuns de jogos
    const gameExtensions = [".exe", ".dll", ".pak", ".dat", ".bin", ".ini", ".cfg"];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
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
async function findExecutablesRecursively(dirPath, maxDepth = 3) {
  if (maxDepth <= 0) return [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let executables = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursivamente buscar em subdiretórios
        const subDirExecutables = await findExecutablesRecursively(fullPath, maxDepth - 1);
        executables = executables.concat(subDirExecutables);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".exe")) {
        executables.push(fullPath);
      }
    }
    
    return executables;
  } catch (error) {
    return [];
  }
}

/**
 * Determina se um executável é provavelmente um jogo
 */
function isLikelyGameExecutable(executablePath) {
  if (!executablePath) return false;
  
  const fileName = path.basename(executablePath).toLowerCase();
  
  // Lista de programas comuns que NÃO são jogos
  const nonGameExecutables = [
    'chrome.exe', 'firefox.exe', 'msedge.exe', 'explorer.exe', 'cmd.exe',
    'powershell.exe', 'notepad.exe', 'calc.exe', 'mspaint.exe', 'winword.exe',
    'excel.exe', 'outlook.exe', 'code.exe', 'devenv.exe', 'git.exe',
    'node.exe', 'npm.exe', 'python.exe', 'discord.exe', 'slack.exe',
    'teams.exe', 'zoom.exe', 'skype.exe', 'svchost.exe', 'rundll32.exe',
    'conhost.exe', 'setup.exe', 'installer.exe', 'uninstall.exe', 'update.exe'
  ];
  
  // Verificar se está na lista de não-jogos
  if (nonGameExecutables.includes(fileName)) {
    return false;
  }
  
  // Verificar padrões comuns de jogos
  const gamePatterns = [
    /game/i, /play/i, /launcher/i, /client/i, /engine/i,
    /steam/i, /epic/i, /origin/i, /galaxy/i, /uplay/i, /battle\.net/i,
    /rpg/i, /fps/i, /mmo/i, /moba/i, /rts/i, /racing/i, /sport/i
  ];
  
  // Verificar se corresponde a algum padrão de jogo
  return gamePatterns.some(pattern => pattern.test(fileName));
}

module.exports = { getXboxGames };