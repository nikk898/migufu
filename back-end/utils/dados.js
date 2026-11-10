const v = require('./validacao');

// c = client da transação (ou o próprio db). Aceita id numérico ou nome do campus.
async function resolverCampus(c, valor) {
  const porId = typeof valor === 'number' || /^\d+$/.test(String(valor));
  const r = porId
    ? await c.query('SELECT id, id_instituicao FROM campus WHERE id = $1', [v.idPositivo(valor, 'Campus')])
    : await c.query('SELECT id, id_instituicao FROM campus WHERE lower(nome) = lower($1)', [v.texto(valor, 'Campus', { max: 100 })]);
  if (!r.rows[0]) throw new v.ErroHttp(400, 'Campus inválido');
  return r.rows[0];
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

module.exports = { resolverCampus, vincularInteresses };