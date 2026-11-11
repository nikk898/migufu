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
    var v = dados || {};
    var nomeArq = v.nomeArq || "certificado_migufu.pdf";

    return (
      '<li class="card card-val" style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--cor-fundo-02); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); width: 100%; max-width: 340px;">' +
        /* Cabeçalho*/
        '<div class="card-val__topo" style="display: flex; align-items: center; gap: 12px;">' +
          '<div class="card-val__avatar" style="width: 52px; height: 52px; border-radius: 50%; background-color: #d0d5dd; color: #101828; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0;" aria-hidden="true">' + 
            obterIniciais(v.nome) + 
          '</div>' +
          '<h3 class="card-val__nome" style="margin: 0; font-size: 20px; line-height: 24px; font-weight: 700; color: #000000;">' + 
            escaping(v.nome) + 
          '</h3>' +
        '</div>' +

        /* Corpo*/
        '<div class="card-val__corpo" style="display: flex; flex-direction: column; gap: 4px;">' +
          '<p class="card-val__linha" style="margin: 0; font-size: 13px; line-height: 18px; color: #101828;">' +
            '<strong>Curso:</strong> ' + escaping(v.curso) + 
          '</p>' +
          '<p class="card-val__linha" style="margin: 0; font-size: 13px; line-height: 18px; color: #101828; display: flex; align-items: center; gap: 4px;">' +
            '<strong>Arquivo:</strong> ' + escaping(nomeArq) + ' ' +
            '<svg class="icone" style="width: 16px; height: 16px; fill: #101828;" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>' +
          '</p>' +
        '</div>' +

        /* Ações*/
        '<div class="card-val__acoes" style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">' +
          '<a href="' + escaping(v.urlArq || "#") + '" target="_blank" rel="noopener" class="botao botao--secundario" data-acao="visualizar" style="height: 38px; font-size: 12px; font-weight: 700; border-radius: 8px; text-decoration: none;">' +
            'VISUALIZAR ARQUIVO' +
          '</a>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button type="button" class="botao botao--perigo" style="flex: 1; height: 40px; font-size: 11px; font-weight: 700; border-radius: 8px; padding: 0 4px;" data-acao="reprovar">REPROVAR</button>' +
            '<button type="button" class="botao" style="flex: 1; height: 40px; font-size: 11px; font-weight: 700; border-radius: 8px; padding: 0 4px; background-color: #28a745 !important; border-color: #28a745 !important; color: #ffffff !important;" data-acao="aprovar">MARCAR COMO APTO</button>' +
          '</div>' +
        '</div>' +
      '</li>'
    );
  }

  function renderLista(alvo, lista) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    if (!Array.isArray(lista) || lista.length === 0) {
      el.innerHTML = '<li class="card-val__vazio"><p class="texto">Nenhum certificado pendente.</p></li>';
      return;
    }
    el.innerHTML = lista.map(html).join("");
    var items = el.querySelectorAll(".card-val");
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
    var btnAprovar = li.querySelector('[data-acao="aprovar"]');
    var btnReprovar = li.querySelector('[data-acao="reprovar"]');
    var linkArquivo = li.querySelector('[data-acao="visualizar"]');

    // Arquivo protegido por login: a página busca com o token em vez de abrir o link direto
    if (linkArquivo && typeof item.aoVisualizar === "function") {
      linkArquivo.addEventListener("click", function (e) {
        e.preventDefault();
        item.aoVisualizar(item);
      });
    }

    if (btnAprovar && typeof item.aoAprovar === "function") {
      btnAprovar.addEventListener("click", function () { item.aoAprovar(item); });
    }
    if (btnReprovar && typeof item.aoReprovar === "function") {
      btnReprovar.addEventListener("click", function () { item.aoReprovar(item); });
    }
  }

  global.CardValCertificado = { render: render, renderLista: renderLista };
})(window);