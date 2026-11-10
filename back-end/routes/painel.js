const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middlewares/auth');

const router = express.Router();
router.use(autenticar);

// Retorna: nome, status_aptidao, certificado_enviado, data_envio_certificado, migufus[]
// Front: status 'Pendente' + !certificado_enviado => "Ação necessária";
//        status 'Pendente' + certificado_enviado  => "Certificado em análise".
router.get('/voluntario', autorizar('Voluntario'), async (req, res) => {
  const id = req.usuario.id;
  const eu = await db.query(
    `SELECT b.nome_completo AS nome, vo.status_aptidao,
            (vo.certificado_url IS NOT NULL) AS certificado_enviado,
            vo.data_envio_certificado
       FROM voluntario vo
       JOIN base_user b ON b.id = vo.user_id
      WHERE vo.user_id = $1 AND b.ativo`,
    [id]
  );
  if (!eu.rows[0]) return res.status(404).json({ erro: 'Voluntário não encontrado' });

  const migufus = await db.query(
    `SELECT e.usuario_id AS id, b.nome_completo AS nome, e.pais_origem, e.curso,
            c.nome AS campus, m.data_inicio
       FROM vinculo_migufu m
       JOIN estudante_internacional e ON e.usuario_id = m.estudante_internacional_id
       JOIN base_user b ON b.id = e.usuario_id
       JOIN campus c ON c.id = e.campus_id
      WHERE m.voluntario_id = $1 AND m.ativo
      ORDER BY m.data_inicio DESC`,
    [id]
  );
  res.json({ ...eu.rows[0], migufus: migufus.rows });
});

router.get('/estudante', autorizar('Internacional'), async (req, res) => {
  const id = req.usuario.id;
  const eu = await db.query(
    `SELECT b.nome_completo AS nome, e.idioma_site
       FROM estudante_internacional e
       JOIN base_user b ON b.id = e.usuario_id
      WHERE e.usuario_id = $1 AND b.ativo`,
    [id]
  );
  if (!eu.rows[0]) return res.status(404).json({ erro: 'Estudante não encontrado' });

  const migufus = await db.query(
    `SELECT vo.user_id AS id, b.nome_completo AS nome, vo.curso, c.nome AS campus, m.data_inicio
       FROM vinculo_migufu m
       JOIN voluntario vo ON vo.user_id = m.voluntario_id
       JOIN base_user b ON b.id = vo.user_id
       LEFT JOIN campus c ON c.id = vo.campus_id
      WHERE m.estudante_internacional_id = $1 AND m.ativo
      ORDER BY m.data_inicio DESC`,
    [id]
  );
  res.json({ ...eu.rows[0], migufus: migufus.rows });
});

module.exports = router;