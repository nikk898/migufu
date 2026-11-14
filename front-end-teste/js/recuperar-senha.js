/* ==========================================================================
   Recuperação de senha e primeiro acesso (pages/recuperar-senha.html)

   A mesma página serve a dois momentos:
   1) Sem ?token na URL  -> a pessoa digita o e-mail e recebe um link
        formulário -> "E-mail enviado!"                    (POST /api/senha/esqueci)
   2) Com ?token=...     -> abriu o link do e-mail; define a senha
        nova senha -> "Senha definida!"                    (POST /api/senha/redefinir)
        (link já usado, vencido ou adulterado -> "Link inválido ou expirado")

   Quem acabou de se cadastrar também cai aqui: o cadastro não pede senha, então
   cadastro.js já pede o e-mail e redireciona para recuperar-senha.html?cadastro=1.

   Por segurança o servidor responde igual exista o e-mail ou não, então esta tela
   nunca diz "e-mail não encontrado". Depende de js/api.js.
   ========================================================================== */

(function () {
  "use strict";

  var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var REGEX_TOKEN = /^[a-f0-9]{64}$/;
  var INTERVALO_REENVIO = 120;           // segundos: o servidor só manda outro e-mail depois disso
  var CHAVE_EMAIL = "migufu_email_primeiro_acesso"; // gravada pelo cadastro.js
  var VISTAS = ["formulario", "confirmacao", "nova-senha", "sucesso", "link-invalido"];

  var emailEl, erroEl, reenviarEl, statusEl, textoConfirmacaoEl;
  var novaSenhaEl, confirmarEl, novaErroEl;
  var emailEnviado = "";
  var token = "";
  var timer = null;

  /* ---------- Vistas ---------- */
  function mostrarVista(nome, focar) {
    VISTAS.forEach(function (n) {
      document.getElementById("vista-" + n).hidden = n !== nome;
    });
    if (!focar) return;
    var titulo = document.getElementById("vista-" + nome).querySelector("h1");
    titulo.setAttribute("tabindex", "-1");
    titulo.focus();
  }

  /* ---------- Erros ---------- */
  function mostrarErro(el, campo, mensagem) {
    el.textContent = mensagem;
    el.hidden = false;
    if (campo) campo.setAttribute("aria-invalid", "true");
  }

  function limparErro(el, campos) {
    el.hidden = true;
    el.textContent = "";
    campos.forEach(function (c) { c.removeAttribute("aria-invalid"); });
  }

  /* ---------- 1) Pedir o link por e-mail ---------- */
  function pedirLink(email) {
    return Api.chamar("/senha/esqueci", { method: "POST", body: { email: email } });
  }

  function formatarTempo(seg) {
    var m = Math.floor(seg / 60);
    var s = seg % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // Bloqueia o "Reenviar" durante o intervalo em que o servidor ignora novos pedidos.
  function iniciarContagem() {
    clearInterval(timer);
    var resto = INTERVALO_REENVIO;
    reenviarEl.disabled = true;

    function atualizar() {
      if (resto <= 0) {
        clearInterval(timer);
        reenviarEl.disabled = false;
        reenviarEl.textContent = "Reenviar";
        return;
      }
      reenviarEl.textContent = "Reenviar em " + formatarTempo(resto);
      resto -= 1;
    }

    atualizar();
    timer = setInterval(atualizar, 1000);
  }

  function mostrarConfirmacao(doCadastro) {
    textoConfirmacaoEl.textContent = doCadastro
      ? "Cadastro realizado! Enviamos um e-mail para você criar a sua senha de acesso. " +
        "Verifique sua caixa de entrada e de spam."
      : "Enviamos as instruções para o seu e-mail cadastrado. " +
        "Por favor, verifique sua caixa de entrada e de spam.";
    statusEl.textContent = "";
    mostrarVista("confirmacao", true);
    iniciarContagem();
  }

  function aoEnviar(evento) {
    evento.preventDefault();
    limparErro(erroEl, [emailEl]);

    var email = emailEl.value.trim();
    if (!REGEX_EMAIL.test(email)) {
      mostrarErro(erroEl, emailEl, "Digite um e-mail válido.");
      emailEl.focus();
      return;
    }

    var botao = evento.target.querySelector("button[type=submit]");
    botao.disabled = true;

    pedirLink(email)
      .then(function () {
        emailEnviado = email;
        mostrarConfirmacao(false);
      })
      .catch(function (e) {
        mostrarErro(erroEl, emailEl, e.message);   // ex.: limite de pedidos, servidor fora do ar
        emailEl.focus();
      })
      .finally(function () { botao.disabled = false; });
  }

  function aoReenviar() {
    if (reenviarEl.disabled || !emailEnviado) return;
    statusEl.textContent = "Enviando...";

    pedirLink(emailEnviado)
      .then(function () {
        statusEl.textContent = "E-mail reenviado! Confira também a caixa de spam.";
        iniciarContagem();
      })
      .catch(function (e) { statusEl.textContent = e.message; });
  }

  /* ---------- 2) Definir a nova senha (link do e-mail) ---------- */
  function aoSalvarSenha(evento) {
    evento.preventDefault();
    limparErro(novaErroEl, [novaSenhaEl, confirmarEl]);

    var senha = novaSenhaEl.value;
    if (senha.length < 8) {
      mostrarErro(novaErroEl, novaSenhaEl, "A senha deve ter pelo menos 8 caracteres.");
      novaSenhaEl.focus();
      return;
    }
    if (senha.length > 72) {
      mostrarErro(novaErroEl, novaSenhaEl, "A senha pode ter no máximo 72 caracteres.");
      novaSenhaEl.focus();
      return;
    }
    if (senha !== confirmarEl.value) {
      mostrarErro(novaErroEl, confirmarEl, "As senhas não coincidem.");
      confirmarEl.focus();
      return;
    }

    var botao = evento.target.querySelector("button[type=submit]");
    botao.disabled = true;

    Api.chamar("/senha/redefinir", { method: "POST", body: { token: token, senha: senha } })
      .then(function () {
        history.replaceState(null, "", location.pathname);   // tira o token do endereço
        mostrarVista("sucesso", true);
      })
      .catch(function (e) {
        if (/link/i.test(e.message)) {                        // usado, vencido ou inválido
          mostrarVista("link-invalido", true);
        } else {
          mostrarErro(novaErroEl, novaSenhaEl, e.message);
        }
      })
      .finally(function () { botao.disabled = false; });
  }

  /* ---------- Início ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    emailEl = document.getElementById("recuperar-email");
    erroEl = document.getElementById("recuperar-erro");
    reenviarEl = document.getElementById("reenviar");
    statusEl = document.getElementById("reenviar-status");
    textoConfirmacaoEl = document.getElementById("confirmacao-texto");
    novaSenhaEl = document.getElementById("nova-senha");
    confirmarEl = document.getElementById("confirmar-senha");
    novaErroEl = document.getElementById("nova-erro");

    document.getElementById("form-recuperar").addEventListener("submit", aoEnviar);
    emailEl.addEventListener("input", function () { limparErro(erroEl, [emailEl]); });
    reenviarEl.addEventListener("click", aoReenviar);

    document.getElementById("form-nova-senha").addEventListener("submit", aoSalvarSenha);
    [novaSenhaEl, confirmarEl].forEach(function (c) {
      c.addEventListener("input", function () { limparErro(novaErroEl, [novaSenhaEl, confirmarEl]); });
    });

    if (typeof CampoSenha !== "undefined") CampoSenha.iniciar();   // botão "olho" dos campos de senha

    var params = new URLSearchParams(window.location.search);

    // Abriu o link do e-mail
    if (params.has("token")) {
      token = params.get("token");
      if (REGEX_TOKEN.test(token)) {
        mostrarVista("nova-senha", false);
        novaSenhaEl.focus();
      } else {
        mostrarVista("link-invalido", false);
      }
      return;
    }

    // Acabou de se cadastrar (o cadastro.js já pediu o e-mail)
    if (params.get("cadastro") === "1") {
      try { emailEnviado = sessionStorage.getItem(CHAVE_EMAIL) || ""; } catch (e) { emailEnviado = ""; }
      if (emailEnviado) {
        mostrarConfirmacao(true);
        return;
      }
    }

    mostrarVista("formulario", false);
  });
})();