const InstituicaoRepository = require('../repositories/instituicao.repository.js');

class InstituicaoService{

  async createInstituicao(data) {
    return await InstituicaoRepository.create(data);
  }

  async findInstituicaoById(id) {
    return await InstituicaoRepository.findById(id);
  }

  async findAllInstituicao() {
    return await InstituicaoRepository.findAll();
  }

  async updateInstituicao(id, data) {
    return await InstituicaoRepository.update(id, data);
  }

  async removeInstituicao(id) {
    return await InstituicaoRepository.remove(id);
  }
}

module.exports = new InstituicaoService();
