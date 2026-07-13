require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const pool = require('./db/pool');

let sessionStore;
if (process.env.NODE_ENV === 'production') {
  const pgSession = require('connect-pg-simple')(session);
  sessionStore = new pgSession({ pool, tableName: 'session', createTableIfNotExist: true });
} else {
  sessionStore = new session.MemoryStore();
}

const { initSchema } = require('./db/schema');

const authRoutes = require('./routes/auth');
const teamsRoutes = require('./routes/teams');
const tasksRoutes = require('./routes/tasks');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://secure-task-management-system.vercel.app',
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Auto-init schema — store promise so middleware can wait for it
const schemaReady = initSchema();
schemaReady.catch(err => console.error('Schema init failed:', err));

// Middleware that ensures schema is initialized before handling DB requests
app.use((req, res, next) => {
  schemaReady.then(() => next()).catch(err => {
    console.error('Schema init failed:', err);
    res.status(500).json({ error: 'Database initialization failed' });
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/tasks', tasksRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('Server running on port ' + PORT + ' [' + (process.env.NODE_ENV || 'development') + ']');
  });
}

module.exports = app;