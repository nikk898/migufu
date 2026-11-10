const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { autenticar } = require('../middlewares/auth');
const { limiteRedefinir } = require('../middlewares/limites');
const v = require('../utils/validacao');
const { resolverCampus, vincularInteresses, idiomasTexto } = require('../utils/dados');

const router = express.Router();
router.use(autenticar);

const vazioOuTexto = (x, campo, max) =>
  x === undefined ? null : (v.texto(x, campo, { max, obrigatorio: false }) ?? '');

// ---------- GET: carregar o perfil do usuário logado ----------
router.get('/', async (req, res) => {
  const id = req.usuario.id;
  const base = await db.query(
    `SELECT id, nome_completo AS nome, email, telefone, genero, perfil
       FROM base_user WHERE id = $1 AND ativo`,
    [id]
  );
  const u = base.rows[0];
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const extra = u.perfil === 'Voluntario'
    ? await db.query(
        `SELECT vo.cpf, vo.vinculo, vo.curso, vo.periodo, c.nome AS campus,
                vo.sobre_mim AS bio, vo.expectativas_do_curso AS expectativas,
                vo.status_aptidao, vo.disponivel
           FROM voluntario vo LEFT JOIN campus c ON c.id = vo.campus_id
          WHERE vo.user_id = $1`, [id])
    : await db.query(
        `SELECT e.matricula, e.cpf, e.passaporte, e.pais_origem, e.curso, c.nome AS campus,
                e.idioma_site, e.sobre_mim AS bio, e.expectativas_do_curso AS expectativas
           FROM estudante_internacional e JOIN campus c ON c.id = e.campus_id
          WHERE e.usuario_id = $1`, [id]);

  const idiomas = await db.query('SELECT idioma, nivel FROM usuario_idioma WHERE usuario_id = $1', [id]);
  const interesses = await db.query(
    `SELECT i.id, i.nome FROM usuario_interesse ui
       JOIN interesse i ON i.id = ui.interesse_id WHERE ui.usuario_id = $1 ORDER BY i.nome`, [id]);

  res.json({ ...u, ...extra.rows[0], idiomas: idiomas.rows, interesses: interesses.rows });
});

// ---------- PUT: alterar informações (campos não enviados ficam como estão) ----------
// E-mail, CPF, matrícula e perfil NÃO podem ser alterados por aqui.
router.put('/', async (req, res) => {
  const b = req.body;
  const id = req.usuario.id;
  const nome = b.nome === undefined ? null : v.texto(b.nome, 'Nome', { min: 3, max: 200 });
  const tel = b.telefone === undefined ? null : v.telefone(b.telefone);
  const genero = b.genero === undefined ? null : v.texto(b.genero, 'Gênero', { max: 30 });
  const curso = b.curso === undefined ? null : v.texto(b.curso, 'Curso', { max: 50 });
  const periodo = b.periodo === undefined ? null : v.periodo(b.periodo);
  const bio = vazioOuTexto(b.bio, 'Sobre mim', 500);
  const expectativas = vazioOuTexto(b.expectativas, 'Expectativas', 2000);
  const disponivel = typeof b.disponivel === 'boolean' ? b.disponivel : null;
  const pais = b.pais === undefined ? null : v.texto(b.pais, 'País de origem', { max: 100 });
  const matricula = b.matricula === undefined ? null : v.texto(b.matricula, 'Matrícula', { max: 50 });

  await db.transacao(async (c) => {
    const campusId = b.campus === undefined ? null : (await resolverCampus(c, b.campus)).id;
    const u = await c.query(
      `UPDATE base_user
          SET nome_completo = COALESCE($2, nome_completo),
              telefone = COALESCE($3, telefone),
              genero = COALESCE($4, genero),
              ultima_atualizacao = now()
        WHERE id = $1 AND ativo RETURNING perfil`,
      [id, nome, tel, genero]
    );
    if (!u.rows[0]) throw new v.ErroHttp(404, 'Usuário não encontrado');

    if (u.rows[0].perfil === 'Voluntario') {
      await c.query(
        `UPDATE voluntario
            SET curso = COALESCE($2, curso), periodo = COALESCE($3, periodo),
                campus_id = COALESCE($4, campus_id), sobre_mim = COALESCE($5, sobre_mim),
                expectativas_do_curso = COALESCE($6, expectativas_do_curso),
                disponivel = COALESCE($7, disponivel), ultima_atualizacao = now()
          WHERE user_id = $1`,
        [id, curso, periodo, campusId, bio, expectativas, disponivel]
      );
    } else if (u.rows[0].perfil === 'Internacional') {
        await c.query(
        `UPDATE estudante_internacional
            SET curso = COALESCE($2, curso), campus_id = COALESCE($3, campus_id),
                sobre_mim = COALESCE($4, sobre_mim),
                expectativas_do_curso = COALESCE($5, expectativas_do_curso),
                pais_origem = COALESCE($6, pais_origem), matricula = COALESCE($7, matricula),
                ultima_atualizacao = now()
          WHERE usuario_id = $1`,
        [id, curso, campusId, bio, expectativas, pais, matricula]
      );
    }
  });
  res.json({ mensagem: 'Perfil atualizado' });
});

// ---------- IDIOMAS: POST (adiciona ou atualiza nível) e DELETE ----------
router.post('/idiomas', async (req, res) => {
  const idioma = v.enumerado(req.body.idioma, v.IDIOMAS, 'Idioma');
  const nivel = v.enumerado(req.body.nivel, v.NIVEIS, 'Nível');
  await db.query(
    `INSERT INTO usuario_idioma (usuario_id, idioma, nivel) VALUES ($1, $2, $3)
     ON CONFLICT (usuario_id, idioma) DO UPDATE SET nivel = EXCLUDED.nivel`,
    [req.usuario.id, idioma, nivel]
  );
  res.status(201).json({ idioma, nivel });
});

router.delete('/idiomas/:idioma', async (req, res) => {
  const idioma = v.enumerado(req.params.idioma, v.IDIOMAS, 'Idioma');
  const r = await db.query(
    'DELETE FROM usuario_idioma WHERE usuario_id = $1 AND idioma = $2',
    [req.usuario.id, idioma]
  );
  if (!r.rowCount) return res.status(404).json({ erro: 'Idioma não encontrado' });
  res.status(204).end();
});

// ---------- INTERESSES: POST ({ interesses: [...] }) e DELETE por id ----------
router.post('/interesses', async (req, res) => {
  const lista = v.listaInteresses(req.body.interesses);
  if (!lista.length) throw new v.ErroHttp(400, 'Informe ao menos um interesse');
  await db.transacao(async (c) => {
    await vincularInteresses(c, req.usuario.id, lista);
    const n = await c.query('SELECT count(*)::int AS n FROM usuario_interesse WHERE usuario_id = $1', [req.usuario.id]);
    if (n.rows[0].n > 20) throw new v.ErroHttp(400, 'Limite de 20 interesses');
  });
  res.status(201).json({ interesses: lista });
});

router.delete('/interesses/:id', async (req, res) => {
  const r = await db.query(
    'DELETE FROM usuario_interesse WHERE usuario_id = $1 AND interesse_id = $2',
    [req.usuario.id, v.idPositivo(req.params.id, 'Interesse')]
  );
  if (!r.rowCount) return res.status(404).json({ erro: 'Interesse não encontrado' });
  res.status(204).end();
});

// ---------- SENHA: PUT { senha_atual, nova_senha } ----------
router.put('/senha', limiteRedefinir, async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  if (typeof senha_atual !== 'string' || !senha_atual) throw new v.ErroHttp(400, 'Informe a senha atual');
  v.senhaForte(nova_senha);
  if (senha_atual === nova_senha) throw new v.ErroHttp(400, 'A nova senha deve ser diferente da atual');

  const r = await db.query('SELECT senha_hash FROM base_user WHERE id = $1 AND ativo', [req.usuario.id]);
  const hash = r.rows[0]?.senha_hash;
  if (!hash) throw new v.ErroHttp(400, 'Defina sua senha pela opção "Esqueci minha senha"');
  if (!(await bcrypt.compare(senha_atual, hash))) throw new v.ErroHttp(400, 'Senha atual incorreta');

  const novoHash = await bcrypt.hash(nova_senha, 12);
  await db.transacao(async (c) => {
    await c.query('UPDATE base_user SET senha_hash = $2, ultima_atualizacao = now() WHERE id = $1', [req.usuario.id, novoHash]);
    // invalida links de recuperação pendentes
    await c.query('UPDATE token_recuperar_senha SET usado_em = now() WHERE usuario_id = $1 AND usado_em IS NULL', [req.usuario.id]);
  });
  res.json({ mensagem: 'Senha alterada' });
});

// ---------- PERFIL PÚBLICO: GET /api/perfil/publico/:id ----------
// Só o próprio dono, admins ou quem tem vínculo ativo (migufu) com a pessoa podem ver.
router.get('/publico/:id', async (req, res) => {
  const alvo = v.idPositivo(req.params.id, 'Id');
  const meuId = Number(req.usuario.id);
  if (alvo !== meuId && !['Admin', 'Mestre'].includes(req.usuario.perfil)) {
    const vinc = await db.query(
      `SELECT 1 FROM vinculo_migufu
        WHERE ativo AND ((voluntario_id = $1 AND estudante_internacional_id = $2)
                      OR (voluntario_id = $2 AND estudante_internacional_id = $1))`,
      [meuId, alvo]
    );
    if (!vinc.rowCount) throw new v.ErroHttp(404, 'Perfil não encontrado');
  }

  const p = await db.query(
    `SELECT b.id, b.nome_completo AS nome, b.perfil,
            COALESCE(vo.sobre_mim, ei.sobre_mim) AS bio,
            COALESCE(vo.curso, ei.curso) AS curso,
            vo.periodo, ei.pais_origem, c.nome AS campus
       FROM base_user b
       LEFT JOIN voluntario vo ON vo.user_id = b.id
       LEFT JOIN estudante_internacional ei ON ei.usuario_id = b.id
       LEFT JOIN campus c ON c.id = COALESCE(vo.campus_id, ei.campus_id)
      WHERE b.id = $1 AND b.ativo`,
    [alvo]
  );
  if (!p.rows[0]) throw new v.ErroHttp(404, 'Perfil não encontrado');

  const interesses = await db.query(
    `SELECT i.nome FROM usuario_interesse ui JOIN interesse i ON i.id = ui.interesse_id
      WHERE ui.usuario_id = $1 ORDER BY i.nome`, [alvo]);
  const idiomas = await db.query('SELECT idioma, nivel FROM usuario_idioma WHERE usuario_id = $1', [alvo]);

  const x = p.rows[0];
  res.json({
    id: x.id,
    nome: x.nome,
    tipo: x.perfil === 'Internacional' ? 'estudante' : 'voluntario',
    bio: x.bio,
    curso: x.curso,
    campus: x.campus,
    pais: x.pais_origem,
    idiomas: idiomasTexto(idiomas.rows),
    interesses: interesses.rows.map((i) => i.nome),
  });
});

module.exports = router;