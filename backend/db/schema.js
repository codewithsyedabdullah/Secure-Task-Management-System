const pool = require('./pool');

async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(500),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo',
        priority VARCHAR(10) DEFAULT 'medium',
        due_date DATE,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_session_expire ON "session" (expire)`);

    await client.query('COMMIT');
    console.log('Database schema initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Schema init error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { initSchema };
