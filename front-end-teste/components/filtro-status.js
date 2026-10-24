(function (global) {
  "use strict";

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /*
    FiltroStatus.render("#filtro-status", {
      rotulo: "Filtrar por situação",
      opcoes: [{ id: "todos", rotulo: "Todos" }, { id: "apto", rotulo: "Aptos" }],
      selecionado: "todos",
      aoMudar: function (idSelecionado) {}
    });
  */
  function render(alvo, config) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    var c = config || {};
    var opcoes = c.opcoes || [];

    el.innerHTML =
      '<div class="filtro-status" role="group" aria-label="' + esc(c.rotulo || "Filtrar por situação") + '">' +
        opcoes.map(function (o) {
          var ativo = o.id === c.selecionado;
          return '<button type="button" class="filtro-status__btn' + (ativo ? " is-ativo" : "") + '" data-status="' + esc(o.id) + '" aria-pressed="' + ativo + '">' +
            esc(o.rotulo) + '</button>';
        }).join("") +
      '</div>';

    el.onclick = function (e) {
      var btn = e.target.closest("[data-status]");
      if (!btn) return;
      var id = btn.getAttribute("data-status");
      if (id !== c.selecionado && typeof c.aoMudar === "function") c.aoMudar(id);
    };
  }

  global.FiltroStatus = { render: render };
})(window);