/**
 * Script para instalar dependências faltantes no backend
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Lista de dependências necessárias para o servidor
const requiredDeps = [
  'express',
  'cors',
  'compression',
  'helmet',
  'multer',
  'express-rate-limit',
  'express-validator',
  'jsonwebtoken',
  'bcrypt',
  'dotenv',
  '@prisma/client'
];

// Caminho para o arquivo package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Verificar quais dependências já estão instaladas
console.log('🔍 Verificando dependências instaladas...');
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Erro ao ler o arquivo package.json:', error.message);
  process.exit(1);
}

const installedDeps = Object.keys(packageJson.dependencies || {});
const missingDeps = requiredDeps.filter(dep => !installedDeps.includes(dep));

if (missingDeps.length === 0) {
  console.log('✅ Todas as dependências necessárias já estão listadas no package.json.');
  console.log('⚠️ Executando npm install para garantir que estão instaladas...');
} else {
  console.log(`⚠️ Dependências faltantes: ${missingDeps.join(', ')}`);
  console.log('📦 Instalando dependências faltantes...');
}

// Instalar as dependências
try {
  if (missingDeps.length > 0) {
    execSync(`npm install ${missingDeps.join(' ')} --save`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Dependências instaladas com sucesso!');
  } else {
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Dependências reinstaladas com sucesso!');
  }
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

console.log('🚀 Agora você pode iniciar o servidor com:');
console.log('   npm start');
