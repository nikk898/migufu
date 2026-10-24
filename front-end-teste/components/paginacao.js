(function (global) {
  "use strict";

  /* Gera a lista de itens: números e "..." (ex.: 1 ... 4 5 6 ... 12) */
  function itensPaginas(atual, total) {
    if (total <= 7) {
      return Array.apply(null, Array(total)).map(function (_, i) { return i + 1; });
    }
    if (atual <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (atual >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", atual - 1, atual, atual + 1, "...", total];
  }

  var SETA_ESQ = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
  var SETA_DIR = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>';

  /*
    Paginacao.render("#paginacao", {
      total: 23,            // total de itens
      porPagina: 10,        // padrão 10
      paginaAtual: 1,
      aoMudar: function (novaPagina) { ... }
    });
  */
  function render(alvo, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    var o = opcoes || {};
    var porPagina = o.porPagina || 10;
    var totalPaginas = Math.max(1, Math.ceil((o.total || 0) / porPagina));
    var atual = Math.min(Math.max(1, o.paginaAtual || 1), totalPaginas);

    if (totalPaginas <= 1) {
      el.innerHTML = "";
      el.onclick = null;
      return;
    }

    var html = '<nav class="paginacao" aria-label="Paginação"><ul class="paginacao__lista">';

    html += '<li><button type="button" class="paginacao__btn" data-pagina="' + (atual - 1) + '" aria-label="Página anterior"' +
            (atual === 1 ? " disabled" : "") + '>' + SETA_ESQ + '</button></li>';

    itensPaginas(atual, totalPaginas).forEach(function (p) {
      if (p === "...") {
        html += '<li class="paginacao__reticencias" aria-hidden="true">…</li>';
      } else {
        html += '<li><button type="button" class="paginacao__btn' + (p === atual ? " is-ativo" : "") + '" data-pagina="' + p + '"' +
                (p === atual ? ' aria-current="page"' : "") + ' aria-label="Página ' + p + '">' + p + '</button></li>';
      }
    });

    html += '<li><button type="button" class="paginacao__btn" data-pagina="' + (atual + 1) + '" aria-label="Próxima página"' +
            (atual === totalPaginas ? " disabled" : "") + '>' + SETA_DIR + '</button></li>';

    html += '</ul></nav>';
    el.innerHTML = html;

    el.onclick = function (e) {
      var btn = e.target.closest("[data-pagina]");
      if (!btn || btn.disabled) return;
      var p = Number(btn.getAttribute("data-pagina"));
      if (p !== atual && typeof o.aoMudar === "function") o.aoMudar(p);
    };
  }

  global.Paginacao = { render: render };
})(window);