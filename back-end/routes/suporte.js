const express = require('express');
const pool = require('../database');
const { autenticar, autorizar } = require('../middlewares/auth');
const { limiteSuporte } = require('../middlewares/limites');
const v = require('../utils/validacao');

const router = express.Router();

// ---------- ABERTA PARA QUALQUER USUÁRIO LOGADO (ajuda.html) ----------
// Precisa ficar ANTES do router.use abaixo, senão só Admin/Mestre conseguiria abrir chamado.
// POST /api/suporte  body: { mensagem, assunto? }
router.post('/', autenticar, limiteSuporte, async (req, res) => {
  const mensagem = v.texto(req.body.mensagem, 'Mensagem', { min: 10, max: 2000 });
  // O formulário só tem a mensagem; o assunto é NOT NULL no banco, então tem valor padrão.
  const assunto = v.texto(req.body.assunto, 'Assunto', { min: 3, max: 50, obrigatorio: false }) || 'Ajuda e suporte';
  const { rows } = await pool.query(
    'INSERT INTO mensagem_suporte (usuario_id, assunto, mensagem) VALUES ($1, $2, $3) RETURNING id',
    [req.usuario.id, assunto, mensagem]
  );
  res.status(201).json({ id: rows[0].id, mensagem: 'Chamado enviado' });
});

// ---------- A PARTIR DAQUI: SÓ ADMIN OU MESTRE (código do tutorial) ----------
router.use(autenticar, autorizar('Admin', 'Mestre'));

// GET /api/suporte?status=pendente&busca=ana&pagina=1
router.get('/', async (req, res) => {
  const resolvido = req.query.status === 'resolvido';
  const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const porPagina = 10;

  // o trecho entre ${} é fixo (não vem do usuário); a busca vai por parâmetro ($1)
  const where = `m.resolvido_em IS ${resolvido ? 'NOT NULL' : 'NULL'}
    AND (u.nome_completo ILIKE $1 OR u.email ILIKE $1)`;
  const termo = '%' + busca + '%';

  const total = await pool.query(
    `SELECT COUNT(*)::int AS n FROM mensagem_suporte m
       JOIN base_user u ON u.id = m.usuario_id WHERE ${where}`, [termo]);

  const { rows } = await pool.query(
    `SELECT m.id, u.nome_completo AS nome, u.email, u.telefone, m.mensagem,
            CASE u.perfil WHEN 'Internacional' THEN 'estudante' ELSE 'voluntario' END AS perfil,
            m.data_criacao AS criado_em
       FROM mensagem_suporte m JOIN base_user u ON u.id = m.usuario_id
      WHERE ${where}
      ORDER BY m.data_criacao DESC LIMIT $2 OFFSET $3`,
    [termo, porPagina, (pagina - 1) * porPagina]);

  res.json({ total: total.rows[0].n, itens: rows });
});

// PATCH /api/suporte/:id/resolver
router.patch('/:id/resolver', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'Id inválido' });

  const { rowCount } = await pool.query(
    `UPDATE mensagem_suporte SET resolvido_em = NOW(), resolvido_por = $2
      WHERE id = $1 AND resolvido_em IS NULL`, [id, req.usuario.id]); // quem resolveu: do token

  if (rowCount === 0) return res.status(404).json({ erro: 'Chamado não encontrado' });
  res.json({ mensagem: 'Chamado resolvido' });
});

module.exports = router;