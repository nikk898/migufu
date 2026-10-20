/* ==========================================================================
   Cabeçalho de página (componente reutilizável)

   Requer components/icones.js carregado antes.

   Uso:
     <div id="cabecalho"></div>
     CabecalhoPagina.render("#cabecalho", { titulo: "Instituições" });

   Opções: titulo, imagens (pasta das imagens), aoVoltar (padrão: history.back)
   ========================================================================== */

(function (global) {
  "use strict";

  function escapar(texto) {
    var el = document.createElement("span");
    el.textContent = texto;
    return el.innerHTML;
  }

  function render(alvo, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;

    var o = opcoes || {};
    var imagens = o.imagens || "../assets/img/";

    el.innerHTML =
      '<header class="cabecalho-pagina">' +
      '<button type="button" class="cabecalho-pagina__voltar" aria-label="Voltar">' +
      Icones.svg("voltar") + "</button>" +
      '<h1 class="cabecalho-pagina__titulo">' + escapar(o.titulo || "") + "</h1>" +
      '<img class="cabecalho-pagina__logo" src="' + imagens + 'logo-migufu.png" alt="">' +
      "</header>";

    el.querySelector(".cabecalho-pagina__voltar").addEventListener("click", function () {
      if (typeof o.aoVoltar === "function") o.aoVoltar();
      else window.history.back();
    });
  }

  global.CabecalhoPagina = { render: render };
})(window);
