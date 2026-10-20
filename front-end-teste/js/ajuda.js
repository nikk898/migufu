/* ==========================================================================
   Ajuda e Suporte - Voluntário / Estudante Internacional (pages/ajuda.html)

   O perfil define quais itens aparecem na navbar:
     ajuda.html                    -> Voluntário
     ajuda.html?perfil=estudante   -> Estudante Internacional
   ========================================================================== */

(function () {
  "use strict";

  var form;
  var entrada;
  var erro;
  var sucesso;

  function mostrarErro(texto) {
    erro.textContent = texto;
    erro.hidden = !texto;
    entrada.setAttribute("aria-invalid", texto ? "true" : "false");
  }

  function aoEnviar(evento) {
    evento.preventDefault();
    sucesso.hidden = true;

    var mensagem = entrada.value.trim();
    if (!mensagem) {
      mostrarErro("Escreva uma mensagem antes de enviar.");
      entrada.focus();
      return;
    }
    mostrarErro("");

    // TODO: enviar a mensagem ao back-end (chamado de suporte para o administrador)
    form.reset();
    sucesso.textContent = "Mensagem enviada! Nossa equipe responderá em breve.";
    sucesso.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var perfil = new URLSearchParams(window.location.search).get("perfil");
    var estudante = perfil === "estudante";

    Navbar.render("#navbar", {
      variante: "app",
      itens: estudante ? Navbar.ITENS_ESTUDANTE : Navbar.ITENS_VOLUNTARIO,
      ativo: "ajuda",
    });

    form = document.querySelector('[data-ajuda="form"]');
    entrada = document.getElementById("mensagem");
    erro = document.querySelector('[data-ajuda="erro"]');
    sucesso = document.querySelector('[data-ajuda="sucesso"]');

    form.addEventListener("submit", aoEnviar);
    entrada.addEventListener("input", function () {
      if (entrada.value.trim()) mostrarErro("");
    });
  });
})();
