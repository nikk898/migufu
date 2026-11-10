const rateLimit = require('express-rate-limit');

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

// Teto geral para toda a API: evita abuso e varredura.
const limiteGeral = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { erro: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

// Login: conta só as tentativas que falharam (status 400 ou maior).
// Dificulta adivinhar senhas por tentativa e erro.
const limiteLogin = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

// Cadastro: evita criação em massa de contas.
const limiteCadastro = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { erro: 'Muitos cadastros deste endereço. Tente novamente mais tarde.' },
});

// Pedido de recuperação de senha: evita disparar e-mails em massa.
const limiteEsqueci = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { erro: 'Muitos pedidos de recuperação. Tente novamente mais tarde.' },
});

// Redefinição de senha: o token já é impossível de adivinhar, mas o limite não custa nada.
const limiteRedefinir = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

// Chamados de suporte: evita spam para os admins.
const limiteSuporte = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { erro: 'Muitos chamados enviados. Tente novamente mais tarde.' },
});

module.exports = { limiteGeral, limiteLogin, limiteCadastro, limiteEsqueci, limiteRedefinir, limiteSuporte };