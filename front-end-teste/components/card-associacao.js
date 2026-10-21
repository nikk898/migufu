/*
   Componente CardAssociacao 
   
*/

(function (global) {
  "use strict";

  function escapar(texto) {
    var el = document.createElement("span");
    el.textContent = texto != null ? String(texto) : "";
    return el.innerHTML;
  }

  function html(dados) {
    var a = dados || {};
    var est = a.estudante || {};
    var vol = a.voluntario || {};

    return (
      '<li class="card card-assoc">' +
        '<div class="card-assoc__dupla">' +
          '<div class="card-assoc__membro">' +
            '<span class="legenda card-assoc__rotulo">Estudante Internacional</span>' +
            '<p class="subtitulo">' + escapar(est.nome) + '</p>' +
            '<p class="legenda">' + escapar(est.pais) + ' • ' + escapar(est.curso) + '</p>' +
          '</div>' +
          '<div class="card-assoc__conexao" aria-hidden="true">↔</div>' +
          '<div class="card-assoc__membro">' +
            '<span class="legenda card-assoc__rotulo">Voluntário</span>' +
            '<p class="subtitulo">' + escapar(vol.nome) + '</p>' +
            '<p class="legenda">' + escapar(vol.curso) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="card-assoc__acoes">' +
          '<button type="button" class="inst-card__acao inst-card__acao--perigo" data-acao="desvincular" aria-label="Desvincular dupla">' +
            Icones.svg("lixeira") +
          '</button>' +
        '</div>' +
      '</li>'
    );
  }

  function renderLista(alvo, lista) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    if (!Array.isArray(lista) || lista.length === 0) {
      el.innerHTML = '<li class="card-assoc__vazio"><p class="texto">Nenhuma associação cadastrada.</p></li>';
      return;
    }
    el.innerHTML = lista.map(html).join("");
    var items = el.querySelectorAll(".card-assoc");
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
    var btnDesvincular = li.querySelector('[data-acao="desvincular"]');
    if (btnDesvincular && typeof item.aoDesvincular === "function") {
      btnDesvincular.addEventListener("click", function () { item.aoDesvincular(item); });
    }
  }

  global.CardAssociacao = { render: render, renderLista: renderLista };
})(window);