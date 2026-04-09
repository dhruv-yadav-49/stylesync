const { Pool } = require('pg');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stylesync'
});

const init = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  init
};
