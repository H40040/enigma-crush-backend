const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Importação de rotas
const register = require('./routes/register');
const auth = require('./routes/auth');
const dashboard = require('./routes/dashboard');
const interaction = require('./routes/interaction');
const hint = require('./routes/hint');
const authenticateToken = require('./middleware/authMiddleware');

// Inicialização segura do Prisma
let prisma;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('Erro ao inicializar o Prisma Client:', error);
  process.exit(1);
}

const app = express();

// Middlewares de segurança e performance
app.use(helmet()); // Adiciona headers de segurança
app.use(compression()); // Comprime as respostas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de CORS mais segura
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));

// Limitador de requisições para prevenir ataques de força bruta
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Serviço de arquivos estáticos com CORS liberado corretamente
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Rota protegida para teste
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Acesso autorizado', user: req.user });
});

// Rotas importadas
app.use('/api', register);
app.use('/api', auth);
app.use('/api', dashboard);
app.use('/api', interaction);
app.use('/api', hint);

// Configuração do multer com validações
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Configuração melhorada do multer com limites de tamanho
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
    files: 1 // Apenas 1 arquivo por vez
  },
  fileFilter: (req, file, cb) => {
    // Verificar tipos de arquivo permitidos
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mp3'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Movendo rotas para arquivos separados, mantendo apenas a lógica essencial aqui

// Rota de upload com autenticação
app.post('/api/upload', authenticateToken, upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Gerar URL com base no ambiente
    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao processar upload', details: error.message });
  }
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro global:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor backend rodando na porta ${PORT}`));
