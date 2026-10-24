(function () {
  "use strict";

  var POR_PAGINA = 10;

  /* ---- Dados de exemplo (trocar pela API depois) ---- */
  var NOMES = ["Jean Martin", "João Silva", "Felipe Martins", "Maria Rodriguez", "Ana Souza", "Carlos Lima",
               "Luiza Prado", "Pedro Alves", "Sofia Moreau", "Rafael Costa", "Camila Torres", "Diego Herrera"];
  var MENSAGENS = [
    "Olá! Gostaria de saber como altero meu e-mail de cadastro, pois não tenho mais acesso a ele. Podem ajudar, por favor?",
    "Estou tendo problemas para enviar o meu certificado de capacitação. O sistema não aceita o arquivo PDF.",
    "Não estou conseguindo entrar em contato com o meu MIGUFU, o número está desatualizado.",
    "Olá! Tem alguma informação pendente no meu cadastro para conseguir um MIGUFU?"
  ];
  var TEMPOS = ["10m atrás", "2h atrás", "Ontem", "2 dias atrás", "3 dias atrás", "1 semana atrás"];

  function gerar(qtd, status, inicioId) {
    var lista = [];
    for (var i = 0; i < qtd; i++) {
      var nome = NOMES[i % NOMES.length];
      lista.push({
        id: inicioId + i,
        nome: nome,
        perfil: i % 2 === 0 ? "estudante" : "voluntario",
        email: nome.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@ufu.br",
        telefone: "+55 34 9" + (1000 + i * 7) + "-" + (2000 + i * 13),
        mensagem: MENSAGENS[i % MENSAGENS.length],
        tempo: TEMPOS[Math.min(i, TEMPOS.length - 1)],
        status: status
      });
    }
    return lista;
  }

  var chamados = gerar(23, "pendente", 1).concat(gerar(14, "resolvido", 100));

  /* ---- Estado ---- */
  var principal = document.querySelector("main[data-status]");
  var STATUS = principal.getAttribute("data-status"); // "pendente" | "resolvido"
  var MQ_DESKTOP = window.matchMedia("(min-width: 900px)");
  var estado = { pagina: 1, busca: "", selecionadoId: null };

  function filtrados() {
    var termo = estado.busca.toLowerCase();
    return chamados.filter(function (c) {
      if (c.status !== STATUS) return false;
      if (!termo) return true;
      return c.nome.toLowerCase().indexOf(termo) !== -1 ||
             c.email.toLowerCase().indexOf(termo) !== -1;
    });
  }

  function porId(id) {
    return chamados.filter(function (c) { return c.id === id; })[0] || null;
  }

  function renderTudo() {
    var raiz = document.getElementById("suporte");
    var lista = filtrados();
    var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;

    var inicio = (estado.pagina - 1) * POR_PAGINA;
    var itens = lista.slice(inicio, inicio + POR_PAGINA);

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
      total: lista.length,
      porPagina: POR_PAGINA,
      paginaAtual: estado.pagina,
      aoMudar: function (p) {
        estado.pagina = p;
        estado.selecionadoId = null;
        renderTudo();
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

  function resolver(c) {
    Modal.confirmar({
      titulo: "Marcar como resolvido",
      mensagem: "Deseja marcar o chamado de " + c.nome + " como resolvido?",
      textoConfirmar: "SIM, RESOLVER",
      perigo: false,
      aoConfirmar: function () {
        c.status = "resolvido";
        estado.selecionadoId = null;
        renderTudo();
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

    document.getElementById("busca-chamado").addEventListener("input", function (e) {
      estado.busca = e.target.value.trim();
      estado.pagina = 1;
      estado.selecionadoId = null;
      renderTudo();
    });

    var aoMudarTela = function () { renderTudo(); };
    if (MQ_DESKTOP.addEventListener) MQ_DESKTOP.addEventListener("change", aoMudarTela);
    else MQ_DESKTOP.addListener(aoMudarTela);

    renderTudo();
  });
})();