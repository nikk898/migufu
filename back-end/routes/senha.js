const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../database');
const { limiteEsqueci, limiteRedefinir } = require('../middlewares/limites');
const { enviarRecuperacaoSenha, enviarAvisoSenhaAlterada } = require('../services/email');

const router = express.Router();
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALIDADE_MINUTOS = 30;      // tempo de vida do link
const INTERVALO_SEGUNDOS = 120;   // mínimo entre dois pedidos para o mesmo usuário
const MENSAGEM_PEDIDO = 'Se o e-mail estiver cadastrado, você receberá as instruções em instantes.';

// O token enviado por e-mail nunca é guardado: no banco fica só o hash dele.
const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

async function processarPedido(email) {
  const { rows } = await pool.query(
    'SELECT id, nome_completo FROM base_user WHERE email = $1 AND ativo',
    [email]
  );
  const usuario = rows[0];
  if (!usuario) return;

  // Evita encher a caixa de entrada de alguém com pedidos seguidos.
  const recente = await pool.query(
    `SELECT 1 FROM token_recuperar_senha
      WHERE usuario_id = $1 AND criado_em > NOW() - make_interval(secs => $2)`,
    [usuario.id, INTERVALO_SEGUNDOS]
  );
  if (recente.rowCount > 0) return;

  if (!process.env.URL_REDEFINIR_SENHA) {
    throw new Error('URL_REDEFINIR_SENHA não definida no .env');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Só o link mais recente vale: os anteriores ainda não usados são invalidados.
    await client.query(
      'UPDATE token_recuperar_senha SET usado_em = NOW() WHERE usuario_id = $1 AND usado_em IS NULL',
      [usuario.id]
    );
    await client.query(
      `INSERT INTO token_recuperar_senha (usuario_id, token_hash, expira_em)
       VALUES ($1, $2, NOW() + make_interval(mins => $3))`,
      [usuario.id, sha256(token), VALIDADE_MINUTOS]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const link = `${process.env.URL_REDEFINIR_SENHA}?token=${token}`;
  await enviarRecuperacaoSenha({
    para: { email, nome: usuario.nome_completo },
    link,
    minutos: VALIDADE_MINUTOS
  });
}

// Pede a redefinição. Responde sempre a mesma coisa, exista o e-mail ou não,
// para ninguém descobrir quais e-mails estão cadastrados. A resposta sai ANTES
// do trabalho (banco e envio), para o tempo de resposta também não revelar nada.
router.post('/esqueci', limiteEsqueci, (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ erro: 'Informe um e-mail válido' });
  }

  res.json({ mensagem: MENSAGEM_PEDIDO });

  processarPedido(email.trim().toLowerCase()).catch((err) => {
    console.error('Falha na recuperação de senha:', err.message);
  });
});

// Define a nova senha usando o token recebido por e-mail.
router.post('/redefinir', limiteRedefinir, async (req, res) => {
  const { token, senha } = req.body;

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ erro: 'Link inválido ou expirado' });
  }
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 72) {
    return res.status(400).json({ erro: 'A senha deve ter entre 8 e 72 caracteres' });
  }

  let aviso = null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Consome o token numa única instrução: se duas requisições chegarem juntas,
    // só uma encontra o token ainda não usado.
    const uso = await client.query(
      `UPDATE token_recuperar_senha SET usado_em = NOW()
        WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > NOW()
        RETURNING usuario_id`,
      [sha256(token)]
    );
    if (uso.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Link inválido ou expirado' });
    }
    const usuarioId = uso.rows[0].usuario_id;

    const hash = await bcrypt.hash(senha, ROUNDS);
    const atualizado = await client.query(
      `UPDATE base_user SET senha_hash = $1, ultima_atualizacao = NOW()
        WHERE id = $2 AND ativo
        RETURNING nome_completo, email`,
      [hash, usuarioId]
    );
    if (atualizado.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Link inválido ou expirado' });
    }

    // Qualquer outro link pendente deste usuário deixa de valer.
    await client.query(
      'UPDATE token_recuperar_senha SET usado_em = NOW() WHERE usuario_id = $1 AND usado_em IS NULL',
      [usuarioId]
    );

    await client.query('COMMIT');
    aviso = { email: atualizado.rows[0].email, nome: atualizado.rows[0].nome_completo };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // o Express 5 encaminha para o tratador central de erros
  } finally {
    client.release();
  }

  res.json({ mensagem: 'Senha alterada com sucesso.' });

  // Aviso de segurança por e-mail; se falhar, só registra no log.
  enviarAvisoSenhaAlterada({ para: aviso }).catch((err) => {
    console.error('Falha ao enviar o aviso de senha alterada:', err.message);
  });
});

module.exports = router;