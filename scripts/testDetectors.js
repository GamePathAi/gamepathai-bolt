// scripts/testDetectors.js
// Script corrigido para arquivos TypeScript

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
      // Tentar importar o módulo TypeScript (com extensão .ts)
      const modulePath = `../src/lib/gameDetection/platforms/${detector.file}.ts`;
      console.log(`   📁 Carregando: ${detector.file}.ts`);
      
      const module = await import(modulePath);
      
      // Encontrar a função de detecção
      const detectFunction = module[detector.file] || module.default;
      
      if (!detectFunction) {
        console.log(`   ❌ Função não encontrada`);
        console.log(`   📋 Disponível:`, Object.keys(module));
        results.push({ name: detector.name, status: 'ERROR', games: 0, error: 'Função não encontrada' });
        continue;
      }

      // Executar detecção
      console.log(`   ⚙️ Executando...`);
      const startTime = Date.now();
      const games = await detectFunction();
      const duration = Date.now() - startTime;
      
      if (!Array.isArray(games)) {
        console.log(`   ❌ Retorno inválido: ${typeof games}`);
        results.push({ name: detector.name, status: 'ERROR', games: 0, error: 'Retorno não é array' });
        continue;
      }

      const gameCount = games.length;
      totalGames += gameCount;

      if (gameCount > 0) {
        console.log(`   ✅ ${gameCount} jogos encontrados (${duration}ms)`);
        
        // Mostrar primeiros 3 jogos
        games.slice(0, 3).forEach(game => {
          const name = game.name || game.title || 'Nome indefinido';
          const path = game.installPath || game.path || 'Caminho indefinido';
          const platform = game.platform || detector.name;
          console.log(`      🎮 ${name} (${platform})`);
          console.log(`         📂 ${path.length > 60 ? path.substring(0, 60) + '...' : path}`);
        });
        
        if (gameCount > 3) {
          console.log(`      ... e mais ${gameCount - 3} jogos`);
        }
        
        results.push({ name: detector.name, status: 'SUCCESS', games: gameCount });
      } else {
        console.log(`   ⚠️  Nenhum jogo encontrado (${duration}ms)`);
        results.push({ name: detector.name, status: 'NO_GAMES', games: 0 });
      }

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      
      // Dar dicas específicas baseadas no erro
      if (error.message.includes('Cannot find module')) {
        console.log(`   💡 Dica: Arquivo TypeScript pode precisar de compilação`);
      } else if (error.message.includes('Unknown file extension')) {
        console.log(`   💡 Dica: Node.js não consegue executar TypeScript diretamente`);
      }
      
      results.push({ name: detector.name, status: 'ERROR', games: 0, error: error.message });
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
  successful.forEach(r => console.log(`   - ${r.name}: ${r.games} jogos`));
  
  console.log(`⚠️  Funcionando sem jogos: ${noGames.length}/${results.length}`);
  noGames.forEach(r => console.log(`   - ${r.name}: detector OK, mas sem jogos instalados`));
  
  console.log(`❌ Com erros: ${errors.length}/${results.length}`);
  errors.forEach(r => console.log(`   - ${r.name}: ${r.error.substring(0, 80)}...`));
  
  console.log(`\n🎮 TOTAL DE JOGOS: ${totalGames}`);

  // Foco no Xbox (seu problema original)
  const xboxResult = results.find(r => r.name === 'Xbox');
  if (xboxResult) {
    console.log('\n🎯 RESULTADO XBOX:');
    if (xboxResult.status === 'SUCCESS') {
      console.log(`✅ RESOLVIDO! Xbox encontrou ${xboxResult.games} jogos!`);
    } else if (xboxResult.status === 'NO_GAMES') {
      console.log(`⚠️ Xbox detector funciona, mas não encontrou jogos`);
      console.log(`   💡 Sugestão: Verifique se jogos Xbox estão instalados`);
    } else {
      console.log(`❌ Xbox ainda com problema técnico`);
      console.log(`   💡 Sugestão: Usar método via Electron para testar TypeScript`);
    }
  }

  // Recomendação final
  if (errors.length === results.length) {
    console.log('\n💡 RECOMENDAÇÃO:');
    console.log('Todos os detectores falharam porque Node.js não executa TypeScript diretamente.');
    console.log('Vamos usar o método via Electron que suporta TypeScript!');
  }
}

// Executar o teste
testDetectors()
  .then(() => {
    console.log('\n🏁 Teste concluído!');
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error.message);
    console.error('Stack:', error.stack);
  });