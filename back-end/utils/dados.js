const v = require('./validacao');
const db = require('../db');

const ROTULO_IDIOMA = {
  Portugues: 'Português', Ingles: 'Inglês', Frances: 'Francês', Japones: 'Japonês',
  Alemao: 'Alemão', Espanhol: 'Espanhol', Mandarim: 'Mandarim', Latim: 'Latim',
  Russo: 'Russo', Italiano: 'Italiano', Libras: 'Libras',
};
const ROTULO_NIVEL = {
  Basico: 'Básico', Intermediario: 'Intermediário', Avancado: 'Avançado',
  Fluente: 'Fluente', Nativo: 'Nativo',
};

const slug = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// "Campus Santa Mônica" e "Santa Mônica" são o mesmo campus.
const slugCampus = (s) => slug(s).replace(/^campus-/, '');

// c = client da transação (ou o próprio db). Aceita id numérico ou nome/slug do campus.
async function resolverCampus(c, valor) {
  if (typeof valor === 'number' || /^\d+$/.test(String(valor))) {
    const r = await c.query('SELECT id, id_instituicao FROM campus WHERE id = $1', [v.idPositivo(valor, 'Campus')]);
    if (r.rows[0]) return r.rows[0];
  } else {
    const alvo = slugCampus(v.texto(valor, 'Campus', { max: 100 }));
    const todos = await c.query('SELECT id, id_instituicao, nome FROM campus');
    const achado = todos.rows.find((x) => slugCampus(x.nome) === alvo);
    if (achado) return achado;
  }
  throw new v.ErroHttp(400, 'Campus inválido');
}

// Cria o interesse se ainda não existir e vincula ao usuário.
async function vincularInteresses(c, usuarioId, nomes) {
  for (const nome of nomes) {
    await c.query('INSERT INTO interesse (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING', [nome]);
    await c.query(
      `INSERT INTO usuario_interesse (usuario_id, interesse_id)
       SELECT $1, id FROM interesse WHERE nome = $2
       ON CONFLICT DO NOTHING`,
      [usuarioId, nome]
    );
  }
}

// [{idioma:'Frances', nivel:'Nativo'}] -> "Francês (Nativo), ..."
function idiomasTexto(rows) {
  return rows
    .map((r) => `${ROTULO_IDIOMA[r.idioma] || r.idioma} (${ROTULO_NIVEL[r.nivel] || r.nivel})`)
    .join(', ');
}

// Anexa idiomas e interesses (texto pronto para os cards) a pessoas que têm o campo "id".
async function completarPessoas(pessoas) {
  if (!pessoas.length) return pessoas;
  const ids = pessoas.map((p) => p.id);
  const idiomas = await db.query(
    'SELECT usuario_id, idioma::text AS idioma, nivel::text AS nivel FROM usuario_idioma WHERE usuario_id = ANY($1)', [ids]);
  const interesses = await db.query(
    `SELECT x.usuario_id, i.nome FROM usuario_interesse x
       JOIN interesse i ON i.id = x.interesse_id
      WHERE x.usuario_id = ANY($1) ORDER BY i.nome`, [ids]);
  for (const p of pessoas) {
    p.idiomas = idiomasTexto(idiomas.rows.filter((r) => r.usuario_id === p.id));
    p.interesses = interesses.rows.filter((r) => r.usuario_id === p.id).map((r) => r.nome).join(', ');
  }
  return pessoas;
}

module.exports = { resolverCampus, vincularInteresses, idiomasTexto, completarPessoas };