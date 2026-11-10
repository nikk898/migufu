const express = require('express');
const db = require('../db');
const { autenticar } = require('../middlewares/auth');
const { limiteSuporte } = require('../middlewares/limites');
const v = require('../utils/validacao');

const router = express.Router();

router.post('/', autenticar, limiteSuporte, async (req, res) => {
  const assunto = v.texto(req.body.assunto, 'Assunto', { min: 3, max: 50 });
  const mensagem = v.texto(req.body.mensagem, 'Mensagem', { min: 10, max: 2000 });
  const r = await db.query(
    'INSERT INTO mensagem_suporte (usuario_id, assunto, mensagem) VALUES ($1, $2, $3) RETURNING id',
    [req.usuario.id, assunto, mensagem]
  );
  res.status(201).json({ id: r.rows[0].id, mensagem: 'Chamado enviado' });
});

module.exports = router;