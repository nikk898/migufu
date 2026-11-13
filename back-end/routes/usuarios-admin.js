const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middlewares/auth');
const { escopoPorPerfil } = require('../utils/escopo');
const v = require('../utils/validacao');
const { enviarAvisoNovoCertificado } = require('../services/email');

/*
 * Rotas das telas "Usuários cadastrados" do Admin (todas só enxergam a instituição dele):
 *
 *   GET    /api/admin/usuarios?tipo=voluntario|estudante[&status=]
 *            admin-usuarios-voluntarios.html / admin-usuarios-estudantes.html
 *            Devolve os usuários para os cards, já com o "id" (o card leva para ?id=<id>).
 *            status (opcional)  voluntario: apto | nao_apto | vinculado | pendente
 *                               estudante:  vinculado | sem_vinculo
 *   PUT    /api/admin/usuarios/:id/certificado-pendente
 *            Menu "⋮" do card do voluntário: volta o voluntário para "Pendente" na validação.
 *   DELETE /api/admin/usuarios/:id
 *            Lixeira do card: remove o usuário e tudo que depende dele (em cascata).
 *
 * Mestre não usa estas rotas (tem a própria tela, com todas as instituições).
 */

// Onde ficam os certificados quando certificado_url guarda só o nome do arquivo
// (a mesma pasta que o admin.js usa para baixar). Se for um link http/https, não há arquivo.
const PASTA_CERTIFICADOS = path.join(__dirname, '..', 'uploads', 'certificados');

const STATUS_VOLUNTARIO = ['apto', 'nao_apto', 'vinculado', 'pendente'];
const STATUS_ESTUDANTE = ['vinculado', 'sem_vinculo'];

const formatarCpf = (c) => (c && /^\d{11}$/.test(c)
  ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : (c || ''));

// Ids que o FiltroPreferencias do front usa para os idiomas do banco
// (o mesmo critério do routes/associar.js: só o Mandarim muda).
const ID_IDIOMA = { Mandarim: 'chines-mandarim' };
const idIdioma = (idioma) => ID_IDIOMA[idioma] || idioma.toLowerCase();

// Junta idiomas ({ frances: 'nativo' }) e interesses (['Parques']) em cada pessoa,
// no formato estruturado que o FiltroPreferencias usa para filtrar no front.
async function completar(pessoas) {
  for (const p of pessoas) { p.idiomas = {}; p.interesses = []; }
  if (!pessoas.length) return pessoas;

  const ids = pessoas.map((p) => p.id);
  const idiomas = await db.query(
    `SELECT usuario_id, idioma::text AS idioma, lower(nivel::text) AS nivel
       FROM usuario_idioma WHERE usuario_id = ANY($1)`, [ids]);
  const interesses = await db.query(
    `SELECT x.usuario_id, i.nome FROM usuario_interesse x
       JOIN interesse i ON i.id = x.interesse_id
      WHERE x.usuario_id = ANY($1) ORDER BY i.nome`, [ids]);

  const porId = new Map(pessoas.map((p) => [p.id, p]));
  for (const r of idiomas.rows) porId.get(r.usuario_id).idiomas[idIdioma(r.idioma)] = r.nivel;
  for (const r of interesses.rows) porId.get(r.usuario_id).interesses.push(r.nome);
  return pessoas;
}

const router = express.Router();

// Vale para o arquivo inteiro: precisa estar logado e ser Admin.
router.use(autenticar, autorizar('Admin'));

// Como aqui há exclusão, a instituição do Admin é lida do banco (e não do token),
// para refletir uma troca feita depois do login (igual ao /api/admin/resumo).
router.use(async (req, res, next) => {
  const { rows } = await db.query(
    'SELECT id_instituicao FROM base_user WHERE id = $1 AND ativo', [req.usuario.id]);
  if (!rows[0]) return res.status(401).json({ erro: 'Sessão inválida' });
  if (rows[0].id_instituicao == null) {
    return res.status(403).json({ erro: 'Administrador sem instituição vinculada' });
  }
  req.admin = { ...req.usuario, id_instituicao: rows[0].id_instituicao };
  next();
});

// ----------------------------------------------------------------------
// GET /api/admin/usuarios?tipo=voluntario&status=apto
// Cada item: { id, tipo, nome, email, cpf, curso, genero, interesses: [...],
//              idiomas: { frances: 'nativo' }, status }
// "status" é o que o chip do card mostra e o que o filtro de situação usa:
//   voluntário: vinculado (tem vínculo ativo) > apto > nao_apto > pendente (certificado em análise)
//   estudante:  vinculado (tem vínculo ativo) | sem_vinculo
// ----------------------------------------------------------------------
router.get('/', async (req, res) => {
  const tipo = req.query.tipo;
  if (tipo !== 'voluntario' && tipo !== 'estudante') {
    throw new v.ErroHttp(400, "Informe tipo: 'voluntario' ou 'estudante'");
  }

  let status = null;
  if (req.query.status !== undefined && req.query.status !== 'todos') {
    const permitidos = tipo === 'voluntario' ? STATUS_VOLUNTARIO : STATUS_ESTUDANTE;
    if (typeof req.query.status !== 'string' || !permitidos.includes(req.query.status)) {
      throw new v.ErroHttp(400, 'Status inválido');
    }
    status = req.query.status;
  }

  const params = [];
  const escopo = escopoPorPerfil(req.admin, 'u', params);
  params.push(status);
  const pStatus = `$${params.length}`;

  // Os trechos entre ${} vêm do código (nunca do usuário); os valores vão por parâmetro.
  const base = tipo === 'voluntario'
    ? `SELECT u.id, u.nome_completo AS nome, u.email, vo.cpf,
              COALESCE(vo.curso, 'Não se aplica') AS curso, u.genero,
              CASE WHEN EXISTS (SELECT 1 FROM vinculo_migufu vm
                                 WHERE vm.voluntario_id = u.id AND vm.ativo) THEN 'vinculado'
                   WHEN vo.status_aptidao = 'Apto' THEN 'apto'
                   WHEN vo.status_aptidao = 'Nao Apto' THEN 'nao_apto'
                   ELSE 'pendente' END AS status
         FROM base_user u JOIN voluntario vo ON vo.user_id = u.id
        WHERE u.ativo AND u.perfil = 'Voluntario' AND ${escopo}`
    : `SELECT u.id, u.nome_completo AS nome, u.email, e.cpf,
              COALESCE(e.curso, 'Não se aplica') AS curso, u.genero,
              CASE WHEN EXISTS (SELECT 1 FROM vinculo_migufu vm
                                 WHERE vm.estudante_internacional_id = u.id AND vm.ativo)
                   THEN 'vinculado' ELSE 'sem_vinculo' END AS status
         FROM base_user u JOIN estudante_internacional e ON e.usuario_id = u.id
        WHERE u.ativo AND u.perfil = 'Internacional' AND ${escopo}`;

  const { rows } = await db.query(
    `SELECT t.* FROM (${base}) t
      WHERE (${pStatus}::text IS NULL OR t.status = ${pStatus}::text)
      ORDER BY t.nome, t.id`,
    params
  );

  // CPF formatado como o front espera (estudante com passaporte não tem CPF: vem "").
  const itens = rows.map((r) => ({ ...r, tipo, cpf: formatarCpf(r.cpf), genero: r.genero || '' }));
  res.json(await completar(itens));
});

// ----------------------------------------------------------------------
// GET /api/admin/usuarios/:id
// Retorna os dados completos de um voluntário ou estudante internacional
// para a tela admin-usuario.html?id=...
// ----------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const id = v.idPositivo(req.params.id, 'Id');
  const params = [id];
  const escopo = escopoPorPerfil(req.admin, 'u', params);

  const { rows } = await db.query(
    `SELECT u.id, u.nome_completo AS nome, u.email, u.telefone, u.genero,
            u.perfil, u.ativo, u.data_criacao,
            vo.cpf AS voluntario_cpf, vo.vinculo AS tipo_vinculo,
            vo.curso AS voluntario_curso, vo.periodo AS voluntario_periodo,
            vo.status_aptidao, vo.certificado_url, vo.data_envio_certificado,
            vo.disponivel, vo.sobre_mim AS voluntario_bio,
            vo.expectativas_do_curso AS voluntario_expectativas,
            e.cpf AS estudante_cpf, e.passaporte, e.matricula,
            e.pais_origem, e.curso AS estudante_curso,
            e.periodo AS estudante_periodo, e.idioma_site,
            e.sobre_mim AS estudante_bio,
            e.expectativas_do_curso AS estudante_expectativas,
            c.nome AS campus, i.nome AS instituicao,
            CASE WHEN u.perfil = 'Voluntario' THEN
              EXISTS (SELECT 1 FROM vinculo_migufu vm WHERE vm.voluntario_id = u.id AND vm.ativo)
              ELSE EXISTS (SELECT 1 FROM vinculo_migufu vm WHERE vm.estudante_internacional_id = u.id AND vm.ativo)
            END AS possui_vinculo_ativo
       FROM base_user u
       LEFT JOIN voluntario vo ON vo.user_id = u.id
       LEFT JOIN estudante_internacional e ON e.usuario_id = u.id
       LEFT JOIN campus c ON c.id = COALESCE(vo.campus_id, e.campus_id)
       LEFT JOIN instituicao i ON i.id = u.id_instituicao
      WHERE u.id = $1 AND u.ativo AND u.perfil IN ('Voluntario', 'Internacional')
        AND ${escopo}`,
    params
  );

  const usuario = rows[0];
  // 404 também para IDs de outra instituição.
  if (!usuario) throw new v.ErroHttp(404, 'Usuário não encontrado');

  const [idiomas, interesses, vinculos] = await Promise.all([
    db.query(
      `SELECT idioma::text AS idioma, nivel::text AS nivel
         FROM usuario_idioma WHERE usuario_id = $1 ORDER BY idioma`, [id]),
    db.query(
      `SELECT i.id, i.nome FROM usuario_interesse ui
         JOIN interesse i ON i.id = ui.interesse_id
        WHERE ui.usuario_id = $1 ORDER BY i.nome`, [id]),
    db.query(
      `SELECT vm.id, vm.ativo, vm.data_inicio, vm.data_fim,
              CASE WHEN vm.voluntario_id = $1 THEN ei.nome_completo ELSE vo.nome_completo END AS outra_pessoa,
              CASE WHEN vm.voluntario_id = $1 THEN vm.estudante_internacional_id ELSE vm.voluntario_id END AS outro_usuario_id
         FROM vinculo_migufu vm
         LEFT JOIN base_user vo ON vo.id = vm.voluntario_id
         LEFT JOIN base_user ei ON ei.id = vm.estudante_internacional_id
        WHERE vm.voluntario_id = $1 OR vm.estudante_internacional_id = $1
        ORDER BY vm.ativo DESC, vm.data_inicio DESC`, [id])
  ]);

  const voluntario = usuario.perfil === 'Voluntario';
  const cpf = voluntario ? usuario.voluntario_cpf : usuario.estudante_cpf;
  const curso = voluntario ? usuario.voluntario_curso : usuario.estudante_curso;
  const periodo = voluntario ? usuario.voluntario_periodo : usuario.estudante_periodo;
  const bio = voluntario ? usuario.voluntario_bio : usuario.estudante_bio;
  const expectativas = voluntario ? usuario.voluntario_expectativas : usuario.estudante_expectativas;

  res.json({
    id: usuario.id,
    tipo: voluntario ? 'voluntario' : 'estudante',
    perfil: usuario.perfil,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone || '',
    genero: usuario.genero || '',
    documento: formatarCpf(cpf) || usuario.passaporte || '',
    cpf: formatarCpf(cpf),
    passaporte: usuario.passaporte || '',
    matricula: usuario.matricula || '',
    pais: usuario.pais_origem || '',
    vinculo: voluntario ? (usuario.tipo_vinculo || 'Voluntário') : 'Estudante internacional',
    curso: curso || '',
    periodo: periodo == null ? '' : `${periodo}º Período`,
    campus: usuario.campus || '',
    instituicao: usuario.instituicao || '',
    idiomas: idiomas.rows,
    interesses: interesses.rows.map((x) => x.nome),
    sobreMim: bio || '',
    expectativas: expectativas || '',
    statusAptidao: usuario.status_aptidao || '',
    certificadoUrl: usuario.certificado_url || '',
    dataEnvioCertificado: usuario.data_envio_certificado,
    disponivel: usuario.disponivel,
    possuiVinculoAtivo: usuario.possui_vinculo_ativo,
    vinculos: vinculos.rows,
    ativo: usuario.ativo,
    dataCriacao: usuario.data_criacao,
  });
});

// ----------------------------------------------------------------------
// PUT /api/admin/usuarios/:id/certificado-pendente   (menu "⋮" do voluntário)
// Coloca o voluntário como "Pendente" de novo. Se ele já enviou o certificado, volta para a
// fila do admin-validacao.html; se ainda não enviou, fica Pendente até enviar.
// ----------------------------------------------------------------------
router.put('/:id/certificado-pendente', async (req, res) => {
  const id = v.idPositivo(req.params.id);

  const params = [id];
  const escopo = escopoPorPerfil(req.admin, 'u', params);
  const { rows } = await db.query(
    `UPDATE voluntario vo
        SET status_aptidao = 'Pendente', ultima_atualizacao = NOW()
       FROM base_user u
      WHERE vo.user_id = $1 AND u.id = vo.user_id AND u.perfil = 'Voluntario' AND ${escopo}
      RETURNING (vo.certificado_url IS NOT NULL) AS tem_certificado`,
    params
  );
  // 404 também para voluntário de outra instituição (não revela que o id existe)
  if (rows.length === 0) throw new v.ErroHttp(404, 'Voluntário não encontrado');

  // Busca os dados de contato depois de atualizar o status.
  const { rows: destinatarios } = await db.query(
    `SELECT u.nome_completo AS nome, u.email
       FROM base_user u
       JOIN voluntario vo ON vo.user_id = u.id
      WHERE u.id = $1 AND u.perfil = 'Voluntario'`,
    [id]
  );

  let emailEnviado = false;
  let avisoEmail = null;

  try {
    await enviarAvisoNovoCertificado({ para: destinatarios[0] });
    emailEnviado = true;
  } catch (err) {
    // A mudança de status permanece válida mesmo se o provedor de e-mail estiver indisponível.
    console.error('Falha ao enviar pedido de novo certificado:', err.message);
    avisoEmail = 'O certificado foi marcado como pendente, mas o e-mail não pôde ser enviado.';
  }

  res.json({
    mensagem: rows[0].tem_certificado
      ? 'Certificado colocado como pendente de validação'
      : 'Voluntário marcado como pendente (ainda não enviou o certificado)',
    tem_certificado: rows[0].tem_certificado,
    email_enviado: emailEnviado,
    aviso_email: avisoEmail,
  });
});

// Apaga o arquivo do certificado (se for um arquivo nosso). Nunca derruba a exclusão.
async function apagarCertificado(url) {
  if (!url || /^https?:\/\//i.test(String(url))) return;   // link externo: não há arquivo no disco
  try {
    // path.basename impede sair da pasta (ex.: "../../.env")
    await fs.unlink(path.join(PASTA_CERTIFICADOS, path.basename(String(url))));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Falha ao apagar o certificado:', err.message);
  }
}

// ----------------------------------------------------------------------
// DELETE /api/admin/usuarios/:id   (lixeira do card; só voluntário ou estudante)
// Remove o usuário do sistema por completo, tudo numa transação (ou apaga tudo, ou nada):
//   1) vínculos dele (FK RESTRICT: a exclusão ficaria travada)
//   2) chamados de suporte dele (FK RESTRICT)
//   3) o usuário. As tabelas voluntario / estudante_internacional / usuario_idioma /
//      usuario_interesse / token_recuperar_senha têm ON DELETE CASCADE e saem junto.
//   4) depois de confirmar no banco, o arquivo do certificado (se houver).
// ----------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const id = v.idPositivo(req.params.id);

  const resultado = await db.transacao(async (c) => {
    const params = [id];
    const escopo = escopoPorPerfil(req.admin, 'u', params);
    // Admin e Mestre nunca saem por aqui, e usuário de outra instituição não é encontrado.
    const alvo = await c.query(
      `SELECT u.id, vo.certificado_url
         FROM base_user u LEFT JOIN voluntario vo ON vo.user_id = u.id
        WHERE u.id = $1 AND u.perfil IN ('Voluntario', 'Internacional') AND ${escopo}
          FOR UPDATE OF u`,
      params
    );
    if (alvo.rows.length === 0) throw new v.ErroHttp(404, 'Usuário não encontrado');

    const vinculos = await c.query(
      'DELETE FROM vinculo_migufu WHERE voluntario_id = $1 OR estudante_internacional_id = $1', [id]);
    const mensagens = await c.query('DELETE FROM mensagem_suporte WHERE usuario_id = $1', [id]);
    await c.query('DELETE FROM base_user WHERE id = $1', [id]);

    return {
      certificado: alvo.rows[0].certificado_url,
      vinculos: vinculos.rowCount,
      mensagens: mensagens.rowCount,
    };
  });

  await apagarCertificado(resultado.certificado);

  res.json({
    mensagem: 'Usuário removido',
    vinculos_removidos: resultado.vinculos,
    chamados_removidos: resultado.mensagens,
  });
});

module.exports = router;