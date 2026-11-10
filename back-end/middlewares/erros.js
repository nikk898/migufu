function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// Precisa ter 4 parâmetros para o Express reconhecer como tratador de erros.
function tratarErros(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Requisição muito grande' });
  }

    // Erros de validação lançados nas rotas (ErroHttp)
  if (err.statusHttp) {
    return res.status(err.statusHttp).json({ erro: err.message });
  }
  // Postgres: 23505 = já existe (e-mail, CPF, matrícula, passaporte)
  if (err.code === '23505') {
    return res.status(409).json({ erro: 'Já existe um cadastro com esses dados' });
  }
  // Postgres: violação de FK, CHECK, tipo ou tamanho
  if (['23503', '23514', '22P02', '22001'].includes(err.code)) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  // O detalhe do erro fica só no log do servidor, nunca na resposta.
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
}

module.exports = { naoEncontrado, tratarErros };