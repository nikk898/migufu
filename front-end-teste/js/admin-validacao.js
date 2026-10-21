(function () {
  "use strict";

  var pendentesMock = [
    {
      id: 1,
      nome: "João Silva",
      curso: "Sistemas de Informação",
      nomeArq: "certificado_migufu.pdf",
      urlArq: "#"
    },
    {
      id: 2,
      nome: "Maria Silva",
      curso: "Relações Internacionais",
      nomeArq: "CERTIFICADOMIGUFU.pdf",
      urlArq: "#"
    }
  ];

  var termoBusca = "";

  function aprovarVoluntario(item) {
    Modal.confirmar({
      titulo: "Marcar como Apto",
      mensagem: "Deseja aprovar o certificado de " + item.nome + " e marcá-lo(a) como apto?",
      textoConfirmar: "MARCAR COMO APTO",
      perigo: false,
      aoConfirmar: function () {
        pendentesMock = pendentesMock.filter(function (v) { return v.id !== item.id; });
        renderizar();
      }
    });
  }

  function reprovarVoluntario(item) {
    Modal.confirmar({
      titulo: "Reprovar Certificado",
      mensagem: "Tem certeza que deseja reprovar o certificado de " + item.nome + "?",
      textoConfirmar: "REPROVAR",
      perigo: true,
      aoConfirmar: function () {
        pendentesMock = pendentesMock.filter(function (v) { return v.id !== item.id; });
        renderizar();
      }
    });
  }

  function renderizar() {
    var filtrados = pendentesMock.filter(function (v) {
      if (!termoBusca) return true;
      var busca = termoBusca.toLowerCase();
      return v.nome.toLowerCase().indexOf(busca) !== -1 ||
             v.curso.toLowerCase().indexOf(busca) !== -1;
    });

    var listaComAcoes = filtrados.map(function (v) {
      return Object.assign({}, v, {
        aoAprovar: function () { aprovarVoluntario(v); },
        aoReprovar: function () { reprovarVoluntario(v); }
      });
    });

    CardValCertificado.renderLista("#lista-validacao", listaComAcoes);
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "migufus",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Gestão MIGUFU" });

    var inputBusca = document.querySelector('[data-val="busca"]');
    if (inputBusca) {
      inputBusca.addEventListener("input", function () {
        termoBusca = inputBusca.value.trim();
        renderizar();
      });
    }

    renderizar();
  });
})();