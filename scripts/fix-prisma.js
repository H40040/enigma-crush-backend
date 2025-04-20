/**
 * Script para resolver problemas de compatibilidade do Prisma
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Iniciando correção do Prisma Client...');

// Função para executar comandos de forma segura
function runCommand(command, directory = __dirname) {
  try {
    console.log(`Executando: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(directory, '..')
    });
    return true;
  } catch (error) {
    console.error(`Erro ao executar comando: ${command}`);
    console.error(error.message);
    return false;
  }
}

// 1. Limpar caches e reinstalar o Prisma
console.log('🧹 Limpando caches Node.js e Prisma...');

// Remover diretório node_modules/.prisma se existir
const prismaCacheDir = path.join(__dirname, '..', 'node_modules', '.prisma');
if (fs.existsSync(prismaCacheDir)) {
  console.log('Removendo cache do Prisma...');
  fs.rmSync(prismaCacheDir, { recursive: true, force: true });
}

// Remover node_modules/@prisma se existir
const prismaDir = path.join(__dirname, '..', 'node_modules', '@prisma');
if (fs.existsSync(prismaDir)) {
  console.log('Removendo instalação do Prisma...');
  fs.rmSync(prismaDir, { recursive: true, force: true });
}

// 2. Reinstalar as dependências do Prisma
console.log('📦 Reinstalando Prisma...');
runCommand('npm install --save prisma@latest @prisma/client@latest');

// 3. Criar arquivo dev.db vazio se não existir
const dbDir = path.join(__dirname, '..');
const dbPath = path.join(dbDir, 'dev.db');
if (!fs.existsSync(dbPath)) {
  console.log('📄 Criando arquivo de banco de dados vazio...');
  fs.writeFileSync(dbPath, '');
}

// 4. Atualizar o schema.prisma
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('📝 Atualizando schema.prisma...');
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Corrigir o provider e a URL
  schemaContent = schemaContent
    .replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = env("DATABASE_URL")')
    .replace(/provider\s*=\s*"prisma-client-js"/, 'provider = "prisma-client-js"')
    .replace(/output\s*=\s*".*"/, ''); // Remover a linha de output se existir
  
  fs.writeFileSync(schemaPath, schemaContent);
}

// 5. Regenerar o cliente Prisma
console.log('🔄 Regenerando Prisma Client...');
runCommand('npx prisma generate');

// 6. Verificar se o problema foi resolvido
console.log('✅ Processo de correção concluído!');
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm run migrate:reset');
console.log('2. Execute: npm run migrate -- --name init');
console.log('3. Execute: npm start');
console.log('\nCaso ainda enfrente problemas, abaixe a versão do Node.js:');
console.log('- Use o NVM: nvm use 18');
console.log('- Ou instale uma versão LTS: https://nodejs.org/');
