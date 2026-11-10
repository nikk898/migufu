
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const { autenticar } = require('../middlewares/auth');
const { limiteLogin } = require('../middlewares/limites');

const router = express.Router();


router.post('/login', limiteLogin, async (req, res) => {
  const { email, senha } = req.body;
  if (typeof email !== 'string' || typeof senha !== 'string' || !email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nome_completo, senha_hash, perfil, id_instituicao, ativo
         FROM base_user WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const u = rows[0];
    const ok = u && u.senha_hash && await bcrypt.compare(senha, u.senha_hash);

    // Mesma mensagem para e-mail inexistente e senha errada
    if (!ok || !u.ativo) {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Só para testar o middleware: devolve o que está dentro do token
router.get('/me', autenticar, (req, res) => {
  res.json(req.usuario);
});

module.exports = router;