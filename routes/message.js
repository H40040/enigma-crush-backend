const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get a specific message publicly (e.g., for recipients)
router.get('/:id/public', async (req, res) => {
  const { id } = req.params;
  try {
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        replies: { // Assuming 'replies' is the relation field in Prisma schema
          orderBy: {
            createdAt: 'asc',
          },
        },
        // We don't include sender's User object here for privacy on public view
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Increment view count
    await prisma.message.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Return the message (which now includes the updated view count implicitly if re-fetched,
    // or client can assume view was incremented)
    // For simplicity, we return the message fetched before view increment,
    // or we can re-fetch, but that's an extra DB call.
    // The client usually doesn't need the absolute latest view count immediately after viewing.
    res.json(message);
  } catch (error) {
    console.error('Error fetching public message:', error);
    if (error.code === 'P2025') { // Prisma error code for record not found during update (if message was deleted between find and update)
        return res.status(404).json({ error: 'Message not found or could not be updated.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Criar nova mensagem
router.post('/', async (req, res) => {
  const {
    senderId,
    recipientId,
    recipientUsername,
    recipientEmail,
    recipientPhone,
    contactMethod,
    content,
    imageUrl
  } = req.body;

  if (!senderId || !contactMethod || !content) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId: recipientId || null,
        recipientUsername: recipientUsername || null,
        recipientEmail: recipientEmail || null,
        recipientPhone: recipientPhone || null,
        contactMethod,
        content,
        imageUrl: imageUrl || null,
      },
      include: {
        replies: true
      }
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: 'Erro interno ao criar mensagem.' });
  }
});

// Adicionar resposta a uma mensagem
router.post('/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { content, fromRecipient } = req.body;
  if (!content || typeof fromRecipient !== 'boolean') {
    return res.status(400).json({ error: 'Conteúdo e origem da resposta são obrigatórios.' });
  }
  try {
    // Verifica se a mensagem existe
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }
    // Cria a resposta
    const reply = await prisma.reply.create({
      data: {
        messageId: id,
        content,
        fromRecipient,
      },
    });
    // Retorna a resposta criada
    res.status(201).json(reply);
  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    res.status(500).json({ error: 'Erro interno ao criar resposta.' });
  }
});

// Buscar todas as mensagens (para inbox/sent)
router.get('/', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        replies: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno ao buscar mensagens.' });
  }
});

// Deletar uma mensagem e suas replies
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Deleta replies associadas primeiro
    await prisma.reply.deleteMany({ where: { messageId: id } });
    // Deleta a mensagem
    const deleted = await prisma.message.delete({ where: { id } });
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error, error?.code, error?.meta, error?.message);
    if (error.code === 'P2025' || (typeof error.message === 'string' && error.message.includes('No record found'))) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }
    res.status(500).json({ error: 'Erro interno ao deletar mensagem.' });
  }
});

module.exports = router;
