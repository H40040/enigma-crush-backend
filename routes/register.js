// backend/routes/register.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { authLimiter } = require('../middleware/rateLimit');
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';

router.post('/register', authLimiter, async (req, res) => {
  const { email, password, name, birthdate, cpf } = req.body;

  if (!email || !password || !name || !birthdate || !cpf) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido' });
  }

  // Validar senha
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  // Validar CPF formato básico
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
  if (!cpfRegex.test(cpf)) {
    return res.status(400).json({ error: 'Formato de CPF inválido' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    // Verificar se já existe um usuário com este CPF
    const existingCpf = await prisma.user.findFirst({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ error: 'CPF já cadastrado' });
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

    // Gera o token JWT após o cadastro
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(201).json({ message: 'Usuário criado com sucesso', id: user.id, token });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

module.exports = router;
