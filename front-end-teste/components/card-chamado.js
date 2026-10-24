(function (global) {
  "use strict";

  function esc(texto) {
    var el = document.createElement("span");
    el.textContent = texto != null ? String(texto) : "";
    return el.innerHTML;
  }

  function iniciais(nome) {
    var p = (nome || "").trim().split(/\s+/);
    if (!p[0]) return "??";
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
  }

  function etiqueta(perfil) {
    return perfil === "estudante"
      ? '<span class="etiqueta etiqueta--estudante">Estudante Internacional</span>'
      : '<span class="etiqueta etiqueta--voluntario">Voluntário</span>';
  }

  var ICONE_EMAIL = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>';
  var ICONE_EMAIL_CONTATO = ICONE_EMAIL.replace('class="icone"', 'class="icone detalhe-chamado__contato-icone"');
  var ICONE_TEL = '<svg class="icone detalhe-chamado__contato-icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"/></svg>';
  var ICONE_CHECK = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

  function resolver(alvo) {
    return typeof alvo === "string" ? document.querySelector(alvo) : alvo;
  }

  /* ---------- Card da LISTA ---------- */
  function html(c, selecionado) {
    return (
      '<li>' +
        '<button type="button" class="card card-chamado' + (selecionado ? " is-selecionado" : "") + '" data-id="' + esc(c.id) + '"' +
          (selecionado ? ' aria-current="true"' : "") + '>' +
          '<div class="card-chamado__topo">' +
            '<div class="avatar" aria-hidden="true">' + iniciais(c.nome) + '</div>' +
            '<div class="card-chamado__info">' +
              '<span class="card-chamado__nome">' + esc(c.nome) + '</span>' +
              etiqueta(c.perfil) +
            '</div>' +
            '<span class="card-chamado__tempo">' + esc(c.tempo) + '</span>' +
          '</div>' +
          '<p class="card-chamado__msg">' + esc(c.mensagem) + '</p>' +
        '</button>' +
      '</li>'
    );
  }

  /*
    CardChamado.renderLista("#lista-chamados", lista, {
      selecionadoId: 1,
      textoVazio: "Nenhum chamado.",
      aoSelecionar: function (chamado) {}
    });
  */
  function renderLista(alvo, lista, opcoes) {
    var el = resolver(alvo);
    if (!el) return;
    var o = opcoes || {};

    if (!Array.isArray(lista) || lista.length === 0) {
      el.innerHTML = '<li class="card-chamado__vazio">' + esc(o.textoVazio || "Nenhum chamado encontrado.") + '</li>';
      el.onclick = null;
      return;
    }

    el.innerHTML = lista.map(function (c) {
      return html(c, String(c.id) === String(o.selecionadoId));
    }).join("");

    el.onclick = function (e) {
      var btn = e.target.closest("[data-id]");
      if (!btn || typeof o.aoSelecionar !== "function") return;
      var id = btn.getAttribute("data-id");
      var escolhido = lista.filter(function (c) { return String(c.id) === id; })[0];
      if (escolhido) o.aoSelecionar(escolhido);
    };
  }

  /* ---------- Card de DETALHE ---------- */
  /*
    CardChamado.renderDetalhe("#detalhe-chamado", chamado, {
      aoResolver: function (chamado) {},   // só aparece se o chamado estiver pendente
      aoVoltar: function () {}             // botão "Voltar para a lista" (mobile)
    });
  */
  function renderDetalhe(alvo, c, opcoes) {
    var el = resolver(alvo);
    if (!el) return;
    var o = opcoes || {};

    if (!c) {
      el.innerHTML = '<p class="detalhe-chamado__vazio">Selecione um chamado para ver os detalhes.</p>';
      el.onclick = null;
      return;
    }

    var pendente = c.status === "pendente";
    var mailto = "mailto:" + esc(c.email);

    var chip = pendente
      ? '<span class="chip chip--pendente detalhe-chamado__status"><span class="chip__ponto"></span>Pendente</span>'
      : '<span class="chip chip--sucesso detalhe-chamado__status"><span class="chip__ponto"></span>Resolvido</span>';

    var botoes = "";
    if (pendente) {
      botoes += '<button type="button" class="botao detalhe-chamado__btn-resolver" data-acao="resolver">SIM, MARCAR COMO RESOLVIDO ' + ICONE_CHECK + '</button>';
    }
    botoes += '<a class="botao botao--secundario" href="' + mailto + '">RESPONDER POR E-MAIL ' + ICONE_EMAIL + '</a>';
    botoes += '<button type="button" class="botao botao--secundario detalhe-chamado__btn-voltar" data-acao="voltar">VOLTAR PARA A LISTA</button>';

    el.innerHTML =
      '<div class="detalhe-chamado">' +
        chip +
        '<div class="detalhe-chamado__bloco">' +
          '<div class="detalhe-chamado__pessoa">' +
            '<div class="avatar" aria-hidden="true">' + iniciais(c.nome) + '</div>' +
            '<div class="card-chamado__info">' +
              '<h3 class="detalhe-chamado__nome">' + esc(c.nome) + '</h3>' +
              etiqueta(c.perfil) +
            '</div>' +
            '<a class="detalhe-chamado__icone-email" href="' + mailto + '" aria-label="Enviar e-mail para ' + esc(c.nome) + '">' + ICONE_EMAIL + '</a>' +
            '<span class="detalhe-chamado__tempo-topo">' + esc(c.tempo) + '</span>' +
          '</div>' +
          '<div class="detalhe-chamado__contatos">' +
            '<p class="detalhe-chamado__contato">' + ICONE_EMAIL_CONTATO + '<strong class="detalhe-chamado__rotulo">E-mail:&nbsp;</strong>' + esc(c.email) + '</p>' +
            '<p class="detalhe-chamado__contato">' + ICONE_TEL + '<strong class="detalhe-chamado__rotulo">Telefone:&nbsp;</strong>' + esc(c.telefone) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="detalhe-chamado__bloco detalhe-chamado__bloco--msg">' +
          '<p class="detalhe-chamado__mensagem">' + esc(c.mensagem) + '</p>' +
          '<span class="detalhe-chamado__tempo">' + esc(c.tempo) + '</span>' +
        '</div>' +
        '<div class="detalhe-chamado__bloco detalhe-chamado__bloco--acoes">' +
          (pendente ? '<p class="detalhe-chamado__pergunta">O problema foi resolvido?</p>' : "") +
          '<div class="detalhe-chamado__botoes">' + botoes + '</div>' +
        '</div>' +
      '</div>';

    el.onclick = function (e) {
      var btn = e.target.closest("[data-acao]");
      if (!btn) return;
      var acao = btn.getAttribute("data-acao");
      if (acao === "resolver" && typeof o.aoResolver === "function") o.aoResolver(c);
      if (acao === "voltar" && typeof o.aoVoltar === "function") o.aoVoltar();
    };
  }

  global.CardChamado = { html: html, renderLista: renderLista, renderDetalhe: renderDetalhe };
})(window);