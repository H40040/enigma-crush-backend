// backend/routes/interaction.js

const { PrismaClient } = require('@prisma/client');
const expressInteraction = require('express');
const prismaInteraction = new PrismaClient();
const interactionRouter = expressInteraction.Router();

interactionRouter.post('/interaction/answer', async (req, res) => {
  const { id, answer } = req.body;

  if (!id || !answer) {
    return res.status(400).json({ error: 'ID e resposta são obrigatórios.' });
  }

  try {
    const interaction = await prismaInteraction.interaction.update({
      where: { id },
      data: { answer },
    });

    res.json({ success: true, interaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar resposta.' });
  }
});

module.exports = interactionRouter;
