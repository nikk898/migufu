/* ==========================================================================
   Login (pages/login.html)
   ========================================================================== */

(function () {
  "use strict";

  var form, emailEl, senhaEl, erroEl, modal;

  // perfil do banco -> página inicial
  var DESTINOS = {
    Admin: "admin.html",
    Mestre: "mestre.html",
    Voluntario: "voluntario.html",
    Internacional: "estudante.html"
  };

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

    var botao = form.querySelector('[type="submit"]');
    botao.disabled = true;

    Api.chamar("/usuarios/login", { method: "POST", body: { email: email, senha: senha } })
      .then(function (r) {
        localStorage.setItem("token", r.token);
        window.location.href = DESTINOS[r.usuario.perfil] || "login.html";
      })
      .catch(function (e) {
        mostrarErro(e.message);
        senhaEl.focus();
      })
      .finally(function () { botao.disabled = false; });
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