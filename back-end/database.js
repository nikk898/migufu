// Reaproveita o pool do database.js (a conexão com o Supabase é configurada lá).
// TODO(SUPABASE): quando o banco estiver no Supabase:
//   1) npm i pg
//   2) colocar DATABASE_URL no .env
//   3) descomentar as 2 linhas abaixo e apagar o bloco "stub"
// const { Pool } = require('pg');
// const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// stub: permite o servidor subir sem banco
const erro = () => { throw new Error('Banco não configurado'); };
const pool = { query: async () => erro(), connect: async () => erro() };

module.exports = pool;

const pool = require('./database');

async function query(sql, params) {
  return pool.query(sql, params);
}

async function transacao(fn) {
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