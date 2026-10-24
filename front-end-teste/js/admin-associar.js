(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Dados de exemplo (trocar pela API depois).
     Idiomas e interesses são ESTRUTURADOS para o filtro de preferências funcionar:
       idiomas: { idDoIdioma: "nivel" }   (ex.: { frances: "nativo" })
       interesses: ["Parques", ...]
     "filtros" = filtro de preferências do estudante (formato do FiltroPreferencias).
     ------------------------------------------------------------------ */
  var estudantesMock = [
    {
      id: 1,
      nome: "Jean Martin",
      curso: "Sistemas de Informação",
      genero: "Masculino",
      idiomas: { frances: "nativo", ingles: "intermediario" },
      interesses: ["Jogos de tabuleiro", "Música", "Parques", "Animes"],
      vinculos: [
        { id: 101, nome: "Felipe Martins", curso: "Não se aplica" },
        { id: 102, nome: "João Silva", curso: "Sistemas de Informação" }
      ],
      filtros: {
        cursos: ["Sistemas de Informação"],
        interesses: ["Parques"],
        generos: [],
        idiomas: { frances: "basico", ingles: "intermediario" }
      }
    },
    {
      id: 2,
      nome: "Maria Rodriguez",
      curso: "Ciências Contábeis",
      genero: "Feminino",
      idiomas: { espanhol: "nativo", portugues: "basico" },
      interesses: ["Culinária", "Viagens", "Esportes"],
      vinculos: [],
      filtros: {
        cursos: ["Ciências Contábeis"],
        interesses: ["Viagens"],
        generos: [],
        idiomas: { espanhol: "qualquer" }
      }
    }
  ];

  var voluntariosMock = [
    { id: 101, nome: "Felipe Martins", curso: "Não se aplica", genero: "Masculino",
      idiomas: { portugues: "nativo", ingles: "intermediario" }, interesses: ["Esportes", "Tecnologia", "Parques"] },
    { id: 102, nome: "João Silva", curso: "Sistemas de Informação", genero: "Masculino",
      idiomas: { portugues: "nativo", ingles: "intermediario" }, interesses: ["Jogos de tabuleiro", "Esportes", "Parques"] },
    { id: 103, nome: "Ana Souza", curso: "Ciências Contábeis", genero: "Feminino",
      idiomas: { portugues: "nativo", espanhol: "avancado", frances: "basico" }, interesses: ["Viagens", "Culinária", "Música"] },
    { id: 104, nome: "Carlos Lima", curso: "Relações Internacionais", genero: "Masculino",
      idiomas: { portugues: "nativo", frances: "intermediario", ingles: "avancado" }, interesses: ["Cinema", "Viagens", "Leitura"] }
  ];

  // Recupera o ID do estudante da URL (ex: admin-associar.html?id=1)
  function obterEstudanteAtual() {
    var params = new URLSearchParams(window.location.search);
    var idParam = parseInt(params.get("id"), 10) || 1; // Padrão ID 1 para teste
    return estudantesMock.find(function (e) { return e.id === idParam; }) || estudantesMock[0];
  }

  var estudanteAtual = obterEstudanteAtual();
  var termoBusca = "";

  /* ---- Utilitários ---- */
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

  /* { frances: "nativo" } -> "Francês (Nativo)" */
  function textoIdiomas(mapa) {
    var O = FiltroPreferencias.OPCOES;
    return Object.keys(mapa || {}).map(function (id) {
      var idi = O.idiomas.filter(function (i) { return i.id === id; })[0];
      var niv = O.niveis.filter(function (n) { return n.id === mapa[id]; })[0];
      return (idi ? idi.nome : id) + (niv ? " (" + niv.nome + ")" : "");
    }).join(", ");
  }

  function textoTags(lista) {
    return (lista || []).join(", ");
  }

  /* ---- Confirmações ---- */
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
      titulo: "Desvincular " + voluntario.nome + " de " + estudante.nome + "?",
      mensagem: "",
      textoConfirmar: "DESVINCULAR",
      perigo: true,
      aoConfirmar: function () {
        estudante.vinculos = estudante.vinculos.filter(function (v) { return v.id !== voluntario.id; });
        if (aoConfirmarSucesso) aoConfirmarSucesso();
      }
    });
  }

  /* ---- Renderização ---- */
  function renderizar() {
    var containerPainel = document.getElementById("painel-selecao-estudante");
    var listaContainer = document.getElementById("lista-voluntarios-associar");

    // Card superior fixo com os dados do estudante
    containerPainel.innerHTML =
      '<div class="card card-estudante-fixado">' +
        '<button type="button" class="btn-voltar-associacao" id="btn-voltar">Voltar para Associações</button>' +
        '<div class="card-estudante-fixado__corpo">' +
          '<div class="card-assoc-est__avatar">' + obterIniciais(estudanteAtual.nome) + '</div>' +
          '<div class="card-estudante-fixado__detalhes">' +
            '<span class="card-estudante-fixado__rotulo">Estudante Internacional</span>' +
            '<h3 class="card-estudante-fixado__nome">' + escaping(estudanteAtual.nome) + '</h3>' +
            '<div class="card-estudante-fixado__grid">' +
              '<p><strong>Curso:</strong> ' + escaping(estudanteAtual.curso) + '</p>' +
              '<p><strong>Idiomas:</strong> ' + escaping(textoIdiomas(estudanteAtual.idiomas)) + '</p>' +
              '<p><strong>Tags:</strong> ' + escaping(textoTags(estudanteAtual.interesses)) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById("btn-voltar").addEventListener("click", function () {
      window.location.href = "admin-associacao.html";
    });

    // Filtros Ativos + modal de preferências (componente FiltroPreferencias).
    // Os filtros ficam salvos no próprio estudante.
    function aoMudarFiltros(novos) {
      estudanteAtual.filtros = novos;
      renderizar();
    }

    FiltroPreferencias.renderAtivos("#painel-filtros-ativos", estudanteAtual.filtros, {
      aoRemover: aoMudarFiltros,
      aoAbrir: function () {
        FiltroPreferencias.abrir({ filtros: estudanteAtual.filtros, aoAplicar: aoMudarFiltros });
      }
    });

    // Voluntários que combinam com a busca e com os filtros
    var filtradosVol = voluntariosMock.filter(function (v) {
      if (termoBusca) {
        var b = termoBusca.toLowerCase();
        if (v.nome.toLowerCase().indexOf(b) === -1 && v.curso.toLowerCase().indexOf(b) === -1) return false;
      }
      return FiltroPreferencias.corresponde(v, estudanteAtual.filtros);
    });

    if (!filtradosVol.length) {
      listaContainer.innerHTML = '<li class="card-assoc-est__vazio"><p class="texto">Nenhum voluntário encontrado.</p></li>';
      return;
    }

    listaContainer.innerHTML = filtradosVol.map(function (vol) {
      var jaVinculado = estudanteAtual.vinculos.some(function (v) { return v.id === vol.id; });
      return (
        '<li class="card card-assoc-est">' +
          '<div class="card-assoc-est__topo">' +
            '<div class="card-assoc-est__avatar">' + obterIniciais(vol.nome) + '</div>' +
            '<h3 class="card-assoc-est__nome">' + escaping(vol.nome) + '</h3>' +
            (jaVinculado ? '<span class="badge-vinculado">Vinculado</span>' : '') +
          '</div>' +

          '<div class="card-assoc-est__corpo">' +
            '<p class="card-assoc-est__linha"><strong>Curso:</strong> ' + escaping(vol.curso) + '</p>' +
            '<p class="card-assoc-est__linha"><strong>Idiomas:</strong> ' + escaping(textoIdiomas(vol.idiomas)) + '</p>' +
            '<p class="card-assoc-est__linha"><strong>Tags:</strong> ' + escaping(textoTags(vol.interesses)) + '</p>' +
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

        var jaVinculado = estudanteAtual.vinculos.some(function (v) { return v.id === vol.id; });
        if (jaVinculado) {
          confirmarDesvinculacao(estudanteAtual, vol, function () { renderizar(); });
        } else {
          confirmarVinculacao(estudanteAtual, vol, function () {
            estudanteAtual.vinculos.push({ id: vol.id, nome: vol.nome, curso: vol.curso });
            renderizar();
          });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "migufus",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Gestão MIGUFU" });

    var inputBusca = document.querySelector('[data-vol="busca"]');
    if (inputBusca) {
      inputBusca.addEventListener("input", function () {
        termoBusca = inputBusca.value.trim();
        renderizar();
      });
    }

    renderizar();
  });
})();