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

  // O detalhe do erro fica só no log do servidor, nunca na resposta.
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
}

module.exports = { naoEncontrado, tratarErros };