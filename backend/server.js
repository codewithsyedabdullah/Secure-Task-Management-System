require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const pool = require('./db/pool');

// Session store: PostgreSQL in production, memory in dev
let sessionStore;
if (process.env.NODE_ENV === 'production') {
  const pgSession = require('connect-pg-simple')(session);
  sessionStore = new pgSession({ pool, tableName: 'session' });
} else {
  sessionStore = new session.MemoryStore();
}

const authRoutes = require('./routes/auth');
const teamsRoutes = require('./routes/teams');
const tasksRoutes = require('./routes/tasks');

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: 'https://secure-task-management-system.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204,
}));
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/teams', teamsRoutes);
app.use('/tasks', tasksRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
