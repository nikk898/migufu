/* ==========================================================================
   Recuperação de senha (pages/recuperar-senha.html)

   Fluxo: formulário -> (erro: e-mail não encontrado) -> "E-mail enviado!"
   ========================================================================== */

(function () {
  "use strict";

  var emailEl, erroEl, vistaFormulario, vistaConfirmacao, statusEl;

  var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function mostrarErro(mensagem) {
    erroEl.textContent = mensagem;
    erroEl.hidden = false;
    emailEl.setAttribute("aria-invalid", "true");
  }

  function limparErro() {
    erroEl.hidden = true;
    erroEl.textContent = "";
    emailEl.removeAttribute("aria-invalid");
  }

  function mostrarConfirmacao() {
    vistaFormulario.hidden = true;
    vistaConfirmacao.hidden = false;
    vistaConfirmacao.querySelector("h1").setAttribute("tabindex", "-1");
    vistaConfirmacao.querySelector("h1").focus();
  }

  function aoEnviar(evento) {
    evento.preventDefault();
    limparErro();

    var email = emailEl.value.trim();

    if (!REGEX_EMAIL.test(email)) {
      mostrarErro("Digite um e-mail válido.");
      emailEl.focus();
      return;
    }

    // TODO: trocar por uma chamada ao back-end (solicitar redefinição de senha).
    // Por enquanto usa AuthMock; e-mails fora da lista caem no estado de erro.
    if (!AuthMock.emailExiste(email)) {
      mostrarErro("O e-mail inserido não foi encontrado.");
      emailEl.focus();
      return;
    }

    mostrarConfirmacao();
  }

  function aoReenviar() {
    // TODO: repetir a chamada ao back-end com o mesmo e-mail.
    statusEl.textContent = "E-mail reenviado!";
  }

  document.addEventListener("DOMContentLoaded", function () {
    emailEl = document.getElementById("recuperar-email");
    erroEl = document.getElementById("recuperar-erro");
    vistaFormulario = document.getElementById("vista-formulario");
    vistaConfirmacao = document.getElementById("vista-confirmacao");
    statusEl = document.getElementById("reenviar-status");

    document.getElementById("form-recuperar").addEventListener("submit", aoEnviar);
    emailEl.addEventListener("input", limparErro);
    document.getElementById("reenviar").addEventListener("click", aoReenviar);
  });
})();