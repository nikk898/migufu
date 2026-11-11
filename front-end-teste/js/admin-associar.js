(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Dados vindos da API (routes/associar.js no back-end).
     Idiomas e interesses são ESTRUTURADOS para o filtro de preferências funcionar:
       idiomas: { idDoIdioma: "nivel" }   (ex.: { frances: "nativo" })
       interesses: ["Parques", ...]
     "filtros" = filtro de preferências do estudante (só na tela, não é salvo).
     Cada item de estudanteAtual.vinculos tem vinculo_id (para encerrar o vínculo certo).
     ------------------------------------------------------------------ */
  var estudanteAtual = null; // GET /associar/estudantes/:id
  var voluntarios = [];      // GET /associar/voluntarios
  var termoBusca = "";
  var enviando = false;      // evita clique duplo enquanto a API responde

  function erro(e) {
    enviando = false;
    alert(e.message);
  }

  /* O vínculo já foi gravado; se o e-mail falhou, só avisa o admin */
  function avisarEmail(resposta, acao) {
    if (resposta && resposta.email_enviado === false) {
      alert("Voluntário " + acao + ", mas não foi possível enviar o e-mail de aviso. " +
            "Avise o voluntário por outro meio.");
    }
  }

  /* Voluntários já vinculados que não estão mais "aptos e disponíveis" não vêm em
     GET /voluntarios; entram na lista para que o admin ainda consiga desvinculá-los. */
  function juntarVinculados() {
    estudanteAtual.vinculos.forEach(function (vinc) {
      var existe = voluntarios.some(function (v) { return v.id === vinc.id; });
      if (!existe) voluntarios.push(vinc);
    });
  }

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
        if (aoConfirmarSucesso) aoConfirmarSucesso();
      }
    });
  }

  /* ---- Renderização ---- */
  function renderizar() {
    if (!estudanteAtual) return; // dados ainda não chegaram da API

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
    var filtradosVol = voluntarios.filter(function (v) {
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
            '<p class="card-assoc-est__linha"><strong>Gênero:</strong> ' + escaping(vol.genero || "Não informado") + '</p>' +
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
        var vol = voluntarios.find(function (item) { return item.id === id; });
        if (!vol) return;

        var vinculo = estudanteAtual.vinculos.filter(function (v) { return v.id === vol.id; })[0];
        if (vinculo) {
          confirmarDesvinculacao(estudanteAtual, vol, function () {
            if (enviando) return;
            enviando = true;
            // POST /associar/vinculos/:id/desvincular (só muda a tela depois que a API confirmar)
            Api.chamar("/associar/vinculos/" + vinculo.vinculo_id + "/desvincular", { method: "POST", body: {} })
              .then(function (r) {
                enviando = false;
                avisarEmail(r, "desvinculado");
                estudanteAtual.vinculos = estudanteAtual.vinculos.filter(function (x) {
                  return x.vinculo_id !== vinculo.vinculo_id;
                });
                renderizar();
              }).catch(erro);
          });
        } else {
          confirmarVinculacao(estudanteAtual, vol, function () {
            if (enviando) return;
            enviando = true;
            // POST /associar/vinculos
            Api.chamar("/associar/vinculos", {
              method: "POST",
              body: { voluntario_id: vol.id, estudante_id: estudanteAtual.id }
            }).then(function (r) {
              enviando = false;
              avisarEmail(r, "vinculado");
              estudanteAtual.vinculos.push({
                vinculo_id: r.vinculo_id, id: vol.id, nome: vol.nome, curso: vol.curso
              });
              renderizar();
            }).catch(erro);
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

    // Estudante vem da URL: admin-associar.html?id=1
    var id = parseInt(new URLSearchParams(window.location.search).get("id"), 10);
    if (!(id > 0)) {
      window.location.href = "admin-associacao.html";
      return;
    }

    Promise.all([
      Api.chamar("/associar/estudantes/" + id),
      Api.chamar("/associar/voluntarios")
    ]).then(function (r) {
      estudanteAtual = r[0];
      estudanteAtual.filtros = FiltroPreferencias.vazio(); // filtros ficam só na tela
      voluntarios = r[1];
      juntarVinculados();
      renderizar(); // só depois que os dados chegarem
    }).catch(erro);
  });
})();