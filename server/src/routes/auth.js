const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name) throw new HttpError(400, 'Please enter your name.');
  if (!EMAIL_REGEX.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  // Never store the plain password - only the bcrypt hash
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, passwordHash]
  );
  const user = result.rows[0];

  res.status(201).json({ token: createToken(user.id), user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) throw new HttpError(400, 'Please enter your email and password.');

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  // Same message for "no such user" and "wrong password",
  // so nobody can find out which emails are registered.
  const passwordOk = user && (await bcrypt.compare(password, user.password_hash));
  if (!passwordOk) throw new HttpError(401, 'Invalid email or password.');

  res.json({
    token: createToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = router;
