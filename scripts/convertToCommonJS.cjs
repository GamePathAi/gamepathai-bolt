const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO CONVERSÃO DE MÓDULOS ES PARA COMMONJS');
console.log('==========================================\n');

const convertESModuleToCommonJS = (filePath) => {
  console.log(`Converting: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Converter exports
  content = content.replace(/export const (\w+)/g, 'const $1');
  content = content.replace(/export default/g, 'module.exports =');
  content = content.replace(/export \{([^}]+)\}/g, 'module.exports = { $1 }');
  content = content.replace(/export (async )?function (\w+)/g, '$1function $2');
  content = content.replace(/export (class|interface|type|enum) (\w+)/g, '$1 $2');
  
  // Converter imports
  content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g, 
    'const { $1 } = require("$2");');
  content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, 
    'const $1 = require("$2");');
  content = content.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g,
    'const $1 = require("$2");');
  
  // Handle TypeScript interfaces and types
  content = content.replace(/interface (\w+)/g, '// interface $1');
  content = content.replace(/type (\w+)/g, '// type $1');
  
  // Remove TypeScript types
  content = content.replace(/:\s*[A-Za-z<>\[\]|]+(\s*=)/g, '$1');
  content = content.replace(/:\s*[A-Za-z<>\[\]|]+;/g, ';');
  content = content.replace(/:\s*[A-Za-z<>\[\]|]+\)/g, ')');
  content = content.replace(/:\s*Promise<[^>]+>/g, '');
  
  // Remove optional property indicators
  content = content.replace(/\?:/g, ':');
  
  // Fix Promise<Type> to Promise
  content = content.replace(/Promise<[^>]+>/g, 'Promise');
  
  // Convert .ts imports to .js
  content = content.replace(/require\(['"]([^'"]+)\.ts['"]\)/g, 'require("$1.js")');
  content = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, 'from "$1.js"');
  
  // Add module.exports at the end if not already present
  if (!content.includes('module.exports')) {
    // Find all exported constants, functions, and classes
    const exportMatches = content.match(/const\s+(\w+)|function\s+(\w+)|class\s+(\w+)/g) || [];
    if (exportMatches.length > 0) {
      const exportNames = exportMatches
        .map(exp => {
          const match = exp.match(/const\s+(\w+)|function\s+(\w+)|class\s+(\w+)/);
          return match[1] || match[2] || match[3];
        })
        .filter(Boolean);
      
      if (exportNames.length > 0) {
        content += `\n\nmodule.exports = { ${exportNames.join(', ')} };\n`;
      }
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Converted: ${filePath}`);
};

// Converter todos os arquivos de detecção
const gameDetectionDir = path.join(__dirname, '..', 'src', 'lib', 'gameDetection', 'platforms');
console.log(`Scanning directory: ${gameDetectionDir}`);

try {
  const files = fs.readdirSync(gameDetectionDir);
  console.log(`Found ${files.length} files in directory`);

  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const filePath = path.join(gameDetectionDir, file);
      convertESModuleToCommonJS(filePath);
    }
  });

  // Renomear arquivos .ts para .js após conversão
  console.log("\nRenaming .ts files to .js...");
  files.forEach(file => {
    if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      const oldPath = path.join(gameDetectionDir, file);
      const newPath = path.join(gameDetectionDir, file.replace('.ts', '.js'));
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${file} → ${file.replace('.ts', '.js')}`);
    }
  });

  console.log('✅ Conversion completed successfully!');
} catch (error) {
  console.error('❌ Error during conversion:', error);
}