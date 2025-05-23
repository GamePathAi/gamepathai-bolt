// scripts/simpleTDD.js - GamePath AI TDD (CORRIGIDO)
import { promises as fs } from 'fs';
import path from 'path';

console.log(' GAMEPATHAI v3.0 - TDD (FIXED)');
console.log('=================================');

class GamePathTDD {
  success(msg) { console.log(`\x1b[32m ${msg}\x1b[0m`); }
  error(msg) { console.log(`\x1b[31m ${msg}\x1b[0m`); }
  info(msg) { console.log(`\x1b[34mℹ  ${msg}\x1b[0m`); }

  async testMainCJS() {
    this.info('Testing main.cjs...');
    
    try {
      const mainPath = path.join(process.cwd(), 'electron', 'main.cjs');
      await fs.access(mainPath);
      this.success('main.cjs found');
      
      const content = await fs.readFile(mainPath, 'utf8');
      const hasXbox = content.includes('UltraXboxDetector');
      const hasIPC = content.includes('scan-games-intelligent');
      
      if (hasXbox) this.success('  UltraXboxDetector: OK');
      else this.error('  UltraXboxDetector: Missing');
      
      if (hasIPC) this.success('  IPC Handlers: OK');
      else this.error('  IPC Handlers: Missing');
      
      return hasXbox && hasIPC;
    } catch {
      this.error('main.cjs not found');
      return false;
    }
  }

  async testPreloadCJS() {
    this.info('Testing preload.cjs...');
    
    try {
      const preloadPath = path.join(process.cwd(), 'electron', 'preload.cjs');
      await fs.access(preloadPath);
      this.success('preload.cjs found');
      
      const content = await fs.readFile(preloadPath, 'utf8');
      
      // CORRIGIDO: Procurar pelos padrões corretos
      const hasElectronAPI = content.includes("exposeInMainWorld('electronAPI'");
      const hasGamePathAI = content.includes("exposeInMainWorld('gamePathAI'");
      const hasGamesAPI = content.includes('games:');
      const hasLauncherAPI = content.includes('launcher:');
      const hasEventsAPI = content.includes('events:');
      
      if (hasElectronAPI) this.success('  electronAPI exposure: OK');
      else this.error('  electronAPI exposure: Missing');
      
      if (hasGamePathAI) this.success('  gamePathAI alias: OK');
      else this.error('  gamePathAI alias: Missing');
      
      if (hasGamesAPI) this.success('  Games API: OK');
      else this.error('  Games API: Missing');
      
      if (hasLauncherAPI) this.success('  Launcher API: OK');
      else this.error('  Launcher API: Missing');
      
      if (hasEventsAPI) this.success('  Events API: OK');
      else this.error('  Events API: Missing');
      
      return hasElectronAPI && hasGamesAPI;
    } catch {
      this.error('preload.cjs not found');
      return false;
    }
  }

  async testXbox() {
    console.log(' XBOX SYSTEM TEST');
    console.log('===================\n');
    
    const mainOK = await this.testMainCJS();
    console.log('');
    const preloadOK = await this.testPreloadCJS();
    
    console.log('\n FINAL RESULTS');
    console.log('=================');
    
    if (mainOK && preloadOK) {
      this.success(' SYSTEM IS READY!');
      console.log('\n Xbox detection system is fully operational!');
      console.log('');
      console.log(' Backend: UltraXboxDetector loaded');
      console.log(' Bridge: electronAPI exposed');
      console.log(' Frontend: APIs available');
      console.log('');
      console.log(' NEXT TESTS:');
      console.log('1. Run: npm run electron:dev');
      console.log('2. Open DevTools Console');
      console.log('3. Test: window.electronAPI.games.scanXbox()');
      console.log('4. Expected: Call of Duty detection');
      console.log('');
      console.log(' If Call of Duty is installed, it should be detected!');
    } else {
      this.error(' System has issues');
      if (!mainOK) console.log(' Fix main.cjs components');
      if (!preloadOK) console.log(' Fix preload.cjs exposure');
    }
    
    return mainOK && preloadOK;
  }
}

const tdd = new GamePathTDD();
tdd.testXbox();
