/**
 * Script de limpeza para remover arquivos temporários e de cache
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretórios para limpar
const DIRS_TO_CLEAN = [
  path.join(__dirname, '..', 'uploads'), // Preservar diretório, mas limpar arquivos
];

// Arquivos para manter nos diretórios limpos
const FILES_TO_KEEP = ['.gitkeep'];

// Limpar diretórios
DIRS_TO_CLEAN.forEach(dir => {
  try {
    // Verificar se o diretório existe
    if (fs.existsSync(dir)) {
      console.log(`🧹 Limpando diretório: ${dir}`);

      // Ler o conteúdo do diretório
      const files = fs.readdirSync(dir);

      // Excluir arquivos (exceto os que devem ser mantidos)
      files.forEach(file => {
        if (!FILES_TO_KEEP.includes(file)) {
          const filePath = path.join(dir, file);
          console.log(`  - Removendo: ${filePath}`);
          fs.unlinkSync(filePath);
        }
      });
    } else {
      console.log(`⚠️ Diretório não encontrado: ${dir}`);
      // Criar o diretório se não existir
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.gitkeep'), '');
      console.log(`✅ Diretório criado: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao limpar diretório ${dir}:`, error);
  }
});

// Limpar arquivos do Next.js build
try {
  const frontendDir = path.join(__dirname, '..', '..', '..', 'enigma-crush-frontend-updated', 'frontend_real');
  
  if (fs.existsSync(path.join(frontendDir, '.next'))) {
    console.log('🧹 Limpando diretório de build do Next.js');
    execSync('rm -rf .next', { cwd: frontendDir });
    console.log('✅ Diretório de build limpo com sucesso');
  }
} catch (error) {
  console.error('❌ Erro ao limpar diretório de build:', error);
}

console.log('✨ Limpeza concluída!');
