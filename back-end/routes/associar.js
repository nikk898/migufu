/*
 * ROTAS DE ASSOCIAÇÃO (vínculos entre voluntário e estudante internacional)
 *
 * Rotas (todas só para Admin/Mestre; o Admin vê só a própria instituição):
 *   GET  /api/associar/estudantes/:id                       estudante + vínculos ativos
 *   GET  /api/associar/voluntarios                          voluntários aptos e disponíveis
 *   POST /api/associar/vinculos              body: { voluntario_id, estudante_id } + e-mail
 *   POST /api/associar/vinculos/:id/desvincular   marca ativo = false (não apaga) + e-mail
 *
 * O comentário abaixo resume a regra de negócio do documento do grupo e o que
 * ainda precisa ser decidido. Os itens 1, 2 e 4 já seguem o padrão sugerido.
 *
 * ---------------------------------------------------------------------------
 * O QUE O DOCUMENTO DE REGRA DE NEGÓCIO CONFIRMA
 * ---------------------------------------------------------------------------
 * - Só o admin cria vínculos. Não há candidatura nem autoatendimento: o admin
 *   escolhe um estudante internacional e associa um voluntário com base nas
 *   características dos dois.
 * - Aptidão: o voluntário envia o certificado do curso (Moodle) e só o admin muda
 *   voluntario.status_aptidao para 'Apto' ou 'Nao Apto'. As colunas certificado_url
 *   e data_envio_certificado já existem.
 * - Múltiplos vínculos: voluntário e estudante podem ter mais de um Migufu. O banco
 *   já permite isso; a única trava é o mesmo par ativo duplicado (uq_vinculo_ativo).
 * - O admin pode: listar voluntários disponíveis e estudantes que querem Migufu,
 *   marcar apto/não apto, associar, ver quem já tem Migufu e desvincular.
 * - O Mestre: adiciona, edita, pausa e remove instituições.
 * - Voluntário e estudante editam o próprio formulário a qualquer momento, e o
 *   voluntário tem uma área de suporte que envia e-mail aos admins.
 * - Matching: usa idiomas (usuario_idioma), interesses (usuario_interesse),
 *   sobre_mim e expectativas_do_curso. O banco já tem tabelas e colunas para isso.
 *
 * ---------------------------------------------------------------------------
 * EM ABERTO (padrão sugerido; CONFIRMAR COM O GRUPO antes de implementar)
 * ---------------------------------------------------------------------------
 * 1. Mesma instituição: o documento não diz se o admin pode ligar pessoas de
 *    instituições diferentes. Sugestão: exigir que voluntário, estudante e admin
 *    sejam da mesma instituição (base_user.id_instituicao).
 * 2. Condições para vincular: sugestão de exigir voluntário com
 *    status_aptidao = 'Apto' e disponivel = true.
 * 3. Limite de vínculos: o documento diz "mais de um", sem dizer quantos.
 *    Sugestão: sem limite no código, só a trava do par duplicado; deixar uma
 *    constante fácil de mudar caso o grupo defina um teto.
 * 4. Desvincular: sugestão de marcar ativo = false e data_fim = agora, com
 *    motivo_saida opcional. Não apagar a linha, para manter o histórico.
 * 5. O que cada lado vê do outro: o documento não fala. Sugestão: nome, e-mail,
 *    telefone, curso, idiomas, sobre_mim e expectativas_do_curso; esconder CPF
 *    e matrícula.
 * 6. Remover instituição: o banco usa ON DELETE RESTRICT, então não dá para apagar
 *    uma instituição que tenha campus ou usuários. Na prática, "remover" seria
 *    pausar (instituicao.ativa = false).
 * 7. Envio do certificado: hoje só existe a coluna de URL. Falta decidir se o
 *    voluntário cola um link ou envia o arquivo (exigiria o Supabase Storage).
 * 8. "Admin alerta o voluntário" sobre dado incorreto: sugestão de tratar como
 *    e-mail pelo Brevo (ainda não implementado).
 *
 * ---------------------------------------------------------------------------
 * COMO USAR A AUTENTICAÇÃO JÁ PRONTA
 * ---------------------------------------------------------------------------
 * - const { autenticar, autorizar } = require('../middlewares/auth');
 * - autenticar preenche req.usuario com { id, perfil, id_instituicao }.
 * - autorizar('Admin') barra quem não tem o perfil. Perfis: Mestre, Admin,
 *   Voluntario, Internacional.
 * - O middleware só diz QUEM é o usuário e o perfil dele. A restrição de dados
 *   precisa estar no WHERE da consulta SQL:
 *     Admin:                    id_instituicao = req.usuario.id_instituicao
 *     Voluntario/Internacional: só vínculos em vinculo_migufu onde ele participa
 * - Use sempre $1, $2 nas consultas (nunca concatenar texto do usuário no SQL).
 * 
 *  * ---------------------------------------------------------------------------
 * ERROS E VALIDAÇÃO (já prontos no app.js)
 * ---------------------------------------------------------------------------
 * - Erros inesperados caem no tratador central (resposta 500 "Erro interno"); o
 *   detalhe só aparece no log do servidor. No Express 5, um erro lançado em rota
 *   async já é encaminhado para esse tratador.
 * - req.body nunca é undefined (o app.js garante {}), mas valide o TIPO dos campos
 *   (ex.: typeof campo === 'string') e o tamanho antes de gravar no banco.
 * - Para ativar este arquivo, descomente a linha correspondente em app.js.
 * 
 *  * - Para restringir dados por perfil, use utils/escopo.js:
 *   escopoPorPerfil (consultas em base_user), escopoVinculos (vinculo_migufu) e
 *   podeAcessarUsuario (rotas com :id). Detalhes no comentário daquele arquivo.
 */

const express = require('express');
const pool = require('../database');
const { autenticar, autorizar } = require('../middlewares/auth');
const { escopoPorPerfil } = require('../utils/escopo');
const { enviarAvisoVinculo, enviarAvisoDesvinculo } = require('../services/email');

const router = express.Router();

// Vale para o arquivo inteiro: precisa estar logado e ser Admin ou Mestre.
// O Admin só enxerga pessoas da própria instituição (escopoPorPerfil, nas consultas).
router.use(autenticar, autorizar('Admin', 'Mestre'));

// Ids que o FiltroPreferencias do front usa para os idiomas do banco.
// Quase todos são o nome em minúsculas; só o Mandarim muda ("Chinês (Mandarim)" no front).
const ID_IDIOMA = { Mandarim: 'chines-mandarim' };
const idIdioma = (idioma) => ID_IDIOMA[idioma] || idioma.toLowerCase();

function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Junta idiomas ({ frances: 'nativo' }) e interesses (['Parques']) em cada pessoa
// (formato estruturado, que o FiltroPreferencias do front usa para filtrar)
async function completar(pessoas) {
  for (const p of pessoas) { p.idiomas = {}; p.interesses = []; }
  if (!pessoas.length) return pessoas;

  const ids = pessoas.map((p) => p.id);
  const idiomas = await pool.query(
    `SELECT usuario_id, idioma::text AS idioma, lower(nivel::text) AS nivel
       FROM usuario_idioma WHERE usuario_id = ANY($1)`, [ids]);
  const interesses = await pool.query(
    `SELECT x.usuario_id, i.nome FROM usuario_interesse x
       JOIN interesse i ON i.id = x.interesse_id
      WHERE x.usuario_id = ANY($1) ORDER BY i.nome`, [ids]);

  const achar = (id) => pessoas.find((p) => p.id === id);
  for (const r of idiomas.rows) achar(r.usuario_id).idiomas[idIdioma(r.idioma)] = r.nivel;
  for (const r of interesses.rows) achar(r.usuario_id).interesses.push(r.nome);
  return pessoas;
}

// E-mail não pode desfazer o vínculo: se o Brevo falhar, só registra no log
// e avisa o front (email_enviado: false).
async function tentarEnviar(promessa) {
  try {
    await promessa();
    return true;
  } catch (err) {
    console.error('Falha ao enviar e-mail:', err.message);
    return false;
  }
}

// GET /api/associar/estudantes/:id  (admin-associar.html?id=)
// Dados do estudante + quem já está vinculado a ele (vinculos)
router.get('/estudantes/:id', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'Id inválido' });

  const params = [id];
  const escopo = escopoPorPerfil(req.usuario, 'u', params);
  const est = await pool.query(
    `SELECT u.id, u.nome_completo AS nome, u.genero, e.curso
       FROM base_user u JOIN estudante_internacional e ON e.usuario_id = u.id
      WHERE u.id = $1 AND u.ativo AND ${escopo}`, params);
  // 404 também para estudante de outra instituição (não revela que o id existe)
  if (est.rows.length === 0) return res.status(404).json({ erro: 'Estudante não encontrado' });

  // Os vínculos voltam completos (idiomas e interesses) porque o voluntário pode
  // não estar mais na lista de disponíveis, e a tela precisa mostrá-lo para desvincular.
  const vinculos = await pool.query(
    `SELECT vm.id AS vinculo_id, v.id, v.nome_completo AS nome, v.genero,
            COALESCE(vo.curso, 'Não se aplica') AS curso
       FROM vinculo_migufu vm
       JOIN base_user v ON v.id = vm.voluntario_id
       JOIN voluntario vo ON vo.user_id = vm.voluntario_id
      WHERE vm.estudante_internacional_id = $1 AND vm.ativo
      ORDER BY vm.data_inicio`, [id]);

  const [estudante] = await completar(est.rows);
  estudante.vinculos = await completar(vinculos.rows);
  res.json(estudante);
});

// GET /api/associar/voluntarios  (admin-associar.html)
// Voluntários que podem ser MIGUFU: ativos, aptos e disponíveis.
// Cada um: { id, nome, genero, curso, idiomas: { frances: 'nativo' }, interesses: [...] }
router.get('/voluntarios', async (req, res) => {
  const params = [];
  const escopo = escopoPorPerfil(req.usuario, 'u', params);
  const { rows } = await pool.query(
    `SELECT u.id, u.nome_completo AS nome, u.genero, COALESCE(v.curso, 'Não se aplica') AS curso
       FROM base_user u JOIN voluntario v ON v.user_id = u.id
      WHERE u.perfil = 'Voluntario' AND u.ativo
        AND v.status_aptidao = 'Apto' AND v.disponivel
        AND ${escopo}
      ORDER BY u.nome_completo`, params);
  res.json(await completar(rows));
});

// POST /api/associar/vinculos    body: { voluntario_id, estudante_id }  (botão VINCULAR)
// Cria o vínculo e manda e-mail ao voluntário com o link do site.
router.post('/vinculos', async (req, res) => {
  const voluntarioId = idValido(req.body.voluntario_id);
  const estudanteId = idValido(req.body.estudante_id);
  if (!voluntarioId || !estudanteId) {
    return res.status(400).json({ erro: 'Informe voluntario_id e estudante_id' });
  }

  // O estudante existe e está no escopo do admin?
  const pEst = [estudanteId];
  const escopoEst = escopoPorPerfil(req.usuario, 'u', pEst);
  const est = await pool.query(
    `SELECT u.nome_completo AS nome
       FROM base_user u JOIN estudante_internacional e ON e.usuario_id = u.id
      WHERE u.id = $1 AND u.ativo AND ${escopoEst}`, pEst);
  if (est.rowCount === 0) return res.status(404).json({ erro: 'Estudante não encontrado' });

  // O voluntário está no escopo e pode ser MIGUFU (apto e disponível)?
  const pVol = [voluntarioId];
  const escopoVol = escopoPorPerfil(req.usuario, 'u', pVol);
  const vol = await pool.query(
    `SELECT u.nome_completo AS nome, u.email, v.status_aptidao, v.disponivel
       FROM base_user u JOIN voluntario v ON v.user_id = u.id
      WHERE u.id = $1 AND u.ativo AND ${escopoVol}`, pVol);
  if (vol.rowCount === 0) return res.status(404).json({ erro: 'Voluntário não encontrado' });
  const voluntario = vol.rows[0];
  if (voluntario.status_aptidao !== 'Apto' || !voluntario.disponivel) {
    return res.status(400).json({ erro: 'Este voluntário não está apto ou disponível' });
  }

  let vinculoId;
  try {
    const { rows } = await pool.query(
      `INSERT INTO vinculo_migufu (voluntario_id, estudante_internacional_id, admin_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [voluntarioId, estudanteId, req.usuario.id]); // admin_id vem do token
    vinculoId = rows[0].id;
  } catch (err) {
    // 23505 = violou o uq_vinculo_ativo (esse par já tem vínculo ativo)
    if (err.code === '23505') return res.status(409).json({ erro: 'Já estão vinculados' });
    throw err;
  }

  const emailEnviado = await tentarEnviar(() => enviarAvisoVinculo({
    para: { email: voluntario.email, nome: voluntario.nome },
    estudante: est.rows[0].nome,
    link: process.env.URL_SITE || ''
  }));

  res.status(201).json({ vinculo_id: vinculoId, email_enviado: emailEnviado });
});

// POST /api/associar/vinculos/:id/desvincular  (botão DESVINCULAR)
// Não apaga a linha: marca ativo = false e data_fim, para guardar o histórico
// (a trava uq_vinculo_ativo só vale para vínculos ativos, então dá para vincular de novo).
// Manda e-mail avisando o voluntário.
router.post('/vinculos/:id/desvincular', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'Id inválido' });

  // O admin só desvincula quando o estudante é da instituição dele
  const params = [id];
  const escopo = escopoPorPerfil(req.usuario, 'u', params);
  const { rows } = await pool.query(
    `UPDATE vinculo_migufu vm SET ativo = FALSE, data_fim = NOW()
       FROM base_user u, base_user v
      WHERE vm.id = $1 AND vm.ativo
        AND u.id = vm.estudante_internacional_id AND ${escopo}
        AND v.id = vm.voluntario_id
      RETURNING v.nome_completo AS vol_nome, v.email AS vol_email, u.nome_completo AS est_nome`,
    params);
  if (rows.length === 0) return res.status(404).json({ erro: 'Vínculo não encontrado' });

  const r = rows[0];
  const emailEnviado = await tentarEnviar(() => enviarAvisoDesvinculo({
    para: { email: r.vol_email, nome: r.vol_nome },
    estudante: r.est_nome
  }));

  res.json({ mensagem: 'Vínculo encerrado', email_enviado: emailEnviado });
});

module.exports = router;
