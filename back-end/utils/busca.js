// utils/busca.js
// Ajuda a fazer buscas "sem acento e sem diferença de maiúscula/minúscula":
// digitar "joao" encontra "João", "JOÃO" e "joão".
//
// Uso (veja routes/suporte.js e routes/admin.js):
//   const where = `${semAcentoSql('u.nome_completo')} LIKE $1`;
//   const termo = padraoBusca(req.query.busca);          // vai como parâmetro ($1)
//   pool.query(`SELECT ... WHERE ${where}`, [termo]);

// Letras acentuadas e o equivalente sem acento (as duas strings têm o mesmo tamanho).
const COM = 'áàâãäéèêëíìîïóòôõöúùûüçñ';
const SEM = 'aaaaaeeeeiiiiooooouuuucn';
const COM_MAIUSCULAS = COM.toUpperCase();
const SEM_MAIUSCULAS = SEM.toUpperCase();

if (COM.length !== SEM.length) {
  throw new Error('utils/busca: tabelas de acentos com tamanhos diferentes');
}

/**
 * Devolve um pedaço de SQL que tira os acentos e põe em minúsculas o valor de uma coluna.
 * Não precisa de extensão no banco (usa translate + lower, que já existem no PostgreSQL).
 *
 * ATENÇÃO: o argumento é inserido direto no SQL, então passe SÓ nomes de coluna escritos
 * no código (ex.: 'u.nome_completo'), NUNCA texto vindo do usuário. O texto do usuário
 * vai sempre por parâmetro ($1), usando padraoBusca().
 */
function semAcentoSql(coluna) {
  if (typeof coluna !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(coluna)) {
    throw new Error('semAcentoSql: nome de coluna inválido');
  }
  return `lower(translate(${coluna}, '${COM}${COM_MAIUSCULAS}', '${SEM}${SEM_MAIUSCULAS}'))`;
}

/**
 * Transforma o texto digitado em um padrão para LIKE: sem acento, minúsculo, com % nas
 * pontas e com os caracteres especiais do LIKE (% _ \) tratados como texto comum.
 * Texto vazio devolve '%%', que casa com tudo.
 */
function padraoBusca(texto) {
  const t = typeof texto === 'string' ? texto : '';
  const limpo = t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira os acentos
    .toLowerCase()
    .trim()
    .slice(0, 100)
    .replace(/[\\%_]/g, '\\$&');     // % _ \ viram texto comum no LIKE
  return '%' + limpo + '%';
}

module.exports = { semAcentoSql, padraoBusca };
