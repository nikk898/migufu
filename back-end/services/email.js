// Envio de e-mails transacionais pela API do Brevo (sem biblioteca extra: usa o fetch do Node).
// Variáveis do .env: BREVO_API_KEY, EMAIL_REMETENTE e, opcionalmente, EMAIL_REMETENTE_NOME.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function enviarEmail({ para, assunto, html, texto }) {
  const chave = process.env.BREVO_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE;
  if (!chave || !remetente) {
    throw new Error('BREVO_API_KEY ou EMAIL_REMETENTE não definidos no .env');
  }

  const resposta = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': chave,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { email: remetente, name: process.env.EMAIL_REMETENTE_NOME || 'Migufu' },
      to: [para.nome ? { email: para.email, name: para.nome } : { email: para.email }],
      subject: assunto,
      htmlContent: html,
      textContent: texto
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Brevo respondeu ${resposta.status}: ${detalhe}`);
  }
  return resposta.json();
}

function enviarRecuperacaoSenha({ para, link, minutos }) {
  const nome = escaparHtml(para.nome || '');
  const url = escaparHtml(link);
  return enviarEmail({
    para,
    assunto: 'Redefinição de senha - Migufu',
    html: `<p>Olá${nome ? `, ${nome}` : ''}!</p>
<p>Recebemos um pedido para redefinir a sua senha. Clique no link abaixo para escolher uma nova senha. O link vale por ${minutos} minutos e só pode ser usado uma vez.</p>
<p><a href="${url}">Redefinir minha senha</a></p>
<p>Se você não fez esse pedido, ignore este e-mail: a sua senha continua a mesma.</p>`,
    texto: `Olá${para.nome ? `, ${para.nome}` : ''}!\n\n`
      + `Recebemos um pedido para redefinir a sua senha. Acesse o link abaixo para escolher uma nova senha. `
      + `O link vale por ${minutos} minutos e só pode ser usado uma vez.\n\n${link}\n\n`
      + `Se você não fez esse pedido, ignore este e-mail: a sua senha continua a mesma.`
  });
}

function enviarAvisoSenhaAlterada({ para }) {
  const nome = escaparHtml(para.nome || '');
  return enviarEmail({
    para,
    assunto: 'Sua senha foi alterada - Migufu',
    html: `<p>Olá${nome ? `, ${nome}` : ''}!</p>
<p>A senha da sua conta foi alterada agora há pouco.</p>
<p>Se foi você, não precisa fazer nada. Se não foi, peça uma nova redefinição de senha imediatamente e avise os administradores.</p>`,
    texto: `Olá${para.nome ? `, ${para.nome}` : ''}!\n\n`
      + `A senha da sua conta foi alterada agora há pouco.\n\n`
      + `Se foi você, não precisa fazer nada. Se não foi, peça uma nova redefinição de senha imediatamente e avise os administradores.`
  });
}

module.exports = { enviarEmail, enviarRecuperacaoSenha, enviarAvisoSenhaAlterada };