/* ==========================================================================
   Login (pages/login.html)
   ========================================================================== */

(function () {
  "use strict";

  var form, emailEl, senhaEl, erroEl, modal;

  function mostrarErro(mensagem) {
    erroEl.textContent = mensagem;
    erroEl.hidden = false;
    emailEl.setAttribute("aria-invalid", "true");
    senhaEl.setAttribute("aria-invalid", "true");
  }

  function limparErro() {
    erroEl.hidden = true;
    erroEl.textContent = "";
    emailEl.removeAttribute("aria-invalid");
    senhaEl.removeAttribute("aria-invalid");
  }

  function aoEnviar(evento) {
    evento.preventDefault();
    limparErro();

    var email = emailEl.value.trim();
    var senha = senhaEl.value;

    if (!email || !senha) {
      mostrarErro("Preencha o e-mail e a senha.");
      (email ? senhaEl : emailEl).focus();
      return;
    }

    // TODO: trocar por uma chamada ao back-end (POST de login) e usar o perfil
    // retornado para escolher a página de destino. Por enquanto usa AuthMock.
    if (typeof AuthMock === "undefined") {
      mostrarErro("Erro interno: auth-mock.js não carregou.");
      console.error("auth-mock.js não carregou. Confira o caminho em login.html.");
      return;
    }

    var destino = AuthMock.entrar(email, senha);

    if (!destino) {
      mostrarErro("E-mail ou senha incorretos.");
      senhaEl.focus();
      return;
    }

    window.location.href = destino;
  }

  function iniciarModal() {
    modal = document.getElementById("modal-perfil");

    document.getElementById("abrir-perfis").addEventListener("click", function () {
      modal.showModal();
    });

    document.getElementById("fechar-perfis").addEventListener("click", function () {
      modal.close();
    });

    // Clique fora da caixa (no fundo escurecido) também fecha
    modal.addEventListener("click", function (evento) {
      if (evento.target === modal) modal.close();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    form = document.getElementById("form-login");
    emailEl = document.getElementById("login-email");
    senhaEl = document.getElementById("login-senha");
    erroEl = document.getElementById("login-erro");

    // O envio é registrado primeiro: se algum componente falhar ao carregar,
    // o login continua funcionando.
    form.addEventListener("submit", aoEnviar);
    emailEl.addEventListener("input", limparErro);
    senhaEl.addEventListener("input", limparErro);

    if (typeof CampoSenha !== "undefined") CampoSenha.iniciar();
    else console.error("campo-senha.js não carregou. Confira o caminho em login.html.");

    iniciarModal();
  });
})();