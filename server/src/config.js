require('dotenv').config({ quiet: true });

const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  port: process.env.PORT || 5000,
  databaseUrl: isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-secret' : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
