const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('../config/passport');
const pool = require('../db/pool');
const { body, validationResult } = require('express-validator');

// POST /auth/register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;
    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email or username already taken.' });

      const password_hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, password_hash]
      );
      const user = result.rows[0];

      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: 'Login after register failed.' });
        res.status(201).json({ message: 'Registered successfully.', user });
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error during registration.' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password required.'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials.' });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password_hash, ...safeUser } = user;
        res.json({ message: 'Logged in successfully.', user: safeUser });
      });
    })(req, res, next);
  }
);

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ message: 'Logged out successfully.' });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({ user: req.user });
});

module.exports = router;
