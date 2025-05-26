const fs = require('fs');
const path = require('path');

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

  console.log('✅ Conversion completed successfully!');
} catch (error) {
  console.error('❌ Error during conversion:', error);
}