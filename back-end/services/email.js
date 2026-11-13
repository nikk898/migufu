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

// Admin vinculou o voluntário a um estudante internacional (admin-associar.html).
// "link" leva ao site; depois do login o voluntário vê o contato do estudante no painel.
function enviarAvisoVinculo({ para, estudante, link }) {
  const nome = escaparHtml(para.nome || '');
  const est = escaparHtml(estudante);
  const url = escaparHtml(link);
  return enviarEmail({
    para,
    assunto: 'Você agora é MIGUFU de um estudante internacional!',
    html: `<p>Olá${nome ? `, ${nome}` : ''}!</p>
<p>Você foi vinculado(a) como MIGUFU de <strong>${est}</strong>, estudante internacional.</p>
<p>Entre no site para ver os dados de contato e conhecer melhor o seu Migufu:</p>
<p><a href="${url}">Acessar o Migufu</a></p>
<p>Obrigado por fazer parte do programa!</p>`,
    texto: `Olá${para.nome ? `, ${para.nome}` : ''}!\n\n`
      + `Você foi vinculado(a) como MIGUFU de ${estudante}, estudante internacional.\n\n`
      + `Entre no site para ver os dados de contato e conhecer melhor o seu Migufu:\n${link}\n\n`
      + `Obrigado por fazer parte do programa!`
  });
}

// Admin desfez o vínculo (admin-associar.html).
function enviarAvisoDesvinculo({ para, estudante }) {
  const nome = escaparHtml(para.nome || '');
  const est = escaparHtml(estudante);
  return enviarEmail({
    para,
    assunto: 'Seu vínculo no MIGUFU foi encerrado',
    html: `<p>Olá${nome ? `, ${nome}` : ''}!</p>
<p>O seu vínculo como MIGUFU de <strong>${est}</strong> foi encerrado pela administração do programa.</p>
<p>Se tiver alguma dúvida, entre em contato pela área de Ajuda do site.</p>`,
    texto: `Olá${para.nome ? `, ${para.nome}` : ''}!\n\n`
      + `O seu vínculo como MIGUFU de ${estudante} foi encerrado pela administração do programa.\n\n`
      + `Se tiver alguma dúvida, entre em contato pela área de Ajuda do site.`
  });
}


// Admin solicitou que o voluntário envie novamente o certificado.
function enviarAvisoNovoCertificado({ para }) {
  const nome = escaparHtml(para.nome || '');
  return enviarEmail({
    para,
    assunto: 'Envie novamente seu certificado - MIGUFU',
    html: `<p>Olá${nome ? `, ${nome}` : ''}!</p>
<p>A equipe do MIGUFU solicitou o reenvio do seu certificado.</p>
<p>Por favor, acesse sua conta no MIGUFU e envie novamente o certificado pela área do seu perfil.</p>
<p>Após o envio, a equipe responsável poderá realizar uma nova análise do documento.</p>
<p>Se você já realizou um novo envio, desconsidere esta mensagem.</p>
<p>Atenciosamente,<br>Equipe MIGUFU</p>`,
    texto: `Olá${para.nome ? `, ${para.nome}` : ''}!\n\n`
      + 'A equipe do MIGUFU solicitou o reenvio do seu certificado.\n\n'
      + 'Por favor, acesse sua conta no MIGUFU e envie novamente o certificado pela área do seu perfil.\n\n'
      + 'Após o envio, a equipe responsável poderá realizar uma nova análise do documento.\n\n'
      + 'Se você já realizou um novo envio, desconsidere esta mensagem.\n\n'
      + 'Atenciosamente,\nEquipe MIGUFU'
  });
}

module.exports = {
  enviarEmail, enviarRecuperacaoSenha, enviarAvisoSenhaAlterada,
  enviarAvisoVinculo, enviarAvisoDesvinculo, enviarAvisoNovoCertificado
};