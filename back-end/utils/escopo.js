/*
 * ESCOPO DE DADOS POR PERFIL
 *
 * Os middlewares de auth.js dizem QUEM é o usuário e qual o perfil dele.
 * Este arquivo diz QUAIS DADOS ele pode ver, devolvendo um trecho de SQL para
 * colocar no WHERE da consulta.
 *
 * Regras:
 *   Mestre ............ vê tudo
 *   Admin ............. vê só a própria instituição (base_user.id_instituicao)
 *   Voluntario ........ vê a si mesmo e quem tem vínculo ATIVO com ele
 *   Internacional ..... vê a si mesmo e quem tem vínculo ATIVO com ele
 *   qualquer outro .... não vê nada (falha fechada)
 *
 * Como usar numa rota (depois de autenticar):
 *
 *   const { escopoPorPerfil } = require('../utils/escopo');
 *
 *   const params = [];
 *   const filtro = escopoPorPerfil(req.usuario, 'u', params);
 *   const { rows } = await pool.query(
 *     `SELECT u.id, u.nome_completo FROM base_user u WHERE ${filtro}`,
 *     params
 *   );
 *
 * Detalhes importantes:
 * - O trecho usa parâmetros ($1, $2...) e acrescenta os valores no array "params".
 *   Se a consulta tiver outros parâmetros, passe o MESMO array e monte as demais
 *   condições depois, usando params.push(valor) e `$${params.length}`.
 * - O alias deve ser o da tabela base_user na consulta (a coluna usada é alias.id e
 *   alias.id_instituicao). Para tabelas como voluntario ou estudante_internacional,
 *   faça JOIN com base_user.
 * - Este filtro só decide QUEM pode ser visto. Escolha também QUAIS colunas devolver
 *   (por exemplo, não devolva CPF e matrícula para o outro lado do vínculo).
 * - id e id_instituicao vêm do token e valem até ele expirar. Se alguém mudar de
 *   instituição, o token antigo continua com a instituição antiga.
 */

const ALIAS_RE = /^[a-z_][a-z0-9_]*$/i;

function validarAlias(alias) {
  // O alias entra no texto do SQL, então só aceita nomes simples definidos no código.
  if (typeof alias !== 'string' || !ALIAS_RE.test(alias)) {
    throw new Error('Alias de tabela inválido');
  }
}

function adicionar(params, valor) {
  params.push(valor);
  return `$${params.length}`;
}

/*
 * Filtro para consultas sobre base_user.
 * opcoes.incluirEncerrados = true considera também vínculos já encerrados
 * (padrão: só vínculos ativos).
 */
function escopoPorPerfil(usuario, alias, params, opcoes = {}) {
  validarAlias(alias);
  const apenasAtivos = opcoes.incluirEncerrados ? '' : ' AND vm.ativo';

  switch (usuario && usuario.perfil) {
    case 'Mestre':
      return 'TRUE';

    case 'Admin': {
      if (usuario.id_instituicao == null) return 'FALSE';
      return `${alias}.id_instituicao = ${adicionar(params, usuario.id_instituicao)}`;
    }

    case 'Voluntario': {
      const p = adicionar(params, usuario.id);
      return `(${alias}.id = ${p} OR ${alias}.id IN (
        SELECT vm.estudante_internacional_id FROM vinculo_migufu vm
        WHERE vm.voluntario_id = ${p}${apenasAtivos}))`;
    }

    case 'Internacional': {
      const p = adicionar(params, usuario.id);
      return `(${alias}.id = ${p} OR ${alias}.id IN (
        SELECT vm.voluntario_id FROM vinculo_migufu vm
        WHERE vm.estudante_internacional_id = ${p}${apenasAtivos}))`;
    }

    default:
      return 'FALSE';
  }
}

/*
 * Filtro para consultas sobre vinculo_migufu (alias = a tabela vinculo_migufu).
 * Não filtra por "ativo": isso é decisão da rota (o admin pode querer o histórico).
 * Admin só vê vínculos em que voluntário E estudante são da instituição dele.
 */
function escopoVinculos(usuario, alias, params) {
  validarAlias(alias);

  switch (usuario && usuario.perfil) {
    case 'Mestre':
      return 'TRUE';

    case 'Admin': {
      if (usuario.id_instituicao == null) return 'FALSE';
      const p = adicionar(params, usuario.id_instituicao);
      return `(EXISTS (SELECT 1 FROM base_user b1
                       WHERE b1.id = ${alias}.voluntario_id AND b1.id_instituicao = ${p})
               AND EXISTS (SELECT 1 FROM base_user b2
                       WHERE b2.id = ${alias}.estudante_internacional_id AND b2.id_instituicao = ${p}))`;
    }

    case 'Voluntario':
      return `${alias}.voluntario_id = ${adicionar(params, usuario.id)}`;

    case 'Internacional':
      return `${alias}.estudante_internacional_id = ${adicionar(params, usuario.id)}`;

    default:
      return 'FALSE';
  }
}

/*
 * Para rotas de um único usuário (ex.: GET /algo/:id): confere se o usuário logado
 * pode acessar aquele id. "db" pode ser o pool ou um client do pg.
 * Dica: quando devolver false, responda 404 (e não 403), para não revelar que
 * o id existe.
 */
async function podeAcessarUsuario(db, usuario, idAlvo, opcoes = {}) {
  const id = Number(idAlvo);
  if (!Number.isInteger(id) || id <= 0) return false;

  const params = [id];
  const filtro = escopoPorPerfil(usuario, 'u', params, opcoes);
  const { rowCount } = await db.query(
    `SELECT 1 FROM base_user u WHERE u.id = $1 AND ${filtro}`,
    params
  );
  return rowCount > 0;
}

module.exports = { escopoPorPerfil, escopoVinculos, podeAcessarUsuario };