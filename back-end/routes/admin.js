const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middlewares/auth');
const { escopoPorPerfil } = require('../utils/escopo');

const router = express.Router();

// Vale para o arquivo inteiro: precisa estar logado e ser Admin.
// (O Mestre tem a própria tela, com dados de todas as instituições.)
router.use(autenticar, autorizar('Admin'));

// GET /api/admin/resumo  (admin.html)
// Devolve os números da instituição do Admin logado:
// {
//   nome, instituicao,
//   estudantes_com_migufu, estudantes_sem_migufu,
//   voluntarios_aptos, certificados_pendentes, mensagens_pendentes
// }
router.get('/resumo', async (req, res) => {
  // 1) Quem é o admin e qual a instituição dele. Lido do banco (e não do token)
  //    para refletir uma troca de instituição feita depois do login.
  const eu = await db.query(
    `SELECT u.nome_completo AS nome, u.id_instituicao, i.nome AS inst_nome, i.sigla
       FROM base_user u
       LEFT JOIN instituicao i ON i.id = u.id_instituicao
      WHERE u.id = $1 AND u.ativo`,
    [req.usuario.id]
  );
  const admin = eu.rows[0];
  if (!admin) return res.status(404).json({ erro: 'Administrador não encontrado' });
  if (admin.id_instituicao == null) {
    return res.status(403).json({ erro: 'Administrador sem instituição vinculada' });
  }

  // 2) Filtro de escopo (utils/escopo.js): Admin só enxerga a própria instituição.
  //    Cada consulta tem o próprio array de parâmetros.
  const usuario = { ...req.usuario, id_instituicao: admin.id_instituicao };

  const pUsuarios = [];
  const filtroUsuarios = escopoPorPerfil(usuario, 'u', pUsuarios);
  const pMensagens = [];
  const filtroMensagens = escopoPorPerfil(usuario, 'u', pMensagens);

  // O trecho entre ${} vem do código (escopo.js), nunca do usuário; os valores vão por $1.
  // COUNT ... FILTER conta várias coisas numa só ida ao banco; ::int evita string no JSON.
  const [contagens, mensagens] = await Promise.all([
    db.query(
      `SELECT
         COUNT(*) FILTER (WHERE u.perfil = 'Internacional' AND EXISTS (
            SELECT 1 FROM vinculo_migufu vm
             WHERE vm.estudante_internacional_id = u.id AND vm.ativo))::int AS estudantes_com_migufu,
         COUNT(*) FILTER (WHERE u.perfil = 'Internacional' AND NOT EXISTS (
            SELECT 1 FROM vinculo_migufu vm
             WHERE vm.estudante_internacional_id = u.id AND vm.ativo))::int AS estudantes_sem_migufu,
         COUNT(*) FILTER (WHERE u.perfil = 'Voluntario'
            AND vo.status_aptidao = 'Apto')::int AS voluntarios_aptos,
         COUNT(*) FILTER (WHERE u.perfil = 'Voluntario'
            AND vo.status_aptidao = 'Pendente'
            AND vo.certificado_url IS NOT NULL)::int AS certificados_pendentes
       FROM base_user u
       LEFT JOIN voluntario vo ON vo.user_id = u.id
      WHERE u.ativo AND ${filtroUsuarios}`,
      pUsuarios
    ),
    db.query(
      `SELECT COUNT(*)::int AS n
         FROM mensagem_suporte m
         JOIN base_user u ON u.id = m.usuario_id
        WHERE m.resolvido_em IS NULL AND ${filtroMensagens}`,
      pMensagens
    ),
  ]);

  const c = contagens.rows[0];
  res.json({
    nome: admin.nome,
    instituicao: admin.sigla ? `${admin.inst_nome} (${admin.sigla})` : admin.inst_nome,
    estudantes_com_migufu: c.estudantes_com_migufu,
    estudantes_sem_migufu: c.estudantes_sem_migufu,
    voluntarios_aptos: c.voluntarios_aptos,
    certificados_pendentes: c.certificados_pendentes,
    mensagens_pendentes: mensagens.rows[0].n,
  });
});

module.exports = router;
