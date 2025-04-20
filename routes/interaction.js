// backend/routes/interaction.js

const { PrismaClient } = require('@prisma/client');
const express = require('express');
const prisma = new PrismaClient();
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// Proteger a rota com autenticação
router.post('/interaction/answer', authenticateToken, async (req, res) => {
  const { id, answer } = req.body;

  if (!id || !answer) {
    return res.status(400).json({ error: 'ID e resposta são obrigatórios.' });
  }

  try {
    // Verificar se a interação existe
    const existingInteraction = await prisma.interaction.findUnique({
      where: { id },
      include: { hint: true }
    });

    if (!existingInteraction) {
      return res.status(404).json({ error: 'Interação não encontrada.' });
    }

    // Verificar se o usuário tem permissão para responder
    const hint = existingInteraction.hint;
    const admirer = await prisma.admirer.findUnique({
      where: { id: hint.admirerId }
    });

    if (admirer.email !== req.user.email) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const interaction = await prisma.interaction.update({
      where: { id },
      data: { 
        answer,
        answeredAt: new Date()
      },
    });

    res.json({ success: true, interaction });
  } catch (err) {
    console.error('Erro ao salvar resposta:', err);
    res.status(500).json({ error: 'Erro interno ao salvar resposta.' });
  }
});

// Adicionar rota para buscar interações de uma dica
router.get('/hint/:id/interactions', authenticateToken, async (req, res) => {
  try {
    const hintId = req.params.id;
    
    const hint = await prisma.hint.findUnique({
      where: { id: hintId },
      include: { admirer: true }
    });
    
    if (!hint) {
      return res.status(404).json({ error: 'Dica não encontrada' });
    }
    
    // Verificar se o usuário tem permissão para ver as interações
    if (hint.admirer.email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso não autorizado a estas interações' });
    }
    
    const interactions = await prisma.interaction.findMany({
      where: { hintId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(interactions);
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
    res.status(500).json({ error: 'Erro interno ao buscar interações' });
  }
});

module.exports = router;
