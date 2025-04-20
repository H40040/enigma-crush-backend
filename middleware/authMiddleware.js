const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Acesso não autorizado', 
      message: 'Token de autenticação não fornecido' 
    });
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('ERRO: JWT_SECRET não configurado no ambiente');
    return res.status(500).json({ error: 'Erro de configuração do servidor' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado', 
        message: 'Sua sessão expirou. Por favor, faça login novamente' 
      });
    }
    return res.status(403).json({ 
      error: 'Token inválido', 
      message: 'O token de autenticação fornecido é inválido' 
    });
  }
}

module.exports = authenticateToken;
