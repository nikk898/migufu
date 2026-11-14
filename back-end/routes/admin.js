const path = require('path');
const fs = require('fs');
const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middlewares/auth');
const { escopoPorPerfil } = require('../utils/escopo');
const { semAcentoSql, padraoBusca } = require('../utils/busca');

/*
 * Rotas do Admin (todas exigem perfil Admin e só enxergam a instituição dele):
 *   GET /api/admin/resumo                          admin.html
 *   GET /api/admin/validacao?busca=                admin-validacao.html (certificados pendentes)
 *   GET /api/admin/validacao/:id/certificado       baixa o arquivo enviado pelo voluntário
 *   PUT /api/admin/validacao/:id                   body: { decisao: 'aprovar' | 'reprovar' }
 */

// Onde ficam os certificados quando certificado_url guarda só o nome do arquivo.
// (Se guardar um link http/https, a rota de download devolve o link.)
const PASTA_CERTIFICADOS = path.join(__dirname, '..', 'uploads', 'certificados');

function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const formatarCpf = (c) => (c && /^\d{11}$/.test(c)
  ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c);
const nomeArquivo = (url) => (url ? decodeURIComponent(String(url).split(/[\\/]/).pop().split('?')[0]) : null);
const ehLink = (url) => /^https?:\/\//i.test(String(url || ''));

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

// ======================================================================
// VALIDAÇÃO DE CERTIFICADOS (admin-validacao.html)
// ======================================================================

// GET /api/admin/validacao?busca=ana
// Voluntários que enviaram o certificado e aguardam análise (status Pendente).
// A busca procura no nome, no e-mail e no CPF (com ou sem pontuação).
router.get('/validacao', async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca.trim().slice(0, 100) : '';
  const digitos = busca.replace(/\D/g, '');

  const params = [];
  const escopo = escopoPorPerfil(req.usuario, 'u', params);
  params.push(padraoBusca(busca));
  const pTexto = `$${params.length}`;
  // Sem dígitos na busca, o CPF não entra (senão '%%' casaria com todo mundo)
  params.push(digitos ? '%' + digitos + '%' : null);
  const pCpf = `$${params.length}`;

  const { rows } = await db.query(
    `SELECT u.id, u.nome_completo AS nome, u.email, vo.cpf,
            COALESCE(vo.curso, 'Não se aplica') AS curso,
            vo.certificado_url, vo.data_envio_certificado,
            vc.nome_arquivo AS arquivo_banco
       FROM base_user u JOIN voluntario vo ON vo.user_id = u.id
       LEFT JOIN voluntario_certificado vc ON vc.voluntario_id = vo.user_id
      WHERE u.ativo AND u.perfil = 'Voluntario'
        AND vo.status_aptidao = 'Pendente' AND vo.certificado_url IS NOT NULL
        AND ${escopo}
        AND (${semAcentoSql('u.nome_completo')} LIKE ${pTexto} OR lower(u.email) LIKE ${pTexto}
             OR (${pCpf}::text IS NOT NULL AND vo.cpf LIKE ${pCpf}::text))
      ORDER BY vo.data_envio_certificado NULLS LAST, u.nome_completo`, params);

  res.json(rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    cpf: formatarCpf(r.cpf),
    curso: r.curso,
    nome_arquivo: r.arquivo_banco || nomeArquivo(r.certificado_url),
    data_envio: r.data_envio_certificado,
  })));
});

// GET /api/admin/validacao/:id/certificado
// PDF guardado no banco -> o próprio PDF.
// Reserva (formato antigo): link http/https -> { url }; nome de arquivo -> arquivo em disco.
router.get('/validacao/:id/certificado', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'Id inválido' });

  const params = [id];
  const escopo = escopoPorPerfil(req.usuario, 'u', params);
  const { rows } = await db.query(
    `SELECT vo.certificado_url, vc.nome_arquivo, vc.tipo_mime, vc.conteudo
       FROM base_user u JOIN voluntario vo ON vo.user_id = u.id
       LEFT JOIN voluntario_certificado vc ON vc.voluntario_id = vo.user_id
      WHERE u.id = $1 AND ${escopo}`, params);
  const r = rows[0];
  if (!r) return res.status(404).json({ erro: 'Certificado não encontrado' });

  // PDF guardado no banco
  if (r.conteudo) {
    const ascii = r.nome_arquivo.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    res.set({
      'Content-Type': r.tipo_mime || 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(r.nome_arquivo)}`,
      'Cache-Control': 'private, no-store',
    });
    return res.send(r.conteudo);
  }

  // Reserva: formato antigo (link ou arquivo em disco)
  const url = r.certificado_url;
  if (!url) return res.status(404).json({ erro: 'Certificado não encontrado' });
  if (ehLink(url)) return res.json({ url });

  // path.basename impede sair da pasta (ex.: "../../.env")
  const arquivo = path.join(PASTA_CERTIFICADOS, path.basename(url));
  if (!fs.existsSync(arquivo)) return res.status(404).json({ erro: 'Arquivo do certificado não encontrado' });
  res.download(arquivo, path.basename(url));
});

// PUT /api/admin/validacao/:id   body: { decisao: 'aprovar' | 'reprovar' }
// aprovar -> status_aptidao 'Apto'; reprovar -> 'Nao Apto' (o voluntário pode reenviar).
router.put('/validacao/:id', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'Id inválido' });
  const status = { aprovar: 'Apto', reprovar: 'Nao Apto' }[req.body.decisao];
  if (!status) return res.status(400).json({ erro: "Informe decisao: 'aprovar' ou 'reprovar'" });

  const params = [id, status];
  const escopo = escopoPorPerfil(req.usuario, 'u', params);
  const { rowCount } = await db.query(
    `UPDATE voluntario vo SET status_aptidao = $2, ultima_atualizacao = NOW()
       FROM base_user u
      WHERE vo.user_id = $1 AND u.id = vo.user_id AND ${escopo}
        AND vo.status_aptidao = 'Pendente' AND vo.certificado_url IS NOT NULL`, params);
  if (rowCount === 0) return res.status(404).json({ erro: 'Certificado pendente não encontrado' });

  res.json({ mensagem: status === 'Apto' ? 'Voluntário marcado como apto' : 'Certificado reprovado' });
});

module.exports = router;