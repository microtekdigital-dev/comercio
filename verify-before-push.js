#!/usr/bin/env node

/**
 * Script de verificación antes de subir a GitHub
 * Ejecuta: node verify-before-push.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando proyecto antes de subir a GitHub...\n');

let hasErrors = false;
let hasWarnings = false;

// Verificar que .env.local existe
console.log('1️⃣  Verificando archivos de entorno...');
if (fs.existsSync('.env.local')) {
  console.log('   ✅ .env.local existe (no se subirá a GitHub)');
} else {
  console.log('   ⚠️  .env.local no existe. Crea uno basado en .env.example');
  hasWarnings = true;
}

// Verificar que .env.example existe
if (fs.existsSync('.env.example')) {
  console.log('   ✅ .env.example existe');
} else {
  console.log('   ❌ .env.example no existe');
  hasErrors = true;
}

// Verificar .gitignore
console.log('\n2️⃣  Verificando .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  
  const requiredEntries = ['.env*', 'node_modules', '.next'];
  const missingEntries = requiredEntries.filter(entry => !gitignore.includes(entry));
  
  if (missingEntries.length === 0) {
    console.log('   ✅ .gitignore está correctamente configurado');
  } else {
    console.log('   ❌ .gitignore falta entradas:', missingEntries.join(', '));
    hasErrors = true;
  }
} else {
  console.log('   ❌ .gitignore no existe');
  hasErrors = true;
}

// Verificar que node_modules no se suba
console.log('\n3️⃣  Verificando node_modules...');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ node_modules existe localmente (no se subirá)');
} else {
  console.log('   ⚠️  node_modules no existe. Ejecuta npm install');
  hasWarnings = true;
}

// Verificar archivos de documentación
console.log('\n4️⃣  Verificando documentación...');
const docs = ['README.md', 'DEPLOYMENT.md', 'GITHUB_SETUP.md'];
docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`   ✅ ${doc} existe`);
  } else {
    console.log(`   ⚠️  ${doc} no existe`);
    hasWarnings = true;
  }
});

// Verificar scripts SQL
console.log('\n5️⃣  Verificando scripts SQL...');
const sqlScripts = [
  'scripts/010_create_erp_tables.sql',
  'scripts/020_add_company_settings.sql',
  'scripts/030_create_notifications.sql',
  'scripts/060_simplify_sale_status.sql'
];

sqlScripts.forEach(script => {
  if (fs.existsSync(script)) {
    console.log(`   ✅ ${script} existe`);
  } else {
    console.log(`   ⚠️  ${script} no existe`);
    hasWarnings = true;
  }
});

// Buscar posibles credenciales hardcodeadas
console.log('\n6️⃣  Buscando credenciales hardcodeadas...');
const filesToCheck = [
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/mercadopago/client.ts'
];

let foundCredentials = false;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Buscar patrones sospechosos
    const suspiciousPatterns = [
      /supabase\.co\/[a-zA-Z0-9]{20,}/,
      /eyJ[a-zA-Z0-9_-]{20,}/,
      /sk_[a-zA-Z0-9]{20,}/,
      /pk_[a-zA-Z0-9]{20,}/
    ];
    
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content) && !content.includes('process.env')) {
        console.log(`   ⚠️  Posible credencial hardcodeada en ${file}`);
        foundCredentials = true;
        hasWarnings = true;
      }
    });
  }
});

if (!foundCredentials) {
  console.log('   ✅ No se encontraron credenciales hardcodeadas');
}

// Verificar tamaño de archivos
console.log('\n7️⃣  Verificando tamaño de archivos...');
function checkLargeFiles(dir, maxSize = 50 * 1024 * 1024) { // 50MB
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let largeFiles = [];
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    // Ignorar node_modules, .next, .git
    if (file.name === 'node_modules' || file.name === '.next' || file.name === '.git') {
      return;
    }
    
    if (file.isDirectory()) {
      largeFiles = largeFiles.concat(checkLargeFiles(fullPath, maxSize));
    } else {
      const stats = fs.statSync(fullPath);
      if (stats.size > maxSize) {
        largeFiles.push({ path: fullPath, size: stats.size });
      }
    }
  });
  
  return largeFiles;
}

const largeFiles = checkLargeFiles('.');
if (largeFiles.length === 0) {
  console.log('   ✅ No hay archivos muy grandes (>50MB)');
} else {
  console.log('   ⚠️  Archivos grandes encontrados (GitHub limita a 100MB):');
  largeFiles.forEach(file => {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`      - ${file.path} (${sizeMB}MB)`);
  });
  hasWarnings = true;
}

// Resumen
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRORES ENCONTRADOS - Corrígelos antes de subir');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  ADVERTENCIAS ENCONTRADAS - Revisa antes de subir');
  console.log('\n📋 Puedes continuar, pero revisa las advertencias.');
  process.exit(0);
} else {
  console.log('✅ TODO LISTO PARA SUBIR A GITHUB');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Initial commit"');
  console.log('   3. Sigue las instrucciones en GITHUB_SETUP.md');
  process.exit(0);
}
