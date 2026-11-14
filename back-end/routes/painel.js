const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middlewares/auth');
const { completarPessoas } = require('../utils/dados');

const router = express.Router();
router.use(autenticar);

// GET /api/painel/voluntario  (voluntario.html)
router.get('/voluntario', autorizar('Voluntario'), async (req, res) => {
  const id = req.usuario.id;
  const eu = await db.query(
    `SELECT b.nome_completo AS nome, vo.status_aptidao,
            (vo.certificado_url IS NOT NULL) AS certificado_enviado,
            vo.data_envio_certificado
       FROM voluntario vo JOIN base_user b ON b.id = vo.user_id
      WHERE vo.user_id = $1 AND b.ativo`, [id]);
  if (!eu.rows[0]) return res.status(404).json({ erro: 'Voluntário não encontrado' });

  const migufus = await db.query(
    `SELECT e.usuario_id AS id, b.nome_completo AS nome, e.pais_origem AS pais, e.curso,
            c.nome AS campus, b.telefone, b.email, e.sobre_mim AS bio
       FROM vinculo_migufu m
       JOIN estudante_internacional e ON e.usuario_id = m.estudante_internacional_id
       JOIN base_user b ON b.id = e.usuario_id AND b.ativo
       JOIN campus c ON c.id = e.campus_id
      WHERE m.voluntario_id = $1 AND m.ativo
      ORDER BY m.data_inicio DESC`, [id]);

  res.json({ ...eu.rows[0], migufus: await completarPessoas(migufus.rows) });
});

// POST /api/painel/voluntario/certificado  (voluntario.html)
// Corpo = o próprio PDF (Content-Type: application/pdf). Nome original no header X-Nome-Arquivo.
// Reenvio (após reprovação) substitui o arquivo e volta o status para 'Pendente'.
router.post(
  '/voluntario/certificado',
  autorizar('Voluntario'),
  express.raw({ type: 'application/pdf', limit: '3mb' }),
  async (req, res) => {
    const erroHttp = (status, msg) => Object.assign(new Error(msg), { statusHttp: status });

    const arquivo = req.body;
    if (!Buffer.isBuffer(arquivo) || arquivo.length === 0) {
      throw erroHttp(400, 'Envie um arquivo PDF');
    }
    if (arquivo.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw erroHttp(400, 'O arquivo não é um PDF válido');
    }

    let nome = 'certificado.pdf';
    try {
      nome = decodeURIComponent(String(req.headers['x-nome-arquivo'] || '')) || nome;
    } catch { /* mantém o nome padrão */ }
    nome = nome.replace(/[\\/]/g, '_').slice(0, 255);

    await db.transacao(async (c) => {
      // Só atualiza se ainda não foi aprovado
      const r = await c.query(
        `UPDATE voluntario
            SET certificado_url = $2, data_envio_certificado = NOW(),
                status_aptidao = 'Pendente', ultima_atualizacao = NOW()
          WHERE user_id = $1 AND status_aptidao <> 'Apto'`,
        [req.usuario.id, 'db:' + nome]);
      if (r.rowCount === 0) {
        throw erroHttp(409, 'Não é possível enviar: voluntário já aprovado ou não encontrado');
      }
      await c.query(
        `INSERT INTO voluntario_certificado
                (voluntario_id, nome_arquivo, tipo_mime, tamanho_bytes, conteudo, enviado_em)
         VALUES ($1, $2, 'application/pdf', $3, $4, NOW())
         ON CONFLICT (voluntario_id) DO UPDATE
            SET nome_arquivo = EXCLUDED.nome_arquivo,
                tamanho_bytes = EXCLUDED.tamanho_bytes,
                conteudo = EXCLUDED.conteudo,
                enviado_em = NOW()`,
        [req.usuario.id, nome, arquivo.length, arquivo]);
    });

    res.status(201).json({ mensagem: 'Certificado enviado para análise' });
  }
);

// GET /api/painel/estudante  (estudante.html)
router.get('/estudante', autorizar('Internacional'), async (req, res) => {
  const id = req.usuario.id;
  const eu = await db.query(
    `SELECT b.nome_completo AS nome, e.idioma_site
       FROM estudante_internacional e JOIN base_user b ON b.id = e.usuario_id
      WHERE e.usuario_id = $1 AND b.ativo`, [id]);
  if (!eu.rows[0]) return res.status(404).json({ erro: 'Estudante não encontrado' });

  const migufus = await db.query(
    `SELECT vo.user_id AS id, b.nome_completo AS nome, vo.curso, c.nome AS campus,
            b.telefone, b.email, vo.sobre_mim AS bio
       FROM vinculo_migufu m
       JOIN voluntario vo ON vo.user_id = m.voluntario_id
       JOIN base_user b ON b.id = vo.user_id AND b.ativo
       LEFT JOIN campus c ON c.id = vo.campus_id
      WHERE m.estudante_internacional_id = $1 AND m.ativo
      ORDER BY m.data_inicio DESC`, [id]);

  res.json({ ...eu.rows[0], migufus: await completarPessoas(migufus.rows) });
});

module.exports = router;