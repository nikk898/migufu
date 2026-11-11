const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const { autenticar } = require('../middlewares/auth');
const { limiteLogin } = require('../middlewares/limites');

const router = express.Router();

// Hash falso: quando o e-mail não existe, a senha é comparada com ele mesmo assim.
// Assim a resposta demora o mesmo tempo e não revela quais e-mails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync('senha-que-ninguem-usa', 12);

// POST /api/usuarios/login   body: { email, senha }
// Resposta: { token, usuario: { id, nome_completo, perfil } }
router.post('/login', limiteLogin, async (req, res) => {
  const { email, senha } = req.body;
  if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }
  // Textos absurdamente grandes nunca são credenciais de verdade
  if (email.length > 254 || senha.length > 128) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  }

  const { rows } = await pool.query(
    `SELECT id, nome_completo, senha_hash, perfil, id_instituicao, ativo
       FROM base_user WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  const u = rows[0];
  const senhaOk = await bcrypt.compare(senha, (u && u.senha_hash) || HASH_FALSO);

  // Mesma mensagem para e-mail inexistente, senha errada e conta desativada
  if (!u || !u.senha_hash || !senhaOk || !u.ativo) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  }

  const token = jwt.sign(
    { id: u.id, perfil: u.perfil, id_instituicao: u.id_instituicao },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
  res.json({
    token,
    usuario: { id: u.id, nome_completo: u.nome_completo, perfil: u.perfil }
  });
});

// GET /api/usuarios/me   header: Authorization: Bearer <token>
// Confere no banco se a pessoa ainda existe e está ativa (o token sozinho continua
// válido até expirar). As páginas protegidas chamam esta rota ao abrir.
router.get('/me', autenticar, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, nome_completo, email, perfil, id_instituicao, ativo
       FROM base_user WHERE id = $1`,
    [req.usuario.id]
  );
  const u = rows[0];
  if (!u || !u.ativo) return res.status(401).json({ erro: 'Sessão inválida' });

  res.json({
    id: u.id,
    nome_completo: u.nome_completo,
    email: u.email,
    perfil: u.perfil,            // sempre o do banco, não o do token
    id_instituicao: u.id_instituicao
  });
});

// Não existe rota de "logout": o token é guardado só no navegador, então sair é apagar
// o token (Api.sair() no front).

module.exports = router;