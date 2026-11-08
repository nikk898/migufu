// Cria um usuário Admin ou Mestre direto no banco.
// Uso (dentro de back-end/):
//   node scripts/criar-admin.js --perfil Admin --nome "Maria Silva" --email maria@exemplo.com --instituicao TESTE
//   node scripts/criar-admin.js --perfil Mestre --nome "Joao Souza" --email joao@exemplo.com
// A senha é pedida no terminal (não aparece na tela e não fica no histórico).

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../database');

function lerArgs() {
  const args = {};
  const lista = process.argv.slice(2);
  for (let i = 0; i < lista.length; i += 2) {
    if (lista[i].startsWith('--')) args[lista[i].slice(2)] = lista[i + 1];
  }
  return args;
}

function perguntarSenha(texto) {
  return new Promise((resolve) => {
    process.stdout.write(texto);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let senha = '';

    const aoReceber = (bloco) => {
      for (const ch of bloco) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', aoReceber);
          process.stdout.write('\n');
          return resolve(senha);
        }
        if (ch === '\u0003') process.exit(1); // Ctrl+C
        if (ch === '\u007f' || ch === '\b') senha = senha.slice(0, -1);
        else senha += ch;
      }
    };
    stdin.on('data', aoReceber);
  });
}

async function main() {
  const { perfil, nome, email, instituicao } = lerArgs();

  if (!['Admin', 'Mestre'].includes(perfil) || !nome || !email) {
    console.error('Uso: node scripts/criar-admin.js --perfil Admin|Mestre --nome "Nome" --email e@x.com [--instituicao SIGLA]');
    process.exit(1);
  }
  if (perfil === 'Admin' && !instituicao) {
    console.error('Admin precisa de --instituicao com a sigla da instituição.');
    process.exit(1);
  }

  let idInstituicao = null;
  if (perfil === 'Admin') {
    const inst = await pool.query('SELECT id FROM instituicao WHERE sigla = $1', [instituicao]);
    if (inst.rowCount === 0) {
      console.error(`Instituição com sigla "${instituicao}" não encontrada.`);
      process.exit(1);
    }
    idInstituicao = inst.rows[0].id;
  }

  const senha = await perguntarSenha('Senha (mín. 8 caracteres): ');
  const confirmacao = await perguntarSenha('Repita a senha: ');
  if (senha.length < 8) {
    console.error('A senha deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }
  if (senha !== confirmacao) {
    console.error('As senhas não conferem.');
    process.exit(1);
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  const hash = await bcrypt.hash(senha, rounds);

  try {
    const { rows } = await pool.query(
      `INSERT INTO base_user (id_instituicao, nome_completo, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [idInstituicao, nome.trim(), email.trim().toLowerCase(), hash, perfil]
    );
    console.log(`${perfil} criado com sucesso. id = ${rows[0].id}`);
  } catch (err) {
    if (err.code === '23505') console.error('Já existe um usuário com esse e-mail.');
    else console.error('Erro ao criar usuário:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});