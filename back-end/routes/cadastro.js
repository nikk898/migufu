const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { limiteCadastro } = require('../middlewares/limites');
const v = require('../utils/validacao');
const { resolverCampus, vincularInteresses } = require('../utils/dados');

const router = express.Router();
router.use(limiteCadastro);

const IDIOMA_SITE = new Map([['pt', 'Portugues'], ['en', 'Ingles'], ['es', 'Espanhol'], ['fr', 'Frances']]);

function lerComuns(b) {
  return {
    nome: v.texto(b.nome, 'Nome', { min: 3, max: 200 }),
    genero: v.texto(b.genero, 'Gênero', { max: 30 }),
    email: v.email(b.email),
    telefone: v.telefone(b.telefone),
    // Os formulários não têm campo de senha. Se o front mandar, é gravada; senão fica NULL.
    senha: b.senha === undefined ? null : v.senhaForte(b.senha),
    idiomas: v.listaIdiomas(b.idiomas),
    interesses: v.listaInteresses(b.interesses),
    bio: v.texto(b.bio, 'Sobre mim', { max: 500, obrigatorio: false }),
    expectativas: v.texto(b.expectativas, 'Expectativas', { max: 2000, obrigatorio: false }),
  };
}

// O perfil NUNCA vem do body: é definido aqui.
async function criarUsuario(c, d, perfil, campus) {
  const hash = d.senha ? await bcrypt.hash(d.senha, 12) : null;
  const { rows } = await c.query(
    `INSERT INTO base_user (id_instituicao, nome_completo, email, senha_hash, telefone, perfil, genero)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [campus.id_instituicao, d.nome, d.email, hash, d.telefone, perfil, d.genero]
  );
  const id = rows[0].id;
  for (const i of d.idiomas) {
    await c.query(
      'INSERT INTO usuario_idioma (usuario_id, idioma, nivel) VALUES ($1, $2, $3)',
      [id, i.idioma, i.nivel]
    );
  }
  await vincularInteresses(c, id, d.interesses);
  return id;
}

router.post('/estudante', async (req, res) => {
  const b = req.body;
  const d = lerComuns(b);
  const doc = v.documento(b.documento, true);
  const matricula = v.texto(b.matricula, 'Matrícula', { max: 50 });
  const pais = v.texto(b.pais, 'País de origem', { max: 100 });
  const curso = v.texto(b.curso, 'Curso', { max: 100 });
  const periodoEst = v.periodo(b.periodo);
  const idiomaSite = IDIOMA_SITE.get(b.idioma_site) || 'Portugues';

  const id = await db.transacao(async (c) => {
    const campus = await resolverCampus(c, b.campus);
    const novoId = await criarUsuario(c, d, 'Internacional', campus);
    await c.query(
      `INSERT INTO estudante_internacional
         (usuario_id, matricula, cpf, passaporte, pais_origem, curso, periodo, campus_id,
          idioma_site, sobre_mim, expectativas_do_curso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [novoId, matricula, doc.cpf, doc.passaporte, pais, curso, periodoEst, campus.id, idiomaSite, d.bio, d.expectativas]
    );
    return novoId;
  });

  res.status(201).json({ id, mensagem: 'Cadastro realizado com sucesso' });
});

router.post('/voluntario', async (req, res) => {
  const b = req.body;
  const d = lerComuns(b);
  const { cpf } = v.documento(b.documento, false);
  const vinculo = v.enumerado(b.vinculo, ['Estudante', 'Funcionario'], 'Vínculo');
  let curso = null;
  let periodo = null;
  if (vinculo === 'Estudante') {
    curso = v.texto(b.curso, 'Curso', { max: 50 });
    periodo = v.periodo(b.periodo);
  }

  const id = await db.transacao(async (c) => {
    const campus = await resolverCampus(c, b.campus);
    const novoId = await criarUsuario(c, d, 'Voluntario', campus);
    await c.query(
      `INSERT INTO voluntario
         (user_id, cpf, vinculo, curso, periodo, campus_id, sobre_mim, expectativas_do_curso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [novoId, cpf, vinculo, curso, periodo, campus.id, d.bio, d.expectativas]
    );
    return novoId;
  });

  res.status(201).json({ id, mensagem: 'Cadastro realizado com sucesso' });
});

module.exports = router;