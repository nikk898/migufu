(function () {
  "use strict";

  var POR_PAGINA = 10;

  /* Dados carregados do backend */
  var estudantes = [];
  var voluntarios = [];
  var estudanteSelecionado = null;
  var termoBusca = "";
  var statusVinculo = "todos";
  var pagina = 1;
  var carregando = false;
  var enviando = false;

  var OPCOES_VINCULO = [
    { id: "todos", rotulo: "Todos" },
    { id: "com_vinculo", rotulo: "Com vínculo" },
    { id: "sem_vinculo", rotulo: "Sem vínculo" }
  ];

  function erro(e) {
    enviando = false;
    carregando = false;
    alert((e && e.message) || "Ocorreu um erro ao comunicar com o servidor.");
  }

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

  function capitalizar(texto) {
    if (!texto) return "";
    return String(texto).charAt(0).toUpperCase() + String(texto).slice(1).toLowerCase();
  }

  // A API devolve idiomas como { frances: "nativo" }.
  function textoIdiomas(mapa) {
    if (!mapa || typeof mapa !== "object") return "";
    return Object.keys(mapa).map(function (id) {
      var nome = id.replace(/-/g, " ").replace(/\b\w/g, function (letra) {
        return letra.toUpperCase();
      });
      if (id === "chines-mandarim") nome = "Chinês (Mandarim)";
      return nome + (mapa[id] ? " (" + capitalizar(mapa[id]) + ")" : "");
    }).join(", ");
  }

  function textoTags(lista) {
    return Array.isArray(lista) ? lista.join(", ") : "";
  }

  function normalizarPessoa(pessoa) {
    pessoa = pessoa || {};
    return Object.assign({}, pessoa, {
      nome: pessoa.nome || "Nome não informado",
      curso: pessoa.curso || "Não se aplica",
      idiomas: typeof pessoa.idiomas === "string" ? pessoa.idiomas : textoIdiomas(pessoa.idiomas),
      tags: typeof pessoa.tags === "string" ? pessoa.tags : textoTags(pessoa.interesses),
      vinculos: Array.isArray(pessoa.vinculos) ? pessoa.vinculos : []
    });
  }

  function buscaCombina(pessoa) {
    if (!termoBusca) return true;
    var b = termoBusca.toLowerCase();
    return String(pessoa.nome || "").toLowerCase().indexOf(b) !== -1 ||
      String(pessoa.curso || "").toLowerCase().indexOf(b) !== -1 ||
      String(pessoa.email || "").toLowerCase().indexOf(b) !== -1 ||
      String(pessoa.cpf || "").toLowerCase().indexOf(b) !== -1;
  }

  function paginar(lista) {
    var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (pagina > totalPaginas) pagina = totalPaginas;

    Paginacao.render("#paginacao", {
      total: lista.length,
      porPagina: POR_PAGINA,
      paginaAtual: pagina,
      aoMudar: function (p) {
        pagina = p;
        renderizar();
        window.scrollTo({ top: 0 });
      }
    });

    var inicio = (pagina - 1) * POR_PAGINA;
    return lista.slice(inicio, inicio + POR_PAGINA);
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
      titulo: "Desvincular " + voluntario.nome + " de " + estudante.nome + "?",
      mensagem: "",
      textoConfirmar: "DESVINCULAR",
      perigo: true,
      aoConfirmar: function () {
        if (aoConfirmarSucesso) aoConfirmarSucesso();
      }
    });
  }

  function atualizarVinculosDoEstudante(estudante) {
    return Api.chamar("/associar/estudantes/" + estudante.id).then(function (dados) {
      var atualizado = normalizarPessoa(dados);
      estudante.vinculos = atualizado.vinculos || [];
      estudante.idiomas = atualizado.idiomas;
      estudante.tags = atualizado.tags;
      return estudante;
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
                    '<p><strong>Curso:</strong> ' + escaping(v.curso || "Não se aplica") + '</p>' +
                  '</div>' +
                  '<button type="button" class="card-vinc-item__btn-lixo" data-vinc-id="' +
                    escaping(v.vinculo_id) + '" aria-label="Desvincular ' + escaping(v.nome) + '">' +
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
          var vinculoId = parseInt(btn.getAttribute("data-vinc-id"), 10);
          var vinculo = estudante.vinculos.find(function (item) {
            return Number(item.vinculo_id) === vinculoId;
          });
          if (!vinculo || enviando) return;

          confirmarDesvinculacao(estudante, vinculo, function () {
            enviando = true;
            Api.chamar("/associar/vinculos/" + vinculoId + "/desvincular", {
              method: "POST",
              body: {}
            }).then(function (resposta) {
              enviando = false;
              if (resposta.email_enviado === false) {
                alert("Vínculo encerrado, mas não foi possível enviar o e-mail de aviso.");
              }
              estudante.vinculos = estudante.vinculos.filter(function (item) {
                return Number(item.vinculo_id) !== vinculoId;
              });
              renderizarCorpoModal();
              renderizar();
            }).catch(erro);
          });
        });
      });

      var btnAdd = modal.corpo.querySelector(".btn-add-vinc");
      if (btnAdd) {
        btnAdd.addEventListener("click", function () {
          modal.fechar();
          estudanteSelecionado = estudante;
          pagina = 1;
          renderizar();
        });
      }
    }

    renderizarCorpoModal();
    modal.abrir();
  }

  function renderizarVoluntarios() {
    var containerPainel = document.getElementById("painel-selecao-estudante");
    var containerStatus = document.getElementById("filtro-status");
    var listaContainer = document.getElementById("lista-associacoes");

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
      pagina = 1;
      renderizar();
    });

    containerStatus.hidden = true;

    // Mantém na lista também os voluntários já vinculados, mesmo se deixaram de estar disponíveis.
    var listaVoluntarios = voluntarios.slice();
    estudanteSelecionado.vinculos.forEach(function (v) {
      if (!listaVoluntarios.some(function (vol) { return Number(vol.id) === Number(v.id); })) {
        listaVoluntarios.push(normalizarPessoa(v));
      }
    });

    var filtradosVol = listaVoluntarios.filter(buscaCombina);
    var itensVol = paginar(filtradosVol);

    if (!itensVol.length) {
      listaContainer.innerHTML = '<li class="card-assoc-est__vazio"><p class="texto">Nenhum voluntário encontrado.</p></li>';
      return;
    }

    listaContainer.innerHTML = itensVol.map(function (vol) {
      var vinculo = estudanteSelecionado.vinculos.find(function (v) {
        return Number(v.id) === Number(vol.id);
      });
      return (
        '<li class="card card-assoc-est">' +
          '<div class="card-assoc-est__topo">' +
            '<div class="card-assoc-est__avatar">' + obterIniciais(vol.nome) + '</div>' +
            '<h3 class="card-assoc-est__nome">' + escaping(vol.nome) + '</h3>' +
            (vinculo ? '<span class="badge-vinculado">Vinculado</span>' : '') +
          '</div>' +
          '<div class="card-assoc-est__corpo">' +
            '<p class="card-assoc-est__linha"><strong>Curso:</strong> ' + escaping(vol.curso) + '</p>' +
            '<p class="card-assoc-est__linha"><strong>Idiomas:</strong> ' + escaping(vol.idiomas) + '</p>' +
            '<p class="card-assoc-est__linha"><strong>Tags:</strong> ' + escaping(vol.tags) + '</p>' +
          '</div>' +
          '<div style="margin-top: 12px;">' +
            (vinculo
              ? '<button type="button" class="botao botao--secundario btn-desvincular-op" data-vol-id="' + vol.id + '">DESVINCULAR</button>'
              : '<button type="button" class="botao botao--primario btn-vincular-op" data-vol-id="' + vol.id + '">VINCULAR</button>') +
          '</div>' +
        '</li>'
      );
    }).join("");

    listaContainer.querySelectorAll("button[data-vol-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = parseInt(btn.getAttribute("data-vol-id"), 10);
        var vol = listaVoluntarios.find(function (item) { return Number(item.id) === id; });
        if (!vol || enviando) return;

        var vinculo = estudanteSelecionado.vinculos.find(function (v) {
          return Number(v.id) === Number(vol.id);
        });

        if (vinculo) {
          confirmarDesvinculacao(estudanteSelecionado, vol, function () {
            enviando = true;
            Api.chamar("/associar/vinculos/" + vinculo.vinculo_id + "/desvincular", {
              method: "POST",
              body: {}
            }).then(function (resposta) {
              enviando = false;
              if (resposta.email_enviado === false) {
                alert("Vínculo encerrado, mas não foi possível enviar o e-mail de aviso.");
              }
              estudanteSelecionado.vinculos = estudanteSelecionado.vinculos.filter(function (x) {
                return Number(x.vinculo_id) !== Number(vinculo.vinculo_id);
              });
              renderizar();
            }).catch(erro);
          });
        } else {
          confirmarVinculacao(estudanteSelecionado, vol, function () {
            enviando = true;
            Api.chamar("/associar/vinculos", {
              method: "POST",
              body: {
                voluntario_id: vol.id,
                estudante_id: estudanteSelecionado.id
              }
            }).then(function (resposta) {
              enviando = false;
              if (resposta.email_enviado === false) {
                alert("Vínculo criado, mas não foi possível enviar o e-mail de aviso.");
              }
              estudanteSelecionado.vinculos.push({
                vinculo_id: resposta.vinculo_id,
                id: vol.id,
                nome: vol.nome,
                curso: vol.curso
              });
              renderizar();
            }).catch(erro);
          });
        }
      });
    });
  }

  function renderizar() {
    if (carregando) {
      document.getElementById("lista-associacoes").innerHTML =
        '<li class="card-assoc-est__vazio"><p class="texto">Carregando dados...</p></li>';
      return;
    }

    if (estudanteSelecionado) {
      renderizarVoluntarios();
      return;
    }

    var containerPainel = document.getElementById("painel-selecao-estudante");
    var containerStatus = document.getElementById("filtro-status");
    var listaContainer = document.getElementById("lista-associacoes");
    containerPainel.style.display = "none";
    containerStatus.hidden = false;

    FiltroStatus.render("#filtro-status", {
      rotulo: "Filtrar por vínculo",
      opcoes: OPCOES_VINCULO,
      selecionado: statusVinculo,
      aoMudar: function (id) {
        statusVinculo = id;
        pagina = 1;
        renderizar();
      }
    });

    var filtradosEst = estudantes.filter(function (e) {
      var comVinculo = e.vinculos && e.vinculos.length > 0;
      if (statusVinculo === "com_vinculo" && !comVinculo) return false;
      if (statusVinculo === "sem_vinculo" && comVinculo) return false;
      return buscaCombina(e);
    });

    var itensEst = paginar(filtradosEst);
    var listaComAcoes = itensEst.map(function (e) {
      return Object.assign({}, e, {
        comVinculo: e.vinculos && e.vinculos.length > 0,
        aoVincular: function () {
          abrirModalVinculos(e);
        }
      });
    });

    if (!listaComAcoes.length) {
      listaContainer.innerHTML = '<li class="card-assoc-est__vazio"><p class="texto">Nenhum estudante encontrado.</p></li>';
      return;
    }

    CardEstudanteVinc.renderLista("#lista-associacoes", listaComAcoes);
  }

  function carregarDados() {
    carregando = true;
    renderizar();

    // A listagem administrativa fornece os estudantes; a rota de associação
    // complementa cada um com os vínculos ativos e os dados de matching.
    Promise.all([
      Api.chamar("/admin/usuarios?tipo=estudante"),
      Api.chamar("/associar/voluntarios")
    ]).then(function (respostas) {
      voluntarios = (respostas[1] || []).map(normalizarPessoa);

      var lista = respostas[0] || [];
      return Promise.all(lista.map(function (est) {
        return Api.chamar("/associar/estudantes/" + est.id)
          .then(function (detalhes) {
            var pessoa = normalizarPessoa(Object.assign({}, est, detalhes));
            pessoa.vinculos = (detalhes.vinculos || []).map(function (v) {
              return Object.assign({}, v, {
                curso: v.curso || "Não se aplica"
              });
            });
            return pessoa;
          });
      }));
    }).then(function (dadosEstudantes) {
      estudantes = dadosEstudantes;
      carregando = false;
      renderizar();
    }).catch(function (e) {
      carregando = false;
      erro(e);
      document.getElementById("lista-associacoes").innerHTML =
        '<li class="card-assoc-est__vazio"><p class="texto">Não foi possível carregar os dados. Verifique a conexão com o servidor.</p></li>';
    });
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
        pagina = 1;
        renderizar();
      });
    }

    carregarDados();
  });
})();