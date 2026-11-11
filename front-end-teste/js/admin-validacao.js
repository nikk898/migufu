(function () {
  "use strict";

  /* Dados vindos de GET /api/admin/validacao (voluntários com certificado pendente).
     Cada item: { id, nome, email, cpf, curso, nome_arquivo, data_envio } */
  var pendentes = [];
  var termoBusca = "";
  var timerBusca = null;
  var requisicaoAtual = 0;

  function erro(e) { alert(e.message); }

  /* GET /api/admin/validacao?busca=  (busca por nome, e-mail ou CPF no servidor) */
  function carregar() {
    var numero = ++requisicaoAtual; // ignora respostas antigas (digitação rápida)
    return Api.chamar("/admin/validacao?busca=" + encodeURIComponent(termoBusca))
      .then(function (lista) {
        if (numero !== requisicaoAtual) return;
        pendentes = lista;
        renderizar();
      })
      .catch(erro);
  }

  /* GET /api/admin/validacao/:id/certificado
     A aba é aberta antes da requisição para o navegador não bloquear como pop-up. */
  function visualizarArquivo(item) {
    var aba = window.open("", "_blank");
    Api.baixar("/admin/validacao/" + item.id + "/certificado")
      .then(function (r) {
        if (r.url) {                       // o banco guarda um link: abre o link
          if (aba) aba.location.href = r.url;
          else window.location.href = r.url;
          return;
        }
        var url = URL.createObjectURL(r.blob);
        if (aba) {
          aba.location.href = url;         // PDF abre no visualizador do navegador
        } else {                           // pop-up bloqueado: baixa o arquivo
          var a = document.createElement("a");
          a.href = url;
          a.download = r.nome;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      })
      .catch(function (e) {
        if (aba) aba.close();
        erro(e);
      });
  }

  /* PUT /api/admin/validacao/:id  body: { decisao } — só tira da lista depois que a API confirmar */
  function decidir(item, decisao) {
    return Api.chamar("/admin/validacao/" + item.id, { method: "PUT", body: { decisao: decisao } })
      .then(function () {
        pendentes = pendentes.filter(function (v) { return v.id !== item.id; });
        renderizar();
      })
      .catch(erro);
  }

  function aprovarVoluntario(item) {
    Modal.confirmar({
      titulo: "Marcar como Apto",
      mensagem: "Deseja aprovar o certificado de " + item.nome + " e marcá-lo(a) como apto?",
      textoConfirmar: "MARCAR COMO APTO",
      perigo: false,
      aoConfirmar: function () { decidir(item, "aprovar"); }
    });
  }

  function reprovarVoluntario(item) {
    Modal.confirmar({
      titulo: "Reprovar Certificado",
      mensagem: "Tem certeza que deseja reprovar o certificado de " + item.nome + "?",
      textoConfirmar: "REPROVAR",
      perigo: true,
      aoConfirmar: function () { decidir(item, "reprovar"); }
    });
  }

  function renderizar() {
    var listaComAcoes = pendentes.map(function (v) {
      return Object.assign({}, v, {
        nomeArq: v.nome_arquivo,
        aoVisualizar: function () { visualizarArquivo(v); },
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

    // Espera parar de digitar (300 ms) para não chamar a API a cada letra
    var inputBusca = document.querySelector('[data-val="busca"]');
    if (inputBusca) {
      inputBusca.addEventListener("input", function () {
        var valor = inputBusca.value.trim();
        clearTimeout(timerBusca);
        timerBusca = setTimeout(function () {
          termoBusca = valor;
          carregar();
        }, 300);
      });
    }

    carregar();
  });
})();
