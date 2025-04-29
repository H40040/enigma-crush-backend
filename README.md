# Enigma Crush Backend

API REST construída com Express.js e Prisma ORM.

## Configuração

1. Instalar as dependências:
```bash
npm install
```

2. Se encontrar problemas com dependências faltantes, execute:
```bash
npm run install:deps
```

3. Configure o arquivo .env:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Se encontrar problemas com múltiplos arquivos .env, execute:
```bash
npm run fix-env
```

5. Configurar o banco de dados:
```bash
# Gerar o cliente Prisma
npm run prisma:generate

# Se encontrar erros de migração, reinicie o processo:
npm run migrate:reset

# Criar a migração inicial
npm run migrate -- --name init
```

6. Iniciar o servidor:
```bash
npm start
```

O servidor estará disponível em: http://localhost:4000

## Limpeza do Projeto

Para limpar arquivos temporários e de uploads:

```bash
npm run cleanup
```

Este comando preserva a estrutura de diretórios necessária, mas remove arquivos temporários e de uploads.

## Rotas da API

### Autenticação
- `POST /api/register` - Registrar novo usuário
- `POST /api/verify-user` - Login de usuário
- `GET /api/profile` - Obter perfil do usuário autenticado

### Admirador e Dicas
- `POST /api/admirer` - Criar/obter admirador
- `POST /api/hint` - Criar nova dica
- `GET /api/hint/:id` - Obter dica específica
- `GET /api/hints` - Obter todas as dicas de um admirador
- `DELETE /api/hint/:id` - Excluir dica

### Interações
- `POST /api/hint/:id/question` - Enviar pergunta
- `POST /api/hint/:id/answer` - Responder pergunta
- `GET /api/hint/:id/interactions` - Obter interações de uma dica

### Dashboard
- `GET /api/dashboard` - Obter dicas para o dashboard

### Upload de Mídia
- `POST /api/upload` - Upload de arquivos de mídia (imagens, áudio, vídeo)