(function (global) {
  "use strict";

  function escapar(texto) {
    var el = document.createElement("span");
    el.textContent = texto != null ? String(texto) : "";
    return el.innerHTML;
  }

  function html(dados) {
    var v = dados || {};
    var selecionado = !!v.selecionado;

    return (
      '<div class="card card-vol-vinc' + (selecionado ? ' is-selecionado' : '') + '">' +
        '<div class="card-vol-vinc__cabecalho">' +
          '<h3 class="subtitulo">' + escapar(v.nome) + '</h3>' +
          '<span class="chip chip--sucesso">Apto</span>' +
        '</div>' +
        '<div class="card-vol-vinc__corpo">' +
          '<p class="texto"><strong>Curso:</strong> ' + escapar(v.curso) + '</p>' +
          '<p class="texto"><strong>Idiomas:</strong> ' + escapar(v.idiomas) + '</p>' +
          '<p class="texto"><strong>Interesses:</strong> ' + escapar(v.interesses) + '</p>' +
        '</div>' +
        '<button type="button" class="botao ' + (selecionado ? 'botao--secundario' : 'botao--primario') + ' card-vol-vinc__btn" data-acao="selecionar">' +
          (selecionado ? 'SELECIONADO' : 'SELECIONAR VOLUNTÁRIO') +
        '</button>' +
      '</div>'
    );
  }

  function render(alvo, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    el.innerHTML = html(opcoes || {});
    _vincularEventos(el.firstElementChild, opcoes || {});
  }

  function _vincularEventos(card, item) {
    if (!card) return;
    var btn = card.querySelector('[data-acao="selecionar"]');
    if (btn && typeof item.aoSelecionar === "function") {
      btn.addEventListener("click", function () { item.aoSelecionar(item); });
    }
  }

  global.CardVoluntarioVinc = { render: render };
})(window);