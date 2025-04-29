require('dotenv').config({ path: './prisma/.env' });

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  tokenExpiration: process.env.TOKEN_EXPIRATION || '1h',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.API_URL 
    : `http://localhost:${process.env.PORT || 4000}`
};
