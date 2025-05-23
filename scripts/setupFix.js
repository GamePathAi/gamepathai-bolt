// scripts/setupFix.js
// Script compatível com ES Modules + TypeScript

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 GAMEPATHAI - SETUP FIX (ES + TS)');
console.log('==================================');

class SetupFixer {
  constructor() {
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
    };
  }

  log(color, message) {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  success(msg) { this.log('green', `✅ ${msg}`); }
  error(msg) { this.log('red', `❌ ${msg}`); }
  warn(msg) { this.log('yellow', `⚠️  ${msg}`); }
  info(msg) { this.log('blue', `ℹ️  ${msg}`); }

  // ===================================================
  // CORRIGIR PROBLEMA DE CACHE (do log que você mostrou)
  // ===================================================
  
  async fixCacheDirectory() {
    this.info('Corrigindo diretório de cache (.gamepath-ai)...');
    
    const baseDir = path.join(os.homedir(), '.gamepath-ai');
    const cacheDir = path.join(baseDir, 'cache');
    const logsDir = path.join(baseDir, 'logs');
    
    try {
      // Criar diretórios
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.mkdir(logsDir, { recursive: true });
      
      // Criar arquivo de cache vazio
      const cacheFile = path.join(cacheDir, 'games-cache.json');
      await fs.writeFile(cacheFile, '{}');
      
      this.success(`Cache directory: ${cacheDir}`);
      this.success(`Logs directory: ${logsDir}`);
      this.success('Cache file initialized');
      
      return true;
    } catch (error) {
      this.error(`Cache fix failed: ${error.message}`);
      return false;
    }
  }

  // ===================================================
  // MATAR PROCESSOS ELECTRON (problema de instância única)
  // ===================================================
  
  async killElectronProcesses() {
    this.info('Checking for running Electron processes...');
    
    if (process.platform === 'win32') {
      return new Promise((resolve) => {
        const tasklist = spawn('tasklist', ['/FI', 'IMAGENAME eq electron.exe']);
        let output = '';
        
        tasklist.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        tasklist.on('close', () => {
          const electronProcesses = output.split('\n').filter(line => 
            line.includes('electron.exe')
          );
          
          if (electronProcesses.length > 0) {
            this.warn(`Found ${electronProcesses.length} Electron processes`);
            
            const taskkill = spawn('taskkill', ['/F', '/IM', 'electron.exe']);
            taskkill.on('close', (code) => {
              if (code === 0) {
                this.success('Electron processes killed');
              } else {
                this.warn('Some processes may still be running');
              }
              resolve(true);
            });
          } else {
            this.info('No Electron processes found');
            resolve(true);
          }
        });
      });
    } else {
      // Linux/Mac
      return new Promise((resolve) => {
        const pkill = spawn('pkill', ['-f', 'electron']);
        pkill.on('close', () => {
          this.info('Electron processes checked (Unix)');
          resolve(true);
        });
      });
    }
  }

  // ===================================================
  // CRIAR DETECTOR XBOX BÁSICO EM TYPESCRIPT
  // ===================================================
  
  async createXboxDetector() {
    this.info('Creating basic Xbox detector...');
    
    // Verificar se diretório existe
    const platformsDir = path.join('src', 'lib', 'gameDetection', 'platforms');
    
    try {
      await fs.mkdir(platformsDir, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }
    
    const xboxFile = path.join(platformsDir, 'getXboxGames.ts');
    
    // Verificar se já existe
    try {
      await fs.access(xboxFile);
      this.warn('Xbox detector already exists, skipping...');
      return true;
    } catch {
      // Arquivo não existe, vamos criar
    }

    const xboxCode = `// getXboxGames.ts
// Xbox Game Detection for GamePath AI

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface GameInfo {
  id: string;
  name: string;
  platform: string;
  installPath?: string;
  executablePath?: string;
  size?: number;
  last_played?: Date;
  icon_url?: string;
}

export async function getXboxGames(): Promise<GameInfo[]> {
  console.log('🎮 Detecting Xbox/Microsoft Store games...');
  
  if (process.platform !== 'win32') {
    console.log('⚠️  Xbox games only available on Windows');
    return [];
  }
  
  const games: GameInfo[] = [];
  
  try {
    // Method 1: Check Packages folder
    const packagesPath = path.join(os.homedir(), 'AppData', 'Local', 'Packages');
    
    if (await fileExists(packagesPath)) {
      const packages = await fs.readdir(packagesPath);
      console.log(\`📁 Found \${packages.length} packages to scan\`);
      
      // Look for game-related packages
      const gamePackages = packages.filter(pkg => 
        pkg.includes('Game') || 
        pkg.includes('Minecraft') ||
        pkg.includes('Xbox') ||
        pkg.includes('Forza') ||
        pkg.includes('Halo') ||
        (pkg.startsWith('Microsoft.') && 
         !pkg.includes('Store') && 
         !pkg.includes('Photos') && 
         !pkg.includes('Mail') &&
         !pkg.includes('Calculator'))
      );
      
      console.log(\`🎯 Found \${gamePackages.length} potential game packages\`);
      
      for (const packageName of gamePackages.slice(0, 20)) {
        try {
          const packagePath = path.join(packagesPath, packageName);
          const stats = await fs.stat(packagePath);
          
          if (stats.isDirectory()) {
            const game = await parseXboxPackage(packageName, packagePath);
            if (game) {
              games.push(game);
              console.log(\`   ✅ \${game.name}\`);
            }
          }
        } catch (error) {
          // Skip packages with access errors
        }
      }
    }
    
    console.log(\`🎮 Xbox detection complete: \${games.length} games found\`);
    return games;
    
  } catch (error) {
    console.error('❌ Xbox detection error:', error.message);
    return [];
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function parseXboxPackage(packageName: string, packagePath: string): Promise<GameInfo | null> {
  try {
    // Extract game name from package name
    let gameName = packageName;
    
    // Remove common prefixes
    if (gameName.startsWith('Microsoft.')) {
      gameName = gameName.substring(10);
    }
    
    // Remove version suffixes
    gameName = gameName.split('_')[0];
    
    // Convert to readable name
    gameName = gameName.replace(/([A-Z])/g, ' $1').trim();
    
    // Filter out system apps
    const systemKeywords = ['Runtime', 'VCLibs', 'Framework', 'Desktop', 'NET'];
    if (systemKeywords.some(keyword => gameName.includes(keyword))) {
      return null;
    }
    
    if (gameName.length < 3) {
      return null;
    }
    
    // Try to get package size
    let packageSize = 0;
    try {
      const stats = await fs.stat(packagePath);
      packageSize = Math.round(stats.size / (1024 * 1024)); // MB
    } catch {
      // Ignore size calculation errors
    }
    
    return {
      id: \`xbox-\${packageName.substring(0, 20)}\`,
      name: gameName,
      platform: 'Xbox',
      installPath: packagePath,
      executablePath: undefined, // UWP apps don't have traditional .exe
      size: packageSize,
      last_played: undefined,
      icon_url: undefined
    };
    
  } catch (error) {
    return null;
  }
}

// Export default for compatibility
export default getXboxGames;
`;

    try {
      await fs.writeFile(xboxFile, xboxCode);
      this.success(`Xbox detector created: ${xboxFile}`);
      return true;
    } catch (error) {
      this.error(`Failed to create Xbox detector: ${error.message}`);
      return false;
    }
  }

  // ===================================================
  // CRIAR OUTROS DETECTORES BÁSICOS
  // ===================================================
  
  async createBasicDetectors() {
    this.info('Creating basic detectors for other platforms...');
    
    const detectorsToCreate = [
      {
        name: 'Epic Games',
        file: 'getEpicGames.ts',
        code: this.generateBasicDetectorCode('Epic Games', 'Epic Games', [
          'C:\\Program Files\\Epic Games',
          'C:\\Program Files (x86)\\Epic Games'
        ])
      },
      {
        name: 'Origin',
        file: 'getOriginGames.ts', 
        code: this.generateBasicDetectorCode('Origin', 'Origin', [
          'C:\\Program Files\\Origin Games',
          'C:\\Program Files (x86)\\Origin Games'
        ])
      },
      {
        name: 'Battle.net',
        file: 'getBattleNetGames.ts',
        code: this.generateBasicDetectorCode('Battle.net', 'Battle.net', [
          'C:\\Program Files (x86)\\Battle.net'
        ])
      }
    ];

    const platformsDir = path.join('src', 'lib', 'gameDetection', 'platforms');
    
    for (const detector of detectorsToCreate) {
      const filePath = path.join(platformsDir, detector.file);
      
      try {
        await fs.access(filePath);
        this.warn(`${detector.name} detector already exists, skipping...`);
      } catch {
        try {
          await fs.writeFile(filePath, detector.code);
          this.success(`${detector.name} detector created`);
        } catch (error) {
          this.error(`Failed to create ${detector.name} detector: ${error.message}`);
        }
      }
    }
  }

  generateBasicDetectorCode(platformName, platformId, searchPaths) {
    return `// get${platformName.replace(/[^a-zA-Z]/g, '')}Games.ts
// ${platformName} Game Detection

import { promises as fs } from 'fs';
import path from 'path';

export interface GameInfo {
  id: string;
  name: string;
  platform: string;
  installPath?: string;
  executablePath?: string;
  size?: number;
}

export async function get${platformName.replace(/[^a-zA-Z]/g, '')}Games(): Promise<GameInfo[]> {
  console.log('🎮 Detecting ${platformName} games...');
  
  const games: GameInfo[] = [];
  const searchDirs = ${JSON.stringify(searchPaths)};
  
  for (const searchDir of searchDirs) {
    try {
      if (await fileExists(searchDir)) {
        const items = await fs.readdir(searchDir);
        
        for (const item of items) {
          const itemPath = path.join(searchDir, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory() && item !== 'Launcher') {
            games.push({
              id: \`${platformId.toLowerCase()}-\${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`,
              name: item,
              platform: '${platformName}',
              installPath: itemPath,
              executablePath: await findExecutable(itemPath),
              size: 0
            });
          }
        }
      }
    } catch (error) {
      // Skip directories with access errors
    }
  }
  
  console.log(\`✅ ${platformName}: \${games.length} games found\`);
  return games;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findExecutable(dirPath: string): Promise<string | undefined> {
  try {
    const files = await fs.readdir(dirPath);
    const exeFile = files.find(file => 
      file.endsWith('.exe') && 
      !file.includes('unins') && 
      !file.includes('setup')
    );
    return exeFile ? path.join(dirPath, exeFile) : undefined;
  } catch {
    return undefined;
  }
}

export default get${platformName.replace(/[^a-zA-Z]/g, '')}Games;
`;
  }

  // ===================================================
  // EXECUTAR TODAS AS CORREÇÕES
  // ===================================================
  
  async runAllFixes() {
    console.log('🚀 Starting setup fixes...\n');
    
    let success = true;
    
    // 1. Kill Electron processes
    await this.killElectronProcesses();
    console.log('');
    
    // 2. Fix cache directories
    if (!await this.fixCacheDirectory()) {
      success = false;
    }
    console.log('');
    
    // 3. Create Xbox detector
    if (!await this.createXboxDetector()) {
      success = false;
    }
    console.log('');
    
    // 4. Create other basic detectors
    await this.createBasicDetectors();
    console.log('');
    
    // 5. Show final status
    console.log('📋 SETUP COMPLETE');
    console.log('=================');
    
    if (success) {
      this.success('All fixes applied successfully!');
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Test Xbox: npm run test:detectors');
      console.log('2. Or test specific: npx ts-node --esm scripts/testDetectors.ts');
      console.log('3. Run app: npm run electron:dev');
    } else {
      this.warn('Some fixes failed. Check logs above.');
    }
    
    return success;
  }
}

// ===================================================
// MAIN EXECUTION
// ===================================================

const fixer = new SetupFixer();
fixer.runAllFixes().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});