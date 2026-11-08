'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_ORIGIN'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  connectionTimeoutMillis: 10000,
});

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));

function cleanUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}
function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '12h', issuer: 'wattwise-api' });
}
function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 72;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return res.status(400).json({ error: 'Enter a name with up to 100 characters.' });
    }
    if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!validPassword(password)) return res.status(400).json({ error: 'Password must be 8 to 72 characters.' });

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), normalizedEmail, passwordHash],
    );
    const user = cleanUser(result.rows[0]);
    return res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== 'string' || password.length > 72) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }
    const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const user = cleanUser(row);
    return res.json({ token: createToken(user), user });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', async (req, res, next) => {
  try {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'Sign in to continue.' });
    let payload;
    try {
      payload = jwt.verify(match[1], process.env.JWT_SECRET, { issuer: 'wattwise-api' });
    } catch (_error) {
      return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
    }
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [payload.sub]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Account not found.' });
    return res.json({ user: cleanUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function start() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`Wattwise API listening on port ${port}`));
}

start().catch((error) => {
  console.error('Could not initialize Wattwise API:', error);
  process.exit(1);
});
