const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { Registry } = require('registry-js');

/**
 * Busca jogos instalados no Ubisoft Connect (antigo Uplay)
 */
async function getUplayGames() {
  try {
    // Verificar se estamos no Windows
    if (process.platform !== "win32") {
      console.log("Ubisoft Connect scanning is only supported on Windows");
      return [];
    }
    
    // Encontrar o diretório de instalação do Ubisoft Connect
    let uplayPath = "";
    
    // Tentar encontrar pelo registro
    try {
      uplayPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher",
        "InstallDir"
      );
      
      if (!uplayPath) {
        uplayPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\Ubisoft\\Launcher",
          "InstallDir"
        );
      }
    } catch (error) {
      console.warn("Could not read Ubisoft Connect path from registry:", error);
    }
    
    // Caminhos padrão
    const defaultPaths = [
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher",
      "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher",
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect",
      "C:\\Program Files\\Ubisoft\\Ubisoft Connect"
    ];
    
    if (!uplayPath) {
      for (const defaultPath of defaultPaths) {
        try {
          await fs.access(defaultPath);
          uplayPath = defaultPath;
          break;
        } catch {
          // Caminho não existe, continuar para o próximo
        }
      }
    }
    
    if (!uplayPath) {
      console.log("Ubisoft Connect installation not found");
      return [];
    }
    
    console.log(`Ubisoft Connect installation found at: ${uplayPath}`);
    
    // Possíveis locais de jogos
    const gamePaths = [
      path.join(uplayPath, "games"),
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
      "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games",
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect\\games",
      "C:\\Program Files\\Ubisoft\\Ubisoft Connect\\games"
    ];
    
    // Tentar encontrar caminhos adicionais pelo registro
    try {
      const installsPath = Registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher",
        "InstallsPath"
      );
      
      if (installsPath && !gamePaths.includes(installsPath)) {
        gamePaths.push(installsPath);
      }
    } catch (error) {
      console.warn("Could not read Ubisoft installs path from registry:", error);
    }
    
    const games = [];
    
    // Escanear cada caminho possível
    for (const gamePath of gamePaths) {
      try {
        await fs.access(gamePath);
        console.log(`Scanning Ubisoft Connect games in: ${gamePath}`);
        
        const entries = await fs.readdir(gamePath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const gameDir = path.join(gamePath, entry.name);
            
            // Procurar pelo executável
            let executablePath = "";
            let processName = "";
            
            try {
              // Procurar recursivamente por executáveis
              const findExecutables = async (dir, depth = 0) => {
                if (depth > 2) return []; // Limitar profundidade da busca
                
                const files = await fs.readdir(dir, { withFileTypes: true });
                let executables = [];
                
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
                !exe.toLowerCase().includes('upc') &&
                !exe.toLowerCase().includes('uplay') &&
                !exe.toLowerCase().includes('ubisoft') &&
                !exe.toLowerCase().includes('launcher') &&
                !exe.toLowerCase().includes('setup') &&
                !exe.toLowerCase().includes('unins')
              );
              
              if (gameExecutables.length > 0) {
                executablePath = gameExecutables[0];
                processName = path.basename(executablePath);
              }
            } catch (error) {
              console.warn(`Could not scan executables for Ubisoft game ${entry.name}:`, error);
            }
            
            // Calcular tamanho
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gameDir);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for Ubisoft game ${entry.name}:`, error);
            }
            
            if (executablePath) {
              // Formatar nome do jogo
              const gameName = entry.name
                .replace(/([A-Z])/g, ' $1') // Adicionar espaços antes de letras maiúsculas
                .replace(/_/g, ' ') // Substituir underscores por espaços
                .trim();
              
              games.push({
                id: `uplay-${Buffer.from(gameDir).toString('base64')}`,
                name: gameName,
                platform: "Ubisoft Connect",
                installPath: gameDir,
                executablePath,
                process_name: processName,
                size: sizeInMB,
                icon_url: undefined
              });
              
              console.log(`Found Ubisoft Connect game: ${gameName}`);
            }
          }
        }
      } catch (error) {
        console.warn(`Could not access Ubisoft Connect games path ${gamePath}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Ubisoft Connect games:", error);
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

module.exports = { getUplayGames };