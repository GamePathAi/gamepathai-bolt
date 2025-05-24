// test-electron.js - Teste sistemático do Electron
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DO ELECTRON\n');

// Teste 1: Verificar arquivos necessários
console.log('1. Verificando arquivos...');
const requiredFiles = [
  'package.json',
  'electron/main.cjs',
  'electron/preload.cjs'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - FALTANDO`);
  }
});

// Teste 2: Verificar package.json
console.log('\n2. Verificando package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Nome: ${pkg.name}`);
  console.log(`✅ Versão: ${pkg.version}`);
  console.log(`✅ Main: ${pkg.main || 'NÃO DEFINIDO'}`);
  console.log(`⚠️  Type: ${pkg.type || 'PADRÃO (commonjs)'}`);
  
  if (pkg.type === 'module') {
    console.log('🔥 PROBLEMA: "type": "module" pode causar conflitos');
  }
} catch (error) {
  console.log(`❌ Erro ao ler package.json: ${error.message}`);
}

// Teste 3: Verificar conflitos de módulos
console.log('\n3. Verificando conflitos...');
const electronDir = 'electron/src';
if (fs.existsSync(electronDir)) {
  const jsFiles = [];
  const scanDir = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (file.name.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    });
  };
  
  scanDir(electronDir);
  console.log(`📁 Encontrados ${jsFiles.length} arquivos .js em electron/src`);
  
  // Verificar se usam import/export
  jsFiles.slice(0, 3).forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hasImport = content.includes('import ');
      const hasExport = content.includes('export ');
      console.log(`${hasImport || hasExport ? '⚠️ ' : '✅'} ${file} - ${hasImport ? 'import' : ''} ${hasExport ? 'export' : ''}`);
    } catch (error) {
      console.log(`❌ Erro lendo ${file}`);
    }
  });
}

// Teste 4: Sugestões de correção
console.log('\n4. SUGESTÕES DE CORREÇÃO:');
console.log('📝 Opção 1: Remover "type": "module" do package.json');
console.log('📝 Opção 2: Converter arquivos .js para .cjs em electron/src');
console.log('📝 Opção 3: Usar dynamic import() no main.cjs');
console.log('📝 Opção 4: Separar package.json para electron/');

console.log('\n🎯 PRÓXIMO PASSO: Escolher uma correção e aplicar!');