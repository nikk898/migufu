const Instituicao = require('../models/instituicao.model');

const CAMPOS_GRAVAVEIS = ['nome', 'sigla', 'cidade', 'uf', 'ativa'];

function apenasCamposGravaveis(data = {}) {
  const resultado = {};
  for (const campo of CAMPOS_GRAVAVEIS) {
    if (data[campo] !== undefined) resultado[campo] = data[campo];
  }
  return resultado;
}

function paraObjetoSimples(registro) {
  return registro ? registro.get({ plain: true }) : null;
}

class InstituicaoRepository {
  async create(data) {
    const instituicao = await Instituicao.create(apenasCamposGravaveis(data));
    return paraObjetoSimples(instituicao);
  }

  async findById(id) {
    return Instituicao.findByPk(id, { raw: true }); // null se nao existir
  }

  async findAll({ ativa } = {}) {
    const where = ativa !== undefined ? { ativa } : {};
    return Instituicao.findAll({
      where,
      order: [['nome', 'ASC']],
      raw: true,
    });
  }

  async update(id, data) {
    const instituicao = await Instituicao.findByPk(id);
    if (!instituicao) return null;
    await instituicao.update(apenasCamposGravaveis(data));
    return paraObjetoSimples(instituicao);
  }

  // Retorna true se removeu, false se o id nao existia.
  // O banco usa ON DELETE RESTRICT: falha com erro de chave estrangeira
  // se a instituicao ja tiver campus ou usuarios ligados a ela.
  // Para "pausar" uma instituicao, prefira update(id, { ativa: false }).
  async remove(id) {
    const removidas = await Instituicao.destroy({ where: { id } });
    return removidas > 0;
  }
}

module.exports = new InstituicaoRepository();
