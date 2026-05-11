const express    = require('express');
const bodyParser = require('body-parser');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Detect environment ────────────────────────────────────────────────────────
// Uses PostgreSQL when DATABASE_URL is set (Render/Supabase),
// falls back to SQLite for local development.
const IS_PRODUCTION = !!process.env.DATABASE_URL;

// ── DB abstraction layer ──────────────────────────────────────────────────────
let dbReady = false;
let db;

if (IS_PRODUCTION) {
  // ── PostgreSQL (Supabase on Render) ─────────────────────────────────────────
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },   // Required by Supabase
  });

  db = {
    async query(sql, params = []) {
      const result = await pool.query(sql, params);
      return result.rows;
    },
    async queryOne(sql, params = []) {
      const rows = await this.query(sql, params);
      return rows[0];
    },
  };

  // Create table if not exists (PostgreSQL syntax)
  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      age        TEXT,
      name       TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
    .then(() => {
      console.log('[db] PostgreSQL connected — users table ready');
      dbReady = true;
    })
    .catch(err => {
      console.error('[db] PostgreSQL setup error:', err.message);
      process.exit(1);
    });

} else {
  // ── SQLite (local development) ───────────────────────────────────────────────
  const Database = require('better-sqlite3');
  const fs       = require('fs');

  const DB_PATH  = path.join(__dirname, 'ospectra.db');
  const sqlite   = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      age        TEXT,
      name       TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // One-time migration: users.json → SQLite
  const USERS_JSON = path.join(__dirname, 'users.json');
  if (fs.existsSync(USERS_JSON)) {
    try {
      const jsonUsers = JSON.parse(fs.readFileSync(USERS_JSON, 'utf8'));
      const insert = sqlite.prepare(`
        INSERT OR IGNORE INTO users (username, password, age, name)
        VALUES (@username, @password, @age, @name)
      `);
      const importMany = sqlite.transaction((users) => {
        for (const u of users) {
          insert.run({
            username: u.username,
            password: u.password,
            age:      u.age  || null,
            name:     u.name || null,
          });
        }
      });
      importMany(jsonUsers);
      console.log(`[db] Migrated ${jsonUsers.length} user(s) from users.json`);
      fs.renameSync(USERS_JSON, USERS_JSON + '.migrated');
    } catch (err) {
      console.warn('[db] Migration warning:', err.message);
    }
  }

  // Wrap SQLite in the same async interface as PostgreSQL
  db = {
    async query(sql, params = []) {
      // Convert $1,$2 PostgreSQL placeholders → ? for SQLite
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      const stmt = sqlite.prepare(sqliteSql);
      return stmt.all(...params);
    },
    async queryOne(sql, params = []) {
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      const stmt = sqlite.prepare(sqliteSql);
      return stmt.get(...params);
    },
  };

  console.log(`[db] SQLite ready — ${DB_PATH}`);
  dbReady = true;
}

// ── Helper: derive display name ───────────────────────────────────────────────
function deriveDisplayName(user) {
  if (user.name && user.name.trim().length > 1) return user.name.trim();
  const prefix = (user.username || '').split('@')[0];
  return prefix
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ── Middleware: wait for DB ───────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  if (!dbReady) return res.status(503).json({ success: false, message: 'Database not ready yet.' });
  next();
});

// ── POST /api/login ───────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: 'Email and password are required.' });
    }

    const user = await db.queryOne(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (user && user.password === password) {
      return res.json({
        success:  true,
        message:  'Login successful',
        username: user.username,
        name:     deriveDisplayName(user),
        email:    user.username,
        age:      user.age,
      });
    }

    res.json({ success: false, message: 'User not found or wrong password.' });
  } catch (err) {
    console.error('[login] error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── POST /api/signup ──────────────────────────────────────────────────────────
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, age, name } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: 'Email and password are required.' });
    }

    const existing = await db.queryOne(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (existing) {
      return res.json({ success: false, message: 'User already exists.' });
    }

    await db.query(
      'INSERT INTO users (username, password, age, name) VALUES ($1, $2, $3, $4)',
      [username, password, age || null, name ? name.trim() : null]
    );

    const newUser = await db.queryOne(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    return res.json({
      success:  true,
      message:  'Sign up successful',
      username: newUser.username,
      name:     deriveDisplayName(newUser),
      email:    newUser.username,
      age:      newUser.age,
    });
  } catch (err) {
    console.error('[signup] error:', err.message);
    return res.json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

// ── GET /api/users (debug — remove in production) ────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, age, name, created_at FROM users'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mode: ${IS_PRODUCTION ? 'PostgreSQL (Production)' : 'SQLite (Local)'}`);
});