// scripts/simpleTDD.js - GamePath AI TDD (JavaScript puro)
import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

console.log('🧪 GAMEPATHAI v3.0 - TDD SYSTEM');
console.log('================================');

class GamePathTDD {
  constructor() {
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      magenta: '\x1b[35m',
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
  debug(msg) { this.log('cyan', `🔍 ${msg}`); }
  special(msg) { this.log('magenta', `🎯 ${msg}`); }

  // ===================================================
  // TESTE DO MAIN.CJS
  // ===================================================
  
  async testMainCJS() {
    this.info('Testing main.cjs backend system...');
    
    try {
      const mainPath = path.join(process.cwd(), 'electron', 'main.cjs');
      
      try {
        await fs.access(mainPath);
        this.success('main.cjs found');
      } catch {
        this.error('main.cjs not found');
        return false;
      }

      const content = await fs.readFile(mainPath, 'utf8');
      
      const checks = [
        { name: 'AdvancedGameDetector', found: content.includes('AdvancedGameDetector') },
        { name: 'UltraXboxDetector', found: content.includes('UltraXboxDetector') },
        { name: 'SuperIntelligentGameFilter', found: content.includes('SuperIntelligentGameFilter') },
        { name: 'UltraGameLauncher', found: content.includes('UltraGameLauncher') },
        { name: 'IPC Handlers', found: content.includes('scan-games-intelligent') },
        { name: 'Tray System', found: content.includes('updateTrayMenu') }
      ];

      let passed = 0;
      checks.forEach(check => {
        if (check.found) {
          this.success(`  ${check.name}: OK`);
          passed++;
        } else {
          this.error(`  ${check.name}: Missing`);
        }
      });

      const success = passed >= 4;
      
      if (success) {
        this.success(`main.cjs health: ${passed}/${checks.length} components found`);
      } else {
        this.error(`main.cjs health failed: ${passed}/${checks.length} components`);
      }

      return success;
      
    } catch (error) {
      this.error(`main.cjs test failed: ${error.message}`);
      return false;
    }
  }

  // ===================================================
  // TESTE DO PRELOAD.CJS
  // ===================================================
  
  async testPreloadCJS() {
    this.info('Testing preload.cjs bridge system...');
    
    try {
      const preloadPath = path.join(process.cwd(), 'electron', 'preload.cjs');
      
      try {
        await fs.access(preloadPath);
        this.success('preload.cjs found');
      } catch {
        this.error('preload.cjs not found');
        return false;
      }

      const content = await fs.readFile(preloadPath, 'utf8');
      
      const checks = [
        { name: 'contextBridge', found: content.includes('contextBridge') },
        { name: 'electronAPI', found: content.includes('window.electronAPI') },
        { name: 'Games API', found: content.includes('games:') },
        { name: 'Launcher API', found: content.includes('launcher:') },
        { name: 'Events API', found: content.includes('events:') }
      ];

      let passed = 0;
      checks.forEach(check => {
        if (check.found) {
          this.success(`  ${check.name}: OK`);
          passed++;
        } else {
          this.error(`  ${check.name}: Missing`);
        }
      });

      const success = passed >= 4;
      
      if (success) {
        this.success(`preload.cjs health: ${passed}/${checks.length} APIs found`);
      } else {
        this.error(`preload.cjs health failed: ${passed}/${checks.length} APIs`);
      }

      return success;
      
    } catch (error) {
      this.error(`preload.cjs test failed: ${error.message}`);
      return false;
    }
  }

  // ===================================================
  // TESTE DE DETECTOR
  // ===================================================
  
  async testDetector(name, fileName) {
    this.info(`Testing ${name} detector...`);
    
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'electron', 'src', 'lib', 'gameDetection', 'platforms', `${fileName}.ts`),
        path.join(process.cwd(), 'electron', 'src', 'lib', 'gameDetection', 'platforms', `${fileName}.js`),
        path.join(process.cwd(), 'src', 'lib', 'gameDetection', 'platforms', `${fileName}.ts`),
        path.join(process.cwd(), 'src', 'lib', 'gameDetection', 'platforms', `${fileName}.js`)
      ];

      let filePath = null;
      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          filePath = testPath;
          break;
        } catch {
          continue;
        }
      }

      if (!filePath) {
        this.warn(`${name} detector not found`);
        return {
          platform: name,
          status: 'FILE_NOT_FOUND',
          games: 0,
          error: 'Detector file missing'
        };
      }

      this.debug(`Found: ${path.basename(filePath)}`);

      const startTime = Date.now();
      
      try {
        const fileUrl = pathToFileURL(filePath).href;
        const module = await import(fileUrl);
        
        const detectFunction = module[fileName] || 
                              module[`get${name.replace(/\s+/g, '')}Games`] ||
                              module.default ||
                              module[Object.keys(module)[0]];
        
        if (!detectFunction || typeof detectFunction !== 'function') {
          throw new Error(`No detection function found`);
        }

        this.debug(`Executing ${name} detector...`);
        const games = await detectFunction();
        const duration = Date.now() - startTime;
        
        if (!Array.isArray(games)) {
          throw new Error(`Expected array, got ${typeof games}`);
        }

        const gameCount = games.length;
        const sampleGames = games.slice(0, 3).map((game) => 
          game.cleanName || game.name || game.title || 'Unknown Game'
        );

        if (gameCount > 0) {
          this.success(`${name}: ${gameCount} games (${duration}ms)`);
          
          sampleGames.forEach((gameName, index) => {
            const game = games[index];
            const platform = game.platform || name;
            const icon = game.familyIcon || game.platformInfo?.icon || '🎮';
            console.log(`   ${icon} ${gameName} (${platform})`);
          });
          
          if (gameCount > 3) {
            console.log(`   ... and ${gameCount - 3} more games`);
          }

          // Xbox CoD check
          if (name === 'Xbox') {
            const codGames = games.filter((g) => 
              g.gameFamily === 'Call of Duty' || 
              g.name.toLowerCase().includes('call of duty')
            );
            
            if (codGames.length > 0) {
              this.special(`🔫 Call of Duty found: ${codGames.length}`);
            }
          }

          return {
            platform: name,
            status: 'SUCCESS',
            games: gameCount,
            duration,
            sampleGames
          };
        } else {
          this.warn(`${name}: Works but no games (${duration}ms)`);
          return {
            platform: name,
            status: 'NO_GAMES',
            games: 0,
            duration
          };
        }

      } catch (importError) {
        if (importError.message.includes('require is not defined')) {
          this.error(`${name}: Uses CommonJS in ES module`);
          this.info(`💡 Fix: Convert require() to import`);
        }
        
        throw new Error(`Module error: ${importError.message}`);
      }

    } catch (error) {
      this.error(`${name}: ${error.message}`);
      
      return {
        platform: name,
        status: 'ERROR',
        games: 0,
        error: error.message
      };
    }
  }

  // ===================================================
  // TODOS OS TESTES
  // ===================================================
  
  async runAllTests() {
    const detectors = [
      { name: 'Xbox', file: 'getXboxGames' },
      { name: 'Steam', file: 'getSteamGames' },
      { name: 'Epic Games', file: 'getEpicGames' },
      { name: 'Battle.net', file: 'getBattleNetGames' },
      { name: 'Origin', file: 'getOriginGames' },
      { name: 'GOG', file: 'getGOGGames' },
      { name: 'Uplay', file: 'getUplayGames' }
    ];

    console.log(`🚀 Testing ${detectors.length} detectors...\n`);
    
    console.log('📋 SYSTEM HEALTH CHECK');
    console.log('======================');
    
    const mainOK = await this.testMainCJS();
    const preloadOK = await this.testPreloadCJS();
    
    if (!mainOK || !preloadOK) {
      this.error('Core system issues - fix these first!');
      return [];
    }
    
    console.log('\n🔍 DETECTOR TESTS');
    console.log('=================');
    
    const results = [];
    
    for (const detector of detectors) {
      const result = await this.testDetector(detector.name, detector.file);
      results.push(result);
      console.log('');
    }

    this.showSummary(results);
    return results;
  }

  // ===================================================
  // TESTE XBOX APENAS
  // ===================================================
  
  async testXboxOnly() {
    console.log('🎯 XBOX DEEP DIVE');
    console.log('==================\n');
    
    this.info('System health check...');
    const mainOK = await this.testMainCJS();
    const preloadOK = await this.testPreloadCJS();
    
    if (!mainOK || !preloadOK) {
      this.error('System health failed');
      return { platform: 'Xbox', status: 'ERROR', games: 0, error: 'Core system issues' };
    }
    
    console.log('');
    
    const result = await this.testDetector('Xbox', 'getXboxGames');
    
    console.log('\n🎯 XBOX ANALYSIS');
    console.log('================');
    
    if (result.status === 'SUCCESS') {
      this.success(`🎉 XBOX WORKS! Found ${result.games} games!`);
      
      if (result.sampleGames && result.sampleGames.length > 0) {
        console.log('\n🎮 Xbox games:');
        result.sampleGames.forEach(game => console.log(`   🎮 ${game}`));
      }
      
    } else if (result.status === 'NO_GAMES') {
      this.warn('Xbox detector works but no games found');
      this.info('\n💡 Try:');
      this.info('   • Install Xbox App');
      this.info('   • Download free game from Microsoft Store');
      this.info('   • Run as administrator');
      
    } else if (result.status === 'FILE_NOT_FOUND') {
      this.error('Xbox detector file missing');
      this.info('\n💡 Create: getXboxGames.ts in platforms/');
      
    } else {
      this.error('Xbox detector has issues');
      this.info(`\n💡 Error: ${result.error}`);
    }
    
    return result;
  }

  // ===================================================
  // RESUMO
  // ===================================================
  
  showSummary(results) {
    console.log('📊 SUMMARY');
    console.log('==========');
    
    const successful = results.filter(r => r.status === 'SUCCESS');
    const noGames = results.filter(r => r.status === 'NO_GAMES');
    const fileNotFound = results.filter(r => r.status === 'FILE_NOT_FOUND');
    const errors = results.filter(r => r.status === 'ERROR');
    
    this.info(`Total tested: ${results.length}`);
    console.log(`✅ Working with games: ${successful.length}`);
    console.log(`⚠️  Working no games: ${noGames.length}`);
    console.log(`📁 Files missing: ${fileNotFound.length}`);
    console.log(`❌ With errors: ${errors.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ WORKING:');
      successful.forEach(r => {
        console.log(`   🎮 ${r.platform}: ${r.games} games`);
      });
    }
    
    if (fileNotFound.length > 0) {
      console.log('\n📁 MISSING:');
      fileNotFound.forEach(r => {
        console.log(`   📁 ${r.platform}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(r => {
        console.log(`   ⚠️  ${r.platform}`);
      });
    }

    const totalGames = successful.reduce((sum, r) => sum + r.games, 0);
    this.special(`\n🎮 TOTAL GAMES: ${totalGames}`);
    
    console.log('\n🚀 NEXT STEPS:');
    if (totalGames > 0) {
      console.log('✅ Run: npm run electron:dev');
    } else {
      console.log('🔧 Fix detector files first');
    }
  }
}

// ===================================================
// MAIN
// ===================================================

async function main() {
  const tdd = new GamePathTDD();
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--xbox') || args.includes('-x')) {
      await tdd.testXboxOnly();
    } else if (args.includes('--system') || args.includes('-s')) {
      console.log('🔧 SYSTEM CHECK ONLY\n');
      await tdd.testMainCJS();
      await tdd.testPreloadCJS();
    } else {
      await tdd.runAllTests();
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

main();