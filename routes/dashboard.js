// backend/routes/dashboard.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/dashboard', async (req, res) => {
  const { hintsFor } = req.query;

  if (!hintsFor) {
    return res.status(400).json({ error: 'Parâmetro hintsFor é obrigatório.' });
  }

  try {
    const admirer = await prisma.admirer.findUnique({ where: { email: hintsFor } });
    if (!admirer) return res.json([]);

    const hints = await prisma.hint.findMany({
      where: { admirerId: admirer.id },
      include: { interactions: true },
    });

    res.json(hints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados do painel.' });
  }
});

module.exports = router;