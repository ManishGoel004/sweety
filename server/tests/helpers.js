const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

// Empty all tables so every test starts from a clean database
async function resetDb() {
  await db.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
}

// Registers a user and returns their token, ready for the Authorization header
async function createUser(email = 'patient@example.com', name = 'Test Patient') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' });
  return res.body.token;
}

module.exports = { app, db, request, resetDb, createUser };
