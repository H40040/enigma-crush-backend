
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const register = require('./routes/register');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('./routes/auth');


const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'https://seuapp.vercel.app'] }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', register);
app.use('/api', auth);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

app.post('/api/admirer', async (req, res) => {
  const { email } = req.body;
  const admirer = await prisma.admirer.upsert({
    where: { email },
    update: {},
    create: { email }
  });
  res.json({ id: admirer.id });
});

app.post('/api/hint', async (req, res) => {
  const { admirerId, content, type } = req.body;
  const hint = await prisma.hint.create({
    data: { content, type, admirerId }
  });
  res.json({ id: hint.id });
});

app.get('/api/hint/:id', async (req, res) => {
  const updated = await prisma.hint.update({
    where: { id: req.params.id },
    data: { views: { increment: 1 } }
  });
  res.json({ id: updated.id, content: updated.content, type: updated.type });
});

app.get('/api/hints', async (req, res) => {
  const { email } = req.query;
  const admirer = await prisma.admirer.findUnique({ where: { email } });
  if (!admirer) return res.json([]);
  const hints = await prisma.hint.findMany({
    where: { admirerId: admirer.id },
    include: { _count: { select: { interactions: true } } },
    orderBy: { createdAt: 'desc' }
  });
  const formatted = hints.map(h => ({
    id: h.id,
    content: h.content,
    type: h.type,
    interactions: h._count.interactions,
    views: h.views || 0
  }));
  res.json(formatted);
});

app.post('/api/hint/:id/question', async (req, res) => {
  const count = await prisma.interaction.count({ where: { hintId: req.params.id } });
  if (count >= 3) return res.status(400).json({ error: 'Limite de interações atingido' });
  await prisma.interaction.create({
    data: { question: req.body.question, hintId: req.params.id }
  });
  res.json({ status: 'Pergunta enviada' });
});

app.post('/api/hint/:id/answer', async (req, res) => {
  const interaction = await prisma.interaction.findFirst({
    where: { hintId: req.params.id, answer: null },
    orderBy: { createdAt: 'asc' }
  });
  if (!interaction) return res.status(400).json({ error: 'Sem perguntas pendentes' });
  await prisma.interaction.update({
    where: { id: interaction.id },
    data: { answer: req.body.answer }
  });
  res.json({ status: 'Resposta enviada' });
});

app.get('/api/hint/:id/interactions', async (req, res) => {
  const interactions = await prisma.interaction.findMany({
    where: { hintId: req.params.id },
    orderBy: { createdAt: 'asc' }
  });
  res.json(interactions);
});

app.get('/api/admin/hints', async (req, res) => {
  const hints = await prisma.hint.findMany({
    include: {
      _count: { select: { interactions: true } },
      admirer: { select: { email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(hints.map(h => ({
    id: h.id, content: h.content, type: h.type, views: h.views, createdAt: h.createdAt,
    _count: h._count, email: h.admirer.email
  })));
});

app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({ url: `http://localhost:4000/uploads/${req.file.filename}` });
});

app.delete('/api/hint/:id', async (req, res) => {
  await prisma.interaction.deleteMany({ where: { hintId: req.params.id } });
  await prisma.hint.delete({ where: { id: req.params.id } });
  res.json({ status: 'Dica deletada com sucesso' });
});

app.listen(4000, () => console.log('Servidor backend rodando na porta 4000'));
