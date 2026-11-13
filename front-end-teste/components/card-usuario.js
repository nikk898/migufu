(function (global) {
  "use strict";

  var ICONE_LIXEIRA = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>';
  var ICONE_MAIS = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';

  var STATUS = {
    apto: { rotulo: "Apto", classe: "apto" },
    nao_apto: { rotulo: "Não Apto", classe: "nao-apto" },
    vinculado: { rotulo: "Vinculado", classe: "vinculado" },
    sem_vinculo: { rotulo: "Sem vínculo", classe: "pendente" },
    pendente: { rotulo: "Certificado pendente", classe: "pendente" }
  };

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function iniciais(nome) {
    var p = (nome || "").trim().split(/\s+/);
    if (!p[0]) return "??";
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
  }

  function urlPadrao(u) {
    return "admin-usuario.html?id=" + encodeURIComponent(u.id);
  }

  function html(u, urlDetalhe, mostrarOpcaoCertificado) {
    var st = STATUS[u.status] || {
      rotulo: u.status || "—",
      classe: "vinculado"
    };
    var url = (urlDetalhe || urlPadrao)(u);

    var menu = mostrarOpcaoCertificado
      ? '<div class="card-usuario__menu" hidden>' +
          '<button type="button" class="card-usuario__menu-item" data-acao="certificado-pendente">' +
            'Solicitar novo certificado' +
          '</button>' +
        '</div>'
      : "";

    return (
      '<li>' +
        '<article class="card card-usuario" data-id="' + esc(u.id) + '">' +
          '<div class="card-usuario__topo">' +
            '<div class="card-usuario__avatar" aria-hidden="true">' + iniciais(u.nome) + '</div>' +
            '<h3 class="card-usuario__nome">' +
              '<a class="card-usuario__link" href="' + esc(url) + '">' + esc(u.nome) + '</a>' +
            '</h3>' +
            '<div class="card-usuario__icones">' +
              '<button type="button" class="card-usuario__icone-btn" data-acao="excluir" aria-label="Excluir ' + esc(u.nome) + '">' + ICONE_LIXEIRA + '</button>' +
              (mostrarOpcaoCertificado
                ? '<div class="card-usuario__menu-wrap">' +
                    '<button type="button" class="card-usuario__icone-btn" data-acao="mais" aria-label="Mais opções de ' + esc(u.nome) + '" aria-expanded="false">' + ICONE_MAIS + '</button>' +
                    menu +
                  '</div>'
                : '') +
            '</div>' +
          '</div>' +
          '<p class="card-usuario__linha"><strong>E-mail:</strong> ' + esc(u.email) + '</p>' +
          '<p class="card-usuario__linha"><strong>Curso:</strong> ' + esc(u.curso) + '</p>' +
          '<span class="chip card-usuario__status card-usuario__status--' + st.classe + '">' +
            '<span class="chip__ponto"></span>' + esc(st.rotulo) +
          '</span>' +
        '</article>' +
      '</li>'
    );
  }

  function fecharMenus(el) {
    el.querySelectorAll(".card-usuario__menu").forEach(function (menu) {
      menu.hidden = true;
    });
    el.querySelectorAll('[data-acao="mais"]').forEach(function (botao) {
      botao.setAttribute("aria-expanded", "false");
    });
  }

  function renderLista(alvo, lista, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    var o = opcoes || {};

    if (!Array.isArray(lista) || lista.length === 0) {
      el.innerHTML = '<li class="card-usuario__vazio">' +
        esc(o.textoVazio || "Nenhum usuário encontrado.") + '</li>';
      el.onclick = null;
      return;
    }

    el.innerHTML = lista.map(function (u) {
      return html(u, o.urlDetalhe, !!o.mostrarOpcaoCertificado);
    }).join("");

    el.onclick = function (e) {
      var btn = e.target.closest("[data-acao]");
      if (!btn) return;

      var card = btn.closest("[data-id]");
      var id = card && card.getAttribute("data-id");
      var usuario = lista.filter(function (u) {
        return String(u.id) === id;
      })[0];
      if (!usuario) return;

      var acao = btn.getAttribute("data-acao");

      if (acao === "mais") {
        var menu = card.querySelector(".card-usuario__menu");
        var abrir = menu && menu.hidden;
        fecharMenus(el);
        if (menu && abrir) {
          menu.hidden = false;
          btn.setAttribute("aria-expanded", "true");
        }
        return;
      }

      if (acao === "certificado-pendente") {
        fecharMenus(el);
        if (typeof o.aoMais === "function") o.aoMais(usuario);
        return;
      }

      if (acao === "excluir" && typeof o.aoExcluir === "function") {
        o.aoExcluir(usuario);
      }
    };
  }

  // Fecha o menu ao clicar fora dele.
  document.addEventListener("click", function (e) {
    if (e.target.closest(".card-usuario__menu-wrap")) return;
    document.querySelectorAll(".card-usuario__menu").forEach(function (menu) {
      menu.hidden = true;
    });
    document.querySelectorAll('[data-acao="mais"]').forEach(function (botao) {
      botao.setAttribute("aria-expanded", "false");
    });
  });

  global.CardUsuario = {
    html: html,
    renderLista: renderLista
  };
})(window);
