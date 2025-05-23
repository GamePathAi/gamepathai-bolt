// scripts/testDetectors.js
// Script principal de teste dos detectores - ES Modules

console.log('🔍 INICIANDO TESTE DOS DETECTORES DE JOGOS');
console.log('==========================================\n');

async function testDetectors() {
  const detectors = [
    { name: 'Xbox', file: 'getXboxGames' },
    { name: 'Steam', file: 'getSteamGames' },
    { name: 'Epic Games', file: 'getEpicGames' },
    { name: 'Battle.net', file: 'getBattleNetGames' },
    { name: 'Origin', file: 'getOriginGames' },
    { name: 'GOG', file: 'getGOGGames' },
    { name: 'Uplay', file: 'getUplayGames' }
  ];

  let totalGames = 0;
  const results = [];

  for (const detector of detectors) {
    console.log(`🧪 Testando ${detector.name}...`);
    
    try {
      // Tentar importar o módulo TypeScript
      const modulePath = `../src/lib/gameDetection/platforms/${detector.file}.ts`;
      console.log(`   📁 Carregando: ${detector.file}.ts`);
      
      const module = await import(modulePath);
      
      // Encontrar a função de detecção
      const detectFunction = module[detector.file] || module.default;
      
      if (!detectFunction) {
        console.log(`   ❌ Função não encontrada`);
        console.log(`   📋 Disponível:`, Object.keys(module));
        results.push({ 
          name: detector.name, 
          status: 'ERROR', 
          games: 0, 
          error: 'Função não encontrada' 
        });
        continue;
      }

      // Executar detecção
      console.log(`   ⚙️ Executando...`);
      const startTime = Date.now();
      
      const games = await Promise.race([
        detectFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout - detector demorou mais que 30s')), 30000)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      if (!Array.isArray(games)) {
        console.log(`   ❌ Retorno inválido: ${typeof games}`);
        results.push({ 
          name: detector.name, 
          status: 'ERROR', 
          games: 0, 
          error: 'Retorno não é array',
          duration 
        });
        continue;
      }

      const gameCount = games.length;
      totalGames += gameCount;

      if (gameCount > 0) {
        console.log(`   ✅ ${gameCount} jogos encontrados (${duration}ms)`);
        
        // Mostrar primeiros 3 jogos
        games.slice(0, 3).forEach(game => {
          const name = game.name || game.title || 'Nome indefinido';
          const gamePath = game.installPath || game.path || 'Caminho indefinido';
          const platform = game.platform || detector.name;
          console.log(`      🎮 ${name} (${platform})`);
          console.log(`         📂 ${gamePath.length > 60 ? gamePath.substring(0, 60) + '...' : gamePath}`);
        });
        
        if (gameCount > 3) {
          console.log(`      ... e mais ${gameCount - 3} jogos`);
        }
        
        results.push({ 
          name: detector.name, 
          status: 'SUCCESS', 
          games: gameCount,
          duration 
        });
      } else {
        console.log(`   ⚠️  Nenhum jogo encontrado (${duration}ms)`);
        results.push({ 
          name: detector.name, 
          status: 'NO_GAMES', 
          games: 0,
          duration 
        });
      }

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      
      // Dar dicas específicas baseadas no erro
      if (error.message.includes('Cannot find module')) {
        console.log(`   💡 Dica: Arquivo ${detector.file}.ts pode não existir`);
        console.log(`   📁 Verifique: src/lib/gameDetection/platforms/${detector.file}.ts`);
      } else if (error.message.includes('Unknown file extension')) {
        console.log(`   💡 Dica: Problema com configuração TypeScript`);
      } else if (error.message.includes('Timeout')) {
        console.log(`   💡 Dica: Detector muito lento - otimizar algoritmo`);
      } else if (error.message.includes('SyntaxError')) {
        console.log(`   💡 Dica: Erro de sintaxe no arquivo TypeScript`);
      }
      
      results.push({ 
        name: detector.name, 
        status: 'ERROR', 
        games: 0, 
        error: error.message 
      });
    }
    
    console.log(''); // Linha em branco
  }

  // Resumo final
  console.log('📊 RESUMO FINAL');
  console.log('===============');
  
  const successful = results.filter(r => r.status === 'SUCCESS');
  const noGames = results.filter(r => r.status === 'NO_GAMES');
  const errors = results.filter(r => r.status === 'ERROR');
  
  console.log(`✅ Funcionando com jogos: ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   - ${r.name}: ${r.games} jogos (${r.duration}ms)`));
  
  console.log(`⚠️  Funcionando sem jogos: ${noGames.length}/${results.length}`);
  noGames.forEach(r => console.log(`   - ${r.name}: detector OK, mas sem jogos instalados (${r.duration}ms)`));
  
  console.log(`❌ Com erros: ${errors.length}/${results.length}`);
  errors.forEach(r => console.log(`   - ${r.name}: ${r.error.substring(0, 80)}...`));
  
  console.log(`\n🎮 TOTAL DE JOGOS: ${totalGames}`);

  // Foco no Xbox (seu problema original)
  const xboxResult = results.find(r => r.name === 'Xbox');
  if (xboxResult) {
    console.log('\n🎯 ANÁLISE ESPECÍFICA DO XBOX:');
    console.log('==============================');
    
    if (xboxResult.status === 'SUCCESS') {
      console.log(`✅ XBOX RESOLVIDO! Encontrou ${xboxResult.games} jogos em ${xboxResult.duration}ms!`);
      console.log('🎉 Seu problema original foi solucionado!');
      console.log('\n🎮 PRÓXIMOS PASSOS PARA XBOX:');
      console.log('   1. Execute: npm run electron:dev');
      console.log('   2. Teste a detecção na interface do app');
      console.log('   3. Verifique se os jogos aparecem corretamente');
    } else if (xboxResult.status === 'NO_GAMES') {
      console.log(`⚠️  Xbox detector funciona, mas não encontrou jogos`);
      console.log(`   ⏱️  Tempo de execução: ${xboxResult.duration}ms`);
      console.log(`\n💡 POSSÍVEIS CAUSAS:`);
      console.log(`   - Nenhum jogo Xbox/UWP instalado`);
      console.log(`   - Jogos em diretórios protegidos (WindowsApps)`);
      console.log(`   - Necessário executar como administrador`);
      console.log(`   - Xbox App não instalado`);
      console.log(`\n🚀 SUGESTÕES PARA TESTAR:`);
      console.log(`   1. Instalar Minecraft da Microsoft Store`);
      console.log(`   2. Executar como administrador`);
      console.log(`   3. Verificar permissões do diretório WindowsApps`);
    } else {
      console.log(`❌ Xbox ainda com problema técnico`);
      console.log(`   🐛 Erro: ${xboxResult.error}`);
      console.log(`\n🔧 COMO RESOLVER:`);
      
      if (xboxResult.error.includes('Cannot find module')) {
        console.log(`   1. Verificar se arquivo existe: src/lib/gameDetection/platforms/getXboxGames.ts`);
        console.log(`   2. Se não existir, execute: node scripts/setupFix.js`);
      } else if (xboxResult.error.includes('Função não encontrada')) {
        console.log(`   1. Verificar export da função: export function getXboxGames()`);
        console.log(`   2. Ou export default: export default getXboxGames`);
      } else if (xboxResult.error.includes('SyntaxError')) {
        console.log(`   1. Verificar sintaxe TypeScript no arquivo`);
        console.log(`   2. Verificar imports e exports`);
      }
    }
  }

  // Estatísticas de performance
  const workingDetectors = results.filter(r => r.duration && r.duration > 0);
  if (workingDetectors.length > 0) {
    const avgDuration = workingDetectors.reduce((sum, r) => sum + r.duration, 0) / workingDetectors.length;
    
    console.log(`\n⚡ ANÁLISE DE PERFORMANCE:`);
    console.log(`   Tempo médio por detector: ${Math.round(avgDuration)}ms`);
    
    const fastDetectors = workingDetectors.filter(r => r.duration < avgDuration / 2);
    const slowDetectors = workingDetectors.filter(r => r.duration > avgDuration * 2);
    
    if (fastDetectors.length > 0) {
      console.log(`   🚀 Detectores rápidos (<${Math.round(avgDuration/2)}ms):`);
      fastDetectors.forEach(r => console.log(`      - ${r.name}: ${r.duration}ms`));
    }
    
    if (slowDetectors.length > 0) {
      console.log(`   🐌 Detectores lentos (>${Math.round(avgDuration*2)}ms):`);
      slowDetectors.forEach(r => {
        console.log(`      - ${r.name}: ${r.duration}ms`);
        console.log(`        💡 Sugestão: Otimizar algoritmo de detecção`);
      });
    }
  }

  // Health score do sistema
  const healthScore = Math.round(((successful.length + noGames.length) / results.length) * 100);
  console.log(`\n💯 SYSTEM HEALTH SCORE: ${healthScore}%`);
  
  if (healthScore >= 85) {
    console.log('🎉 EXCELENTE! Sistema de detecção funcionando perfeitamente!');
  } else if (healthScore >= 70) {
    console.log('👍 BOM! Maioria dos detectores funcionando bem.');
  } else if (healthScore >= 50) {
    console.log('⚠️  MÉDIO. Alguns detectores precisam de atenção.');
  } else {
    console.log('🔧 CRÍTICO. Muitos detectores com problemas - necessário trabalho.');
  }

  // Recomendações finais baseadas nos resultados
  console.log('\n🚀 RECOMENDAÇÕES FINAIS:');
  
  if (successful.length > 0) {
    console.log(`✅ SUCESSO (${successful.length} detectores):`);
    console.log('   🎮 Execute o app: npm run electron:dev');
    console.log('   📱 Teste a interface do usuário');
    console.log('   🔄 Verifique se os jogos aparecem corretamente');
  }
  
  if (noGames.length > 0) {
    console.log(`⚠️  SEM JOGOS (${noGames.length} detectores):`);
    console.log('   📥 Instale jogos das plataformas correspondentes');
    console.log('   🔍 Verifique se as plataformas estão instaladas');
    console.log('   ⚙️  Normal se você não usa essas plataformas');
  }
  
  if (errors.length > 0) {
    console.log(`❌ ERROS (${errors.length} detectores):`);
    errors.forEach(r => {
      console.log(`   • ${r.name}:`);
      if (r.error.includes('Cannot find module')) {
        console.log(`     📁 Criar arquivo: src/lib/gameDetection/platforms/get${r.name.replace(/[^a-zA-Z]/g, '')}Games.ts`);
      } else {
        console.log(`     🔧 Corrigir: ${r.error.substring(0, 60)}...`);
      }
    });
  }

  // Status específico do objetivo principal
  console.log('\n🎯 STATUS DO OBJETIVO PRINCIPAL:');
  if (xboxResult && xboxResult.status === 'SUCCESS') {
    console.log('✅ XBOX DETECTION: PROBLEMA RESOLVIDO! 🎉');
    console.log('   Seu objetivo principal foi alcançado!');
  } else if (xboxResult && xboxResult.status === 'NO_GAMES') {
    console.log('🔶 XBOX DETECTION: FUNCIONANDO, MAS SEM JOGOS');
    console.log('   Detector funciona, só precisa de jogos Xbox instalados');
  } else {
    console.log('🔴 XBOX DETECTION: AINDA PRECISA DE CORREÇÃO');
    console.log('   Foco na correção do detector Xbox');
  }
}

// Executar o teste
testDetectors()
  .then(() => {
    console.log('\n🏁 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('===============================');
    console.log('📝 Para executar novamente: npm run test:detectors');
    console.log('🎮 Para testar no app: npm run electron:dev');
    console.log('🔧 Para corrigir problemas: verifique as sugestões acima');
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL NO TESTE:', error.message);
    console.error('📍 Stack trace:', error.stack);
    console.log('\n🆘 COMO RESOLVER:');
    console.log('1. Verifique se os arquivos dos detectores existem');
    console.log('2. Execute: node scripts/setupFix.js');
    console.log('3. Verifique as permissões de arquivo');
    process.exit(1);
  });