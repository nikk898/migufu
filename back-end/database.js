// Conexão com o banco (pool). As funções query/transacao ficam em db.js.
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