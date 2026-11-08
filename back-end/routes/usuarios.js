
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const { autenticar } = require('../middlewares/auth');
const { limiteLogin, limiteCadastro } = require('../middlewares/limites');

const router = express.Router();
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// Cadastro público: só cria Voluntario ou Internacional.
// Admin e Mestre nunca são criados por aqui.
router.post('/cadastro', limiteCadastro, async (req, res) => {
  const {
    nome_completo, email, senha, telefone, tipo, cpf, curso, campus_id,
    vinculo, periodo, matricula, pais_origem, sobre_mim, expectativas_do_curso
  } = req.body;

  const obrigatorios = [nome_completo, email, senha, cpf, curso];
  if (obrigatorios.some((v) => typeof v !== 'string' || !v.trim())) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
  }
  if (!['Voluntario', 'Internacional'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido' });
  }
  if (!EMAIL_RE.test(email.trim()) || email.trim().length > 254) {
    return res.status(400).json({ erro: 'E-mail inválido' });
  }
  if (nome_completo.trim().length > 200) {
    return res.status(400).json({ erro: 'Nome muito longo' });
  }
  // O bcrypt só considera os primeiros 72 caracteres da senha.
  if (senha.length < 8 || senha.length > 72) {
    return res.status(400).json({ erro: 'A senha deve ter entre 8 e 72 caracteres' });
  }
  if (!/^\d{11}$/.test(cpf)) {
    return res.status(400).json({ erro: 'CPF deve ter 11 dígitos' });
  }
  if (tipo === 'Internacional' && (!matricula || !campus_id)) {
    return res.status(400).json({ erro: 'Matrícula e campus são obrigatórios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // A instituição do usuário vem do campus escolhido
    let idInstituicao = null;
    if (campus_id) {
      const campus = await client.query(
        'SELECT id_instituicao FROM campus WHERE id = $1', [campus_id]
      );
      if (campus.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ erro: 'Campus não encontrado' });
      }
      idInstituicao = campus.rows[0].id_instituicao;
    }

    const hash = await bcrypt.hash(senha, ROUNDS);
    const novo = await client.query(
      `INSERT INTO base_user
         (id_instituicao, nome_completo, email, senha_hash, telefone, perfil)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [idInstituicao, nome_completo.trim(), email.trim().toLowerCase(),
       hash, telefone || null, tipo]
    );
    const id = novo.rows[0].id;

    if (tipo === 'Voluntario') {
      await client.query(
        `INSERT INTO voluntario
           (user_id, cpf, vinculo, curso, periodo, campus_id, sobre_mim, expectativas_do_curso)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, cpf, vinculo || 'Funcionario', curso, periodo || null,
         campus_id || null, sobre_mim || null, expectativas_do_curso || null]
      );
    } else {
      await client.query(
        `INSERT INTO estudante_internacional
           (usuario_id, matricula, cpf, pais_origem, curso, campus_id, sobre_mim, expectativas_do_curso)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, matricula, cpf, pais_origem || 'Angola', curso, campus_id,
         sobre_mim || null, expectativas_do_curso || null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail, CPF ou matrícula já cadastrado' });
    }
    if (err.code === '22P02' || err.code === '23514' || err.code === '22001') {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  } finally {
    client.release();
  }
});

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