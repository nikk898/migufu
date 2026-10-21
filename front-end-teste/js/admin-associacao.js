(function () {
  "use strict";

  // Listando os estudantes disponíveis
  var estudantesMock = [
    {
      id: 1,
      nome: "Jean Martin",
      curso: "Sistemas de Informação",
      idiomas: "Francês (Nativo), Inglês (Intermediário)",
      tags: "Jogos de tabuleiro, música, parques, corrida, animes",
      vinculos: [
        { id: 101, nome: "Felipe Martins", curso: "Não se aplica" },
        { id: 102, nome: "João Silva", curso: "Sistemas de Informação" }
      ],
      filtros: ["Sistemas de Informação", "Francês (básico)", "Inglês (Intermediário)", "Parques"]
    },
    {
      id: 2,
      nome: "Maria Rodriguez",
      curso: "Ciências Contábeis",
      idiomas: "Espanhol (nativo), Português (básico)",
      tags: "Fotografia, culinária, viagens, séries, natação",
      vinculos: [],
      filtros: ["Ciências Contábeis", "Espanhol (Nativo)", "Viagens"]
    }
  ];

  // Listando os voluntários
  var voluntariosMock = [
    {
      id: 101,
      nome: "Felipe Martins",
      curso: "Não se aplica",
      idiomas: "Português (Nativo), Inglês (Intermediário)",
      tags: "Esportes, videogame, natação, parques"
    },
    {
      id: 102,
      nome: "João Silva",
      curso: "Sistemas de Informação",
      idiomas: "Português (Nativo), Inglês (Intermediário)",
      tags: "Jogos de tabuleiro, festas, crochê, esportes"
    }
  ];

  var estudanteSelecionado = null;
  var termoBusca = "";

  function obterIniciais(nome) {
    if (!nome) return "??";
    var partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  function escaping(texto) {
    var el = document.createElement("span");
    el.textContent = texto != null ? String(texto) : "";
    return el.innerHTML;
  }

  
  function confirmarVinculacao(estudante, voluntario, aoConfirmarSucesso) {
    Modal.confirmar({
      titulo: "Vincular " + voluntario.nome + " a " + estudante.nome + "?",
      mensagem: "",
      textoConfirmar: "VINCULAR",
      perigo: false,
      aoConfirmar: function () {
        if (aoConfirmarSucesso) aoConfirmarSucesso();
      }
    });
  }

  
  function confirmarDesvinculacao(estudante, voluntario, aoConfirmarSucesso) {
    Modal.confirmar({
      titulo: "Desvincular " + voluntario.nome + " a " + estudante.nome + "?",
      mensagem: "",
      textoConfirmar: "DESVINCULAR",
      perigo: true,
      aoConfirmar: function () {
        estudante.vinculos = estudante.vinculos.filter(function (v) { return v.id !== voluntario.id; });
        if (aoConfirmarSucesso) aoConfirmarSucesso();
      }
    });
  }


  function abrirModalVinculos(estudante) {
    var modal = Modal.criar({
      titulo: "Estudantes vinculados a:\n" + estudante.nome,
      aoFechar: function () { modal.destruir(); }
    });

    function renderizarCorpoModal() {
      var temVinculos = estudante.vinculos && estudante.vinculos.length > 0;

      var htmlCardsVinculos = temVinculos
        ? '<div class="modal-vinculos__grid">' +
            estudante.vinculos.map(function (v) {
              return (
                '<div class="card-vinc-item">' +
                  '<div class="card-vinc-item__avatar">' + obterIniciais(v.nome) + '</div>' +
                  '<div class="card-vinc-item__info">' +
                    '<h4>' + escaping(v.nome) + '</h4>' +
                    '<p><strong>Curso:</strong> ' + escaping(v.curso) + '</p>' +
                  '</div>' +
                  '<button type="button" class="card-vinc-item__btn-lixo" data-vinc-id="' + v.id + '" aria-label="Desvincular ' + escaping(v.nome) + '">' +
                    '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
                  '</button>' +
                '</div>'
              );
            }).join("") +
          '</div>'
        : '<div class="modal-vinculos__vazio">' +
            '<svg class="icone-vazio" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>' +
            '<p>Este estudante não possui MIGUFUS vinculados a ele.</p>' +
          '</div>';

      modal.corpo.innerHTML =
        '<p class="modal-vinculos__sub">Gerencie as conexões de apadrinhamento ativas.</p>' +
        htmlCardsVinculos +
        '<div style="margin-top: 24px; text-align: right;">' +
          '<button type="button" class="botao botao--primario btn-add-vinc">ADICIONAR VÍNCULO</button>' +
        '</div>';

      modal.corpo.querySelectorAll(".card-vinc-item__btn-lixo").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = parseInt(btn.getAttribute("data-vinc-id"), 10);
          var voluntario = estudante.vinculos.find(function (item) { return item.id === id; });
          if (voluntario) {
            confirmarDesvinculacao(estudante, voluntario, function () {
              renderizarCorpoModal();
              renderizar();
            });
          }
        });
      });

      var btnAdd = modal.corpo.querySelector(".btn-add-vinc");
      if (btnAdd) {
        btnAdd.addEventListener("click", function () {
          modal.fechar();
          estudanteSelecionado = estudante;
          renderizar();
        });
      }
    }

    renderizarCorpoModal();
    modal.abrir();
  }

  function renderizar() {
    var containerPainel = document.getElementById("painel-selecao-estudante");
    var containerFiltros = document.getElementById("painel-filtros-ativos");
    var listaContainer = document.getElementById("lista-associacoes");

   
    if (estudanteSelecionado) {
      containerPainel.style.display = "block";
      containerPainel.innerHTML =
        '<div class="card card-estudante-fixado">' +
          '<button type="button" class="btn-fechar-fixado" id="btn-desmarcar" aria-label="Fechar seleção">&times;</button>' +
          '<div class="card-estudante-fixado__corpo">' +
            '<div class="card-assoc-est__avatar">' + obterIniciais(estudanteSelecionado.nome) + '</div>' +
            '<div class="card-estudante-fixado__detalhes">' +
              '<span class="card-estudante-fixado__rotulo">Estudante Internacional</span>' +
              '<h3 class="card-estudante-fixado__nome">' + escaping(estudanteSelecionado.nome) + '</h3>' +
              '<div class="card-estudante-fixado__grid">' +
                '<p><strong>Curso:</strong> ' + escaping(estudanteSelecionado.curso) + '</p>' +
                '<p><strong>Idiomas:</strong> ' + escaping(estudanteSelecionado.idiomas) + '</p>' +
                '<p><strong>Tags:</strong> ' + escaping(estudanteSelecionado.tags) + '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.getElementById("btn-desmarcar").addEventListener("click", function () {
        estudanteSelecionado = null;
        renderizar();
      });

      
      containerFiltros.style.display = "block";
      var htmlChipsFiltros = (estudanteSelecionado.filtros || []).map(function (f, index) {
        return (
          '<span class="chip-filtro-ativo">' +
            escaping(f) +
            ' <button type="button" class="btn-remover-filtro" data-filtro-index="' + index + '" aria-label="Remover ' + escaping(f) + '">&times;</button>' +
          '</span>'
        );
      }).join("");

      containerFiltros.innerHTML =
        '<h3 class="filtros-ativos__titulo">Filtros Ativos</h3>' +
        '<div class="filtros-ativos__lista">' +
          '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;fill:#667085;"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
          htmlChipsFiltros +
          '<div class="filtros-ativos__novo">' +
            '<input type="text" id="input-novo-filtro" placeholder="Adicionar filtro..." class="campo__entrada-filtro">' +
            '<button type="button" id="btn-add-filtro" class="btn-add-filtro-chip">+</button>' +
          '</div>' +
        '</div>';

      containerFiltros.querySelectorAll(".btn-remover-filtro").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = parseInt(btn.getAttribute("data-filtro-index"), 10);
          estudanteSelecionado.filtros.splice(idx, 1);
          renderizar();
        });
      });

      function adicionarFiltro() {
        var input = document.getElementById("input-novo-filtro");
        if (!input) return;
        var valor = input.value.trim();
        if (valor) {
          if (!estudanteSelecionado.filtros) estudanteSelecionado.filtros = [];
          estudanteSelecionado.filtros.push(valor);
          renderizar();
        }
      }

      var btnAddFiltro = document.getElementById("btn-add-filtro");
      var inputNovoFiltro = document.getElementById("input-novo-filtro");

      if (btnAddFiltro) btnAddFiltro.addEventListener("click", adicionarFiltro);
      if (inputNovoFiltro) {
        inputNovoFiltro.addEventListener("keypress", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            adicionarFiltro();
          }
        });
      }

      
      var filtradosVol = voluntariosMock.filter(function (v) {
        if (!termoBusca) return true;
        var b = termoBusca.toLowerCase();
        return v.nome.toLowerCase().indexOf(b) !== -1 || v.curso.toLowerCase().indexOf(b) !== -1;
      });

      listaContainer.innerHTML = filtradosVol.map(function (vol) {
        var jaVinculado = estudanteSelecionado.vinculos.some(function (v) { return v.id === vol.id; });
        return (
          '<li class="card card-assoc-est">' +
            '<div class="card-assoc-est__topo">' +
              '<div class="card-assoc-est__avatar">' + obterIniciais(vol.nome) + '</div>' +
              '<h3 class="card-assoc-est__nome">' + escaping(vol.nome) + '</h3>' +
              (jaVinculado ? '<span class="badge-vinculado">Vinculado</span>' : '') +
            '</div>' +

            '<div class="card-assoc-est__corpo">' +
              '<p class="card-assoc-est__linha"><strong>Curso:</strong> ' + escaping(vol.curso) + '</p>' +
              '<p class="card-assoc-est__linha"><strong>Idiomas:</strong> ' + escaping(vol.idiomas) + '</p>' +
              '<p class="card-assoc-est__linha"><strong>Tags:</strong> ' + escaping(vol.tags) + '</p>' +
            '</div>' +

            '<div style="margin-top: 12px;">' +
              (jaVinculado
                ? '<button type="button" class="botao botao--secundario btn-desvincular-op" data-vol-id="' + vol.id + '">DESVINCULAR</button>'
                : '<button type="button" class="botao botao--primario btn-vincular-op" data-vol-id="' + vol.id + '">VINCULAR</button>') +
            '</div>' +
          '</li>'
        );
      }).join("");

      listaContainer.querySelectorAll("button[data-vol-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = parseInt(btn.getAttribute("data-vol-id"), 10);
          var vol = voluntariosMock.find(function (item) { return item.id === id; });
          if (!vol) return;

          var jaVinculado = estudanteSelecionado.vinculos.some(function (v) { return v.id === vol.id; });
          if (jaVinculado) {
            confirmarDesvinculacao(estudanteSelecionado, vol, function () { renderizar(); });
          } else {
            confirmarVinculacao(estudanteSelecionado, vol, function () {
              estudanteSelecionado.vinculos.push({ id: vol.id, nome: vol.nome, curso: vol.curso });
              renderizar();
            });
          }
        });
      });

    } else {
      
      containerPainel.style.display = "none";
      containerFiltros.style.display = "none";

      var filtradosEst = estudantesMock.filter(function (e) {
        if (!termoBusca) return true;
        var b = termoBusca.toLowerCase();
        return e.nome.toLowerCase().indexOf(b) !== -1 || e.curso.toLowerCase().indexOf(b) !== -1;
      });

      var listaComAcoes = filtradosEst.map(function (e) {
        return Object.assign({}, e, {
          comVinculo: e.vinculos && e.vinculos.length > 0,
          aoVincular: function () {
            abrirModalVinculos(e);
          }
        });
      });

      CardEstudanteVinc.renderLista("#lista-associacoes", listaComAcoes);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "migufus",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Gestão MIGUFU" });

    var inputBusca = document.querySelector('[data-assoc="busca"]');
    if (inputBusca) {
      inputBusca.addEventListener("input", function () {
        termoBusca = inputBusca.value.trim();
        renderizar();
      });
    }

    renderizar();
  });
})();