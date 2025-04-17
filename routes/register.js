// backend/routes/register.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  const { email, password, name, birthdate, cpf } = req.body;

  if (!email || !password || !name || !birthdate || !cpf) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        birthdate: new Date(birthdate),
        cpf,
      },
    });

    res.status(201).json({ id: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

module.exports = router;
