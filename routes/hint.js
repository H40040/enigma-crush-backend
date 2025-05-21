const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');

const router = express.Router();
const prisma = new PrismaClient();

// Configuração do multer para aceitar arquivos de até 10MB
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Criar uma nova dica
router.post('/hint', authenticateToken, [
  body('content').notEmpty().withMessage('O conteúdo é obrigatório'),
  body('type').isIn(['text', 'image', 'video', 'mixed']).withMessage('Tipo inválido'),
  body('publicUrl').optional().isString(), // Permite string, pode ser preenchido depois
  body('qrCodeUrl').optional().isString()  // Permite string, pode ser preenchido depois
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }

  try {
    const { content, type } = req.body;
    const userId = req.user.id;

    let finalType = type;
    let finalContent = content;

    // Detecta se o tipo misto é necessário
    if (type === 'mixed' && typeof content === 'object') {
      finalContent = JSON.stringify(content);
    }

    // Busca ou cria o Admirer vinculado ao User
    let admirer = await prisma.admirer.findFirst({ where: { userId } });
    if (!admirer) {
      admirer = await prisma.admirer.create({ data: { userId } });
    }

    const hint = await prisma.hint.create({
      data: {
        admirerId: admirer.id,
        content: finalContent,
        type: finalType
      }
    });

    res.json({
      id: hint.id
    });
  } catch (error) {
    console.error('Erro ao criar dica:', error);
    res.status(500).json({ error: 'Erro interno ao criar dica' });
  }
});

// Buscar uma dica específica
router.get('/hint/:id', [
  param('id').notEmpty().withMessage('ID da dica é obrigatório')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }

  try {
    const hint = await prisma.hint.findUnique({
      where: { id: req.params.id }
    });

    if (!hint) return res.status(404).json({ error: 'Dica não encontrada' });

    await prisma.hint.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    });

    res.json({
      id: hint.id,
      content: hint.content,
      type: hint.type,
      views: hint.views + 1,
      publicUrl: hint.publicUrl,
      qrCodeUrl: hint.qrCodeUrl
    });
  } catch (error) {
    console.error('Erro ao buscar dica:', error);
    res.status(500).json({ error: 'Erro interno ao buscar dica' });
  }
});

// Buscar todas as dicas de um admirador (agora por userId)
router.get('/', authenticateToken, async (req, res) => { // Changed from /hints to /
  const userId = req.user.id;
  try {
    const admirer = await prisma.admirer.findFirst({ where: { userId } });
    if (!admirer) return res.json([]);
    const hints = await prisma.hint.findMany({
      where: { admirerId: admirer.id },
      include: { _count: { select: { interaction: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = hints.map(h => ({
      id: h.id,
      content: h.content,
      type: h.type,
      interactions: h._count.interaction,
      views: h.views || 0,
      publicUrl: h.publicUrl,
      qrCodeUrl: h.qrCodeUrl
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao buscar dicas:', error);
    res.status(500).json({ error: 'Erro interno ao buscar dicas' });
  }
});

// Deletar uma dica
router.delete('/hint/:id', authenticateToken, [
  param('id').notEmpty().withMessage('ID da dica é obrigatório')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }

  try {
    // Verificar se a dica existe
    const hint = await prisma.hint.findUnique({ where: { id: req.params.id } });
    if (!hint) {
      return res.status(404).json({ error: 'Dica não encontrada' });
    }
    
    // Se não for admin, verificar se é o dono da dica
    if (req.user.role !== 'ADMIN') {
      const admirer = await prisma.admirer.findFirst({ 
        where: { id: hint.admirerId, userId: req.user.id } 
      });
      
      if (!admirer) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir esta dica' });
      }
    }
    
    // Deletar interações relacionadas e depois a dica
    await prisma.interaction.deleteMany({ where: { hintId: req.params.id } });
    await prisma.hint.delete({ where: { id: req.params.id } });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar dica:', error);
    res.status(500).json({ error: 'Erro interno ao deletar dica' });
  }
});

module.exports = router;
