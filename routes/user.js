const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Search users by name
router.get('/search', async (req, res) => {
  const { name } = req.query;

  console.log('[USER SEARCH] Query param name:', name);

  if (!name) {
    return res.status(400).json({ error: 'Name query parameter is required' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    console.log('[USER SEARCH] Found users:', users);
    res.json(users);
  } catch (error) {
    console.error('[USER SEARCH] Error searching users:', error);
    // Adiciona detalhes do erro para debug em desenvolvimento
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
