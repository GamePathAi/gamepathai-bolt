// scripts/simpleTDD.ts
// Sistema TDD simples compatível com seu setup

import { promises as fs } from 'fs';
import path from 'path';

console.log('🧪 GAMEPATHAI - TDD SIMPLES');
console.log('===========================');

interface TestResult {
  platform: string;
  status: 'SUCCESS' | 'NO_GAMES' | 'ERROR' | 'FILE_NOT_FOUND';
  games: number;
  duration?: number;
  error?: string;
  sampleGames?: string[];
}

class SimpleTDD {
  private colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };

  private log(color: keyof typeof this.colors, message: string) {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  private success(msg: string) { this.log('green', `✅ ${msg}`); }
  private error(msg: string) { this.log('red', `❌ ${msg}`); }
  private warn(msg: string) { this.log('yellow', `⚠️  ${msg}`); }
  private info(msg: string) { this.log('blue', `ℹ️  ${msg}`); }

  // ===================================================
  // TESTE INDIVIDUAL DE DETECTOR
  // ===================================================
  
  async testDetector(name: string, fileName: string): Promise<TestResult> {
    this.info(`Testing ${name}...`);
    
    try {
      // Verificar se arquivo existe
      const filePath = path.join('src', 'lib', 'gameDetection', 'platforms', `${fileName}.ts`);
      
      try {
        await fs.access(filePath);
      } catch {
        this.warn(`File not found: ${fileName}.ts`);
        return {
          platform: name,
          status: 'FILE_NOT_FOUND',
          games: 0,
          error: 'Detector file does not exist'
        };
      }

      // Tentar importar e executar
      const startTime = Date.now();
      
      try {
        const module = await import(`../src/lib/gameDetection/platforms/${fileName}.ts`);
        const detectFunction = module[fileName] || module.default;
        
        if (!detectFunction) {
          throw new Error(`Function ${fileName} not found in module`);
        }

        const games = await detectFunction();
        const duration = Date.now() - startTime;
        
        if (!Array.isArray(games)) {
          throw new Error(`Expected array, got ${typeof games}`);
        }

        const gameCount = games.length;
        const sampleGames = games.slice(0, 3).map((game: any) => 
          game.name || game.title || 'Unknown Game'
        );

        if (gameCount > 0) {
          this.success(`${name}: ${gameCount} games found (${duration}ms)`);
          sampleGames.forEach((gameName, index) => {
            console.log(`   ${index + 1}. ${gameName}`);
          });
          
          if (gameCount > 3) {
            console.log(`   ... and ${gameCount - 3} more games`);
          }

          return {
            platform: name,
            status: 'SUCCESS',
            games: gameCount,
            duration,
            sampleGames
          };
        } else {
          this.warn(`${name}: Detector works, but no games found (${duration}ms)`);
          return {
            platform: name,
            status: 'NO_GAMES',
            games: 0,
            duration
          };
        }

      } catch (importError: any) {
        throw new Error(`Import/execution error: ${importError.message}`);
      }

    } catch (error: any) {
      this.error(`${name}: ${error.message}`);
      
      // Provide specific hints
      if (error.message.includes('Cannot find module')) {
        this.info(`💡 Hint: File ${fileName}.ts may need to be created`);
      } else if (error.message.includes('Function') && error.message.includes('not found')) {
        this.info(`💡 Hint: Check export of function ${fileName}`);
      }
      
      return {
        platform: name,
        status: 'ERROR',
        games: 0,
        error: error.message
      };
    }
  }

  // ===================================================
  // EXECUTAR TODOS OS TESTES
  // ===================================================
  
  async runAllTests(): Promise<TestResult[]> {
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
    
    const results: TestResult[] = [];
    
    for (const detector of detectors) {
      const result = await this.testDetector(detector.name, detector.file);
      results.push(result);
      console.log(''); // blank line
    }

    this.showSummary(results);
    return results;
  }

  // ===================================================
  // TESTE APENAS XBOX
  // ===================================================
  
  async testXboxOnly(): Promise<TestResult> {
    console.log('🎯 TESTING XBOX ONLY');
    console.log('====================\n');
    
    const result = await this.testDetector('Xbox', 'getXboxGames');
    
    console.log('\n🎯 XBOX ANALYSIS:');
    console.log('=================');
    
    if (result.status === 'SUCCESS') {
      this.success(`XBOX PROBLEM SOLVED! Found ${result.games} games!`);
      if (result.sampleGames && result.sampleGames.length > 0) {
        console.log('🎮 Sample Xbox games:');
        result.sampleGames.forEach(game => console.log(`   • ${game}`));
      }
    } else if (result.status === 'NO_GAMES') {
      this.warn('Xbox detector works but no games found');
      this.info('💡 Possible reasons:');
      this.info('   - No Xbox/UWP games installed');
      this.info('   - Games in protected directories');
      this.info('   - Need administrator permissions');
    } else if (result.status === 'FILE_NOT_FOUND') {
      this.error('Xbox detector file missing');
      this.info('💡 Next step: Run setup script first');
      this.info('   node scripts/setupFix.js');
    } else {
      this.error('Xbox detector has technical issues');
      this.info(`💡 Error: ${result.error}`);
    }
    
    return result;
  }

  // ===================================================
  // MOSTRAR RESUMO
  // ===================================================
  
  private showSummary(results: TestResult[]) {
    console.log('📊 FINAL SUMMARY');
    console.log('================');
    
    const successful = results.filter(r => r.status === 'SUCCESS');
    const noGames = results.filter(r => r.status === 'NO_GAMES');
    const fileNotFound = results.filter(r => r.status === 'FILE_NOT_FOUND');
    const errors = results.filter(r => r.status === 'ERROR');
    
    this.info(`Total tested: ${results.length} detectors`);
    this.success(`Working with games: ${successful.length}`);
    this.warn(`Working without games: ${noGames.length}`);
    this.error(`Files missing: ${fileNotFound.length}`);
    this.error(`With errors: ${errors.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ WORKING DETECTORS:');
      successful.forEach(r => {
        console.log(`   • ${r.platform}: ${r.games} games`);
      });
    }
    
    if (fileNotFound.length > 0) {
      console.log('\n📝 MISSING FILES:');
      fileNotFound.forEach(r => {
        console.log(`   • ${r.platform}: detector file not created yet`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(r => {
        console.log(`   • ${r.platform}: ${r.error?.substring(0, 50)}...`);
      });
    }

    const totalGames = successful.reduce((sum, r) => sum + r.games, 0);
    console.log(`\n🎮 TOTAL GAMES FOUND: ${totalGames}`);
    
    // Next steps
    console.log('\n🚀 NEXT STEPS:');
    if (fileNotFound.length > 0) {
      console.log('1. Run setup: node scripts/setupFix.js');
      console.log('2. Test again: npx ts-node --esm scripts/simpleTDD.ts');
    } else if (successful.length > 0) {
      console.log('1. Great! Some detectors working');
      console.log('2. Run full app: npm run electron:dev');
    } else {
      console.log('1. Check setup and file permissions');
      console.log('2. Try: npm run test:detectors');
    }
  }
}

// ===================================================
// MAIN EXECUTION
// ===================================================

async function main() {
  const tdd = new SimpleTDD();
  const args = process.argv.slice(2);
  
  if (args.includes('--xbox') || args.includes('-x')) {
    await tdd.testXboxOnly();
  } else {
    await tdd.runAllTests();
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});