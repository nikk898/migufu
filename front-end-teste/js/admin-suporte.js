(function () {
  "use strict";

  var POR_PAGINA = 10; // igual ao porPagina da rota GET /api/suporte

  /* ---- Estado ---- */
  var principal = document.querySelector("main[data-status]");
  var STATUS = principal.getAttribute("data-status"); // "pendente" | "resolvido"
  var MQ_DESKTOP = window.matchMedia("(min-width: 900px)");
  // itens = página atual (vem da API); total = quantos chamados existem no filtro
  var estado = { pagina: 1, busca: "", selecionadoId: null, itens: [], total: 0 };
  var timerBusca = null;
  var requisicaoAtual = 0;

  /* O mock trazia "tempo" pronto; agora calculamos a partir de criado_em */
  function tempoRelativo(iso) {
    var min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 60) return min < 1 ? "agora" : min + "m atrás";
    var h = Math.floor(min / 60);
    if (h < 24) return h + "h atrás";
    var d = Math.floor(h / 24);
    if (d === 1) return "Ontem";
    if (d < 7) return d + " dias atrás";
    var s = Math.floor(d / 7);
    if (s < 5) return s === 1 ? "1 semana atrás" : s + " semanas atrás";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  /* GET /api/suporte?status=&pagina=&busca= */
  function carregar() {
    var numero = ++requisicaoAtual; // ignora respostas antigas (ex.: digitação rápida na busca)
    var q = "?status=" + STATUS + "&pagina=" + estado.pagina +
            "&busca=" + encodeURIComponent(estado.busca);

    return Api.chamar("/suporte" + q).then(function (r) {
      if (numero !== requisicaoAtual) return;
      // a página ficou vazia (ex.: resolveu o último item dela): volta uma
      if (!r.itens.length && estado.pagina > 1) {
        estado.pagina -= 1;
        return carregar();
      }
      estado.total = r.total;
      estado.itens = r.itens.map(function (c) {
        c.tempo = tempoRelativo(c.criado_em);
        c.status = STATUS; // o card de detalhe usa para mostrar o botão "resolver"
        return c;
      });
      renderTudo();
    }).catch(function (e) { alert(e.message); });
  }

  function porId(id) {
    return estado.itens.filter(function (c) { return c.id === id; })[0] || null;
  }

  function renderTudo() {
    var raiz = document.getElementById("suporte");
    var itens = estado.itens;

    if (MQ_DESKTOP.matches) {
      var visivel = itens.some(function (c) { return c.id === estado.selecionadoId; });
      if (!visivel) estado.selecionadoId = itens.length ? itens[0].id : null;
      raiz.classList.remove("suporte--detalhe");
    } else {
      raiz.classList.toggle("suporte--detalhe", estado.selecionadoId !== null);
    }

    CardChamado.renderLista("#lista-chamados", itens, {
      selecionadoId: MQ_DESKTOP.matches ? estado.selecionadoId : null,
      textoVazio: STATUS === "pendente" ? "Nenhum chamado pendente." : "Nenhum chamado resolvido.",
      aoSelecionar: function (c) {
        estado.selecionadoId = c.id;
        renderTudo();
      }
    });

    Paginacao.render("#paginacao", {
      total: estado.total,
      porPagina: POR_PAGINA,
      paginaAtual: estado.pagina,
      aoMudar: function (p) {
        estado.pagina = p;
        estado.selecionadoId = null;
        carregar();
        window.scrollTo({ top: 0 });
      }
    });

    CardChamado.renderDetalhe("#detalhe-chamado", porId(estado.selecionadoId), {
      aoResolver: resolver,
      aoVoltar: function () {
        estado.selecionadoId = null;
        renderTudo();
      }
    });
  }

  /* POST /api/suporte/:id/resolver (pendente -> resolvido) */
  function resolver(c) {
    Modal.confirmar({
      titulo: "Marcar como resolvido",
      mensagem: "Deseja marcar o chamado de " + c.nome + " como resolvido?",
      textoConfirmar: "SIM, RESOLVER",
      perigo: false,
      aoConfirmar: function () {
        // só atualiza a tela depois que a API confirmar
        Api.chamar("/suporte/" + c.id + "/resolver", { method: "POST", body: {} })
          .then(function () {
            estado.selecionadoId = null;
            return carregar();
          })
          .catch(function (e) { alert(e.message); });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "ajuda",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Ajuda e Suporte" });

    // Espera a pessoa parar de digitar (300 ms) para não chamar a API a cada letra
    document.getElementById("busca-chamado").addEventListener("input", function (e) {
      var valor = e.target.value.trim();
      clearTimeout(timerBusca);
      timerBusca = setTimeout(function () {
        estado.busca = valor;
        estado.pagina = 1;
        estado.selecionadoId = null;
        carregar();
      }, 300);
    });

    var aoMudarTela = function () { renderTudo(); };
    if (MQ_DESKTOP.addEventListener) MQ_DESKTOP.addEventListener("change", aoMudarTela);
    else MQ_DESKTOP.addListener(aoMudarTela);

    carregar();
  });
})();
