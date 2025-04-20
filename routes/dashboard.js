// backend/routes/dashboard.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const authenticateToken = require('../middleware/authMiddleware');

// Aplicar middleware de autenticação
router.get('/dashboard', authenticateToken, async (req, res) => {
  const { hintsFor } = req.query;

  if (!hintsFor) {
    return res.status(400).json({ error: 'Parâmetro hintsFor é obrigatório.' });
  }

  // Verificar se o usuário tem permissão para acessar essas dicas
  if (req.user.email !== hintsFor && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const admirer = await prisma.admirer.findUnique({ where: { email: hintsFor } });
    if (!admirer) return res.json([]);

    const hints = await prisma.hint.findMany({
      where: { admirerId: admirer.id },
      include: { interactions: true },
      orderBy: { createdAt: 'desc' } // Ordenar do mais recente para o mais antigo
    });

    res.json(hints);
  } catch (err) {
    console.error('Erro no dashboard:', err);
    res.status(500).json({ error: 'Erro interno ao buscar dados do painel.' });
  }
});

module.exports = router;