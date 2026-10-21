/*
   Componente CardEstudante
   
*/


(function (global) {
  "use strict";

  function escaping(texto) {
    var el = document.createElement("span");
    el.textContent = texto != null ? String(texto) : "";
    return el.innerHTML;
  }

  function obterIniciais(nome) {
    if (!nome) return "??";
    var partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  function html(dados) {
    var e = dados || {};
    var comVinculo = !!e.comVinculo;

    return (
      '<li class="card card-assoc-est">' +
        
        '<div class="card-assoc-est__topo">' +
          '<div class="card-assoc-est__avatar" aria-hidden="true">' + obterIniciais(e.nome) + '</div>' +
          '<h3 class="card-assoc-est__nome">' + escaping(e.nome) + '</h3>' +
          '<button type="button" class="card-assoc-est__btn-vinc" data-acao="vincular" aria-label="Associar ' + escaping(e.nome) + '">' +
            '<svg class="icone card-assoc-est__icone-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
          '</button>' +
        '</div>' +

        
        '<div class="card-assoc-est__corpo">' +
          '<p class="card-assoc-est__linha"><strong>Curso:</strong> ' + escaping(e.curso) + '</p>' +
          '<p class="card-assoc-est__linha"><strong>Idiomas:</strong> ' + escaping(e.idiomas) + '</p>' +
          '<p class="card-assoc-est__linha"><strong>Tags:</strong> ' + escaping(e.tags || e.interesses) + '</p>' +
        '</div>' +

        
        '<div class="card-assoc-est__rodape">' +
          (comVinculo
            ? '<span class="chip-vinculo chip-vinculo--com"><span class="chip-vinculo__ponto"></span>Com Vínculo</span>'
            : '<span class="chip-vinculo chip-vinculo--sem"><span class="chip-vinculo__ponto"></span>Sem Vínculo</span>') +
        '</div>' +
      '</li>'
    );
  }

  function renderLista(alvo, lista) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    if (!Array.isArray(lista) || lista.length === 0) {
      el.innerHTML = '<li class="card-assoc-est__vazio"><p class="texto">Nenhum estudante encontrado.</p></li>';
      return;
    }
    el.innerHTML = lista.map(html).join("");
    var items = el.querySelectorAll(".card-assoc-est");
    lista.forEach(function (item, i) {
      _vincularEventos(items[i], item);
    });
  }

  function render(alvo, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    el.insertAdjacentHTML("beforeend", html(opcoes || {}));
    _vincularEventos(el.lastElementChild, opcoes || {});
  }

  function _vincularEventos(li, item) {
    if (!li) return;
    var btnVinc = li.querySelector('[data-acao="vincular"]');
    if (btnVinc && typeof item.aoVincular === "function") {
      btnVinc.addEventListener("click", function () { item.aoVincular(item); });
    }
  }

  global.CardEstudanteVinc = { render: render, renderLista: renderLista };
})(window);