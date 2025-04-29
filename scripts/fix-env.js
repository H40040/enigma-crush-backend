/**
 * Script para corrigir o problema de conflito entre arquivos .env
 */
const fs = require('fs');
const path = require('path');

// Caminho para os arquivos .env
const rootEnvPath = path.join(__dirname, '..', '.env');
const prismaEnvPath = path.join(__dirname, '..', 'prisma', '.env');
const prismaEnvBackupPath = path.join(__dirname, '..', 'prisma', '.env.backup');

// Função para ler conteúdo de um arquivo se ele existir
function readFileIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return '';
}

// Função para mesclar variáveis de ambiente
function mergeEnvVars(rootEnv, prismaEnv) {
  const envVars = new Map();
  
  // Processar variáveis do arquivo principal
  if (rootEnv) {
    rootEnv.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars.set(match[1], match[2]);
        }
      }
    });
  }
  
  // Adicionar/sobrescrever com variáveis do arquivo prisma/.env
  if (prismaEnv) {
    prismaEnv.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars.set(match[1], match[2]);
        }
      }
    });
  }
  
  // Transformar de volta para o formato de arquivo .env
  let result = '# Arquivo .env consolidado\n';
  envVars.forEach((value, key) => {
    result += `${key}=${value}\n`;
  });
  
  return result;
}

try {
  console.log('🔍 Verificando arquivos .env...');
  
  // Ler conteúdo dos arquivos .env
  const rootEnv = readFileIfExists(rootEnvPath);
  const prismaEnv = readFileIfExists(prismaEnvPath);
  
  if (fs.existsSync(prismaEnvPath)) {
    // Fazer backup do arquivo prisma/.env
    console.log('📦 Criando backup do arquivo prisma/.env...');
    fs.writeFileSync(prismaEnvBackupPath, prismaEnv);
    
    // Remover o arquivo original para evitar conflitos
    console.log('🗑️ Removendo arquivo prisma/.env original...');
    fs.unlinkSync(prismaEnvPath);
    
    // Consolidar as variáveis de ambiente se não houver arquivo .env na raiz
    if (!fs.existsSync(rootEnvPath)) {
      console.log('✏️ Criando arquivo .env consolidado na raiz...');
      fs.writeFileSync(rootEnvPath, prismaEnv);
    } else {
      console.log('⚠️ O arquivo .env já existe na raiz. Verificando necessidade de atualização...');
      
      // Mesclar variáveis de ambiente
      const mergedEnv = mergeEnvVars(rootEnv, prismaEnv);
      fs.writeFileSync(rootEnvPath, mergedEnv);
      console.log('✅ Arquivo .env atualizado com variáveis de prisma/.env');
    }
  } else {
    console.log('ℹ️ O arquivo prisma/.env não existe. Nenhuma ação necessária.');
  }
  
  console.log('✅ Operação concluída. Agora você pode executar `npm run migrate` novamente.');
} catch (error) {
  console.error('❌ Ocorreu um erro:', error);
}
