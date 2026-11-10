// TODO(SUPABASE): quando o banco estiver no Supabase:
//   1) npm i pg
//   2) colocar DATABASE_URL no .env (connection string do Supabase)
//   3) descomentar as 2 linhas abaixo e apagar "const pool = null;"
// const { Pool } = require('pg');
// const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const pool = null;

function exigirPool() {
  if (!pool) throw new Error('Banco não configurado');
}

async function query(sql, params) {
  exigirPool();
  return pool.query(sql, params);
}

async function transacao(fn) {
  exigirPool();
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

module.exports = { query, transacao };