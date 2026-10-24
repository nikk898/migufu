(function (global) {
  "use strict";

  /* ------------------------------------------------------------------
     LISTAS DE OPÇÕES
     Para trocar por dados da API use FiltroPreferencias.configurar({ cursos: [...], idiomas: [...] })
     antes de abrir o modal. Idiomas aceitam texto ("Francês") ou { id, nome }.
     ------------------------------------------------------------------ */
  var CURSOS_UFU = [
    "Administração", "Agronomia", "Arquitetura e Urbanismo", "Artes Visuais", "Biomedicina", "Biotecnologia",
    "Ciência da Computação", "Ciências Biológicas", "Ciências Contábeis", "Ciências Econômicas", "Ciências Sociais",
    "Dança", "Design", "Direito", "Educação Física", "Enfermagem", "Engenharia Aeronáutica", "Engenharia Biomédica",
    "Engenharia Civil", "Engenharia de Agrimensura e Cartográfica", "Engenharia de Alimentos", "Engenharia de Computação",
    "Engenharia de Controle e Automação", "Engenharia de Minas", "Engenharia de Produção", "Engenharia Elétrica",
    "Engenharia Eletrônica e de Telecomunicações", "Engenharia Mecânica", "Engenharia Mecatrônica", "Engenharia Química",
    "Estatística", "Farmácia", "Filosofia", "Física", "Física Médica", "Geografia", "Geologia", "Gestão da Informação",
    "História", "Jornalismo", "Letras", "Letras-Libras", "Matemática", "Medicina", "Medicina Veterinária", "Música",
    "Nutrição", "Odontologia", "Pedagogia", "Psicologia", "Química", "Química Industrial", "Relações Internacionais",
    "Serviço Social", "Sistemas de Informação", "Teatro", "Zootecnia"
  ];

  var IDIOMAS_LISTA = [
    "Alemão", "Árabe", "Bengali", "Búlgaro", "Catalão", "Chinês (Mandarim)", "Coreano", "Croata", "Dinamarquês",
    "Eslovaco", "Esloveno", "Espanhol", "Esperanto", "Estoniano", "Filipino", "Finlandês", "Francês", "Galego",
    "Grego", "Guarani", "Hebraico", "Hindi", "Holandês", "Húngaro", "Indonésio", "Inglês", "Irlandês", "Islandês",
    "Italiano", "Japonês", "Latim", "Letão", "Libras", "Lituano", "Malaio", "Norueguês", "Persa", "Polonês",
    "Português", "Quéchua", "Romeno", "Russo", "Sérvio", "Suaíli", "Sueco", "Tailandês", "Tcheco", "Turco",
    "Ucraniano", "Urdu", "Vietnamita"
  ];

  function normalizar(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function slug(t) {
    return normalizar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function montarIdiomas(lista) {
    return lista.map(function (i) {
      return typeof i === "string" ? { id: slug(i), nome: i } : i;
    });
  }

  var OPCOES = {
    cursos: CURSOS_UFU.slice(),
    interesses: ["Parques", "Música", "Esportes", "Culinária", "Cinema", "Tecnologia", "Viagens",
                 "Jogos de tabuleiro", "Animes", "Leitura"],
    idiomas: montarIdiomas(IDIOMAS_LISTA),
    niveis: [
      { id: "qualquer",      nome: "Qualquer" },
      { id: "basico",        nome: "Básico" },
      { id: "intermediario", nome: "Intermediário" },
      { id: "avancado",      nome: "Avançado" },
      { id: "nativo",        nome: "Nativo" }
    ],
    generos: ["Feminino", "Masculino", "Outro"]
  };

  function configurar(o) {
    if (!o) return;
    if (o.cursos) OPCOES.cursos = o.cursos.slice();
    if (o.interesses) OPCOES.interesses = o.interesses.slice();
    if (o.generos) OPCOES.generos = o.generos.slice();
    if (o.idiomas) OPCOES.idiomas = montarIdiomas(o.idiomas);
  }

  /*
    Formato do objeto de filtros:
    { cursos: [], interesses: [], generos: [],
      idiomas: { frances: "basico", ingles: "qualquer" } }
  */
  function vazio() {
    return { cursos: [], interesses: [], generos: [], idiomas: {} };
  }

  function clonar(f) {
    var n = vazio();
    n.cursos = (f.cursos || []).slice();
    n.interesses = (f.interesses || []).slice();
    n.generos = (f.generos || []).slice();
    Object.keys(f.idiomas || {}).forEach(function (k) { n.idiomas[k] = f.idiomas[k]; });
    return n;
  }

  function achar(lista, id) {
    return lista.filter(function (x) { return x.id === id; })[0];
  }

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function rotuloIdioma(id, nivelId) {
    var idi = achar(OPCOES.idiomas, id);
    var niv = achar(OPCOES.niveis, nivelId);
    var nome = idi ? idi.nome : id;
    if (!niv) return nome;
    return nome + (niv.id === "qualquer" ? " (qualquer nível)" : " (" + niv.nome.toLowerCase() + ")");
  }

  /* Lista plana de filtros ativos (usada nos chips e na contagem) */
  function chips(f) {
    var lista = [];
    (f.cursos || []).forEach(function (c) { lista.push({ tipo: "cursos", valor: c, rotulo: c }); });
    Object.keys(f.idiomas || {}).forEach(function (id) {
      lista.push({ tipo: "idiomas", valor: id, rotulo: rotuloIdioma(id, f.idiomas[id]) });
    });
    (f.interesses || []).forEach(function (x) { lista.push({ tipo: "interesses", valor: x, rotulo: x }); });
    (f.generos || []).forEach(function (g) { lista.push({ tipo: "generos", valor: g, rotulo: g }); });
    return lista;
  }

  function contar(f) {
    return chips(f).length;
  }

  function remover(f, chip) {
    var n = clonar(f);
    if (chip.tipo === "idiomas") delete n.idiomas[chip.valor];
    else n[chip.tipo] = n[chip.tipo].filter(function (v) { return v !== chip.valor; });
    return n;
  }

  /*
    Regra: dentro de uma mesma categoria vale "qualquer um" (OU);
    entre categorias diferentes o usuário precisa atender a todas (E).
    Idioma com nível "Qualquer" aceita o usuário que fale o idioma em qualquer nível.
    Usuário esperado: { curso, genero, interesses: [], idiomas: { frances: "basico" } }
  */
  function corresponde(u, f) {
    if (f.cursos.length && f.cursos.indexOf(u.curso) === -1) return false;
    if (f.generos.length && f.generos.indexOf(u.genero) === -1) return false;

    if (f.interesses.length) {
      var tem = (u.interesses || []).some(function (x) { return f.interesses.indexOf(x) !== -1; });
      if (!tem) return false;
    }

    var idiomasSel = Object.keys(f.idiomas);
    if (idiomasSel.length) {
      var temIdioma = idiomasSel.some(function (id) {
        var nivelUsuario = u.idiomas && u.idiomas[id];
        if (!nivelUsuario) return false;
        return f.idiomas[id] === "qualquer" || nivelUsuario === f.idiomas[id];
      });
      if (!temIdioma) return false;
    }
    return true;
  }

  /* ==================================================================
     Barra "Filtros Ativos"
     FiltroPreferencias.renderAtivos("#filtros-ativos", filtros, {
       aoRemover: function (novosFiltros) {},
       aoAbrir: function () {}
     });
     ================================================================== */
  var ICONE_BUSCA = '<svg class="icone filtros-ativos__icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
  var ICONE_X = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  var ICONE_MAIS = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>';
  var ICONE_CHEVRON = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';

  function renderAtivos(alvo, filtros, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    var o = opcoes || {};
    var lista = chips(filtros);

    var html = '<section class="filtros-ativos" aria-label="Filtros ativos">' +
      '<h3 class="filtros-ativos__titulo">Filtros Ativos</h3>' +
      '<div class="filtros-ativos__linha">' + ICONE_BUSCA +
      '<ul class="filtros-ativos__lista">';

    if (!lista.length) html += '<li class="filtros-ativos__vazio">Nenhum filtro aplicado</li>';

    lista.forEach(function (c, i) {
      html += '<li><span class="filtro-chip">' + esc(c.rotulo) +
        '<button type="button" data-remover="' + i + '" aria-label="Remover filtro ' + esc(c.rotulo) + '">' + ICONE_X + '</button>' +
        '</span></li>';
    });

    html += '<li><button type="button" class="filtros-ativos__add" data-abrir aria-label="Adicionar filtros">' + ICONE_MAIS + '</button></li>' +
      '</ul></div></section>';

    el.innerHTML = html;

    el.onclick = function (e) {
      var rem = e.target.closest("[data-remover]");
      if (rem) {
        var chip = lista[Number(rem.getAttribute("data-remover"))];
        if (chip && typeof o.aoRemover === "function") o.aoRemover(remover(filtros, chip));
        return;
      }
      if (e.target.closest("[data-abrir]") && typeof o.aoAbrir === "function") o.aoAbrir();
    };
  }

  /* ==================================================================
     Modal "Filtrar Preferências"
     FiltroPreferencias.abrir({ filtros: filtrosAtuais, aoAplicar: function (novos) {} });
     ================================================================== */
  var dialogo = null;
  var rascunho = vazio();
  var aoAplicarAtual = null;

  function secao(id, titulo, conteudo, rolavel) {
    return '<div class="filtro-secao">' +
      '<button type="button" class="filtro-secao__cabecalho" data-secao aria-expanded="true" aria-controls="filtro-sec-' + id + '">' +
        '<span>' + titulo + '</span>' + ICONE_CHEVRON +
      '</button>' +
      '<div class="filtro-secao__conteudo' + (rolavel ? " filtro-secao__conteudo--rolavel" : "") + '" id="filtro-sec-' + id + '">' + conteudo + '</div>' +
    '</div>';
  }

  function checkboxes(grupo, lista, selecionados) {
    return lista.map(function (v) {
      return '<label class="filtro-check" data-rotulo="' + esc(normalizar(v)) + '">' +
        '<input type="checkbox" data-grupo="' + grupo + '" value="' + esc(v) + '"' + (selecionados.indexOf(v) !== -1 ? " checked" : "") + '>' +
        '<span>' + esc(v) + '</span></label>';
    }).join("");
  }

  function idiomasLinhasHtml(f) {
    var ids = Object.keys(f.idiomas);
    if (!ids.length) return '<p class="filtro-idiomas__dica">Escolha um idioma para definir o nível.</p>';

    return ids.map(function (id) {
      var idi = achar(OPCOES.idiomas, id);
      if (!idi) return "";
      return '<div class="filtro-idioma" data-rotulo="' + esc(normalizar(idi.nome)) + '">' +
        '<div class="filtro-idioma__topo">' +
          '<p class="filtro-idioma__nome">' + esc(idi.nome) + '</p>' +
          '<button type="button" class="filtro-idioma__remover" data-remover-idioma="' + esc(id) + '" aria-label="Remover ' + esc(idi.nome) + '">' + ICONE_X + '</button>' +
        '</div>' +
        '<div class="filtro-pilulas">' + OPCOES.niveis.map(function (n) {
          return '<button type="button" class="filtro-pilula filtro-pilula--nivel" data-idioma="' + esc(id) + '" data-nivel="' + n.id + '" aria-pressed="' + (f.idiomas[id] === n.id) + '">' + esc(n.nome) + '</button>';
        }).join("") + '</div>' +
      '</div>';
    }).join("");
  }

  function idiomasOpcoesHtml(f) {
    return OPCOES.idiomas
      .filter(function (i) { return !f.idiomas[i.id]; })
      .map(function (i) { return '<option value="' + esc(i.nome) + '"></option>'; })
      .join("");
  }

  function corpoHtml(f) {
    var interesses = '<div class="filtro-pilulas">' + OPCOES.interesses.map(function (x) {
      return '<button type="button" class="filtro-pilula filtro-pilula--interesse" data-interesse="' + esc(x) + '" data-rotulo="' + esc(normalizar(x)) + '" aria-pressed="' + (f.interesses.indexOf(x) !== -1) + '">' + esc(x) + '</button>';
    }).join("") + '</div>';

    var idiomas =
      '<input type="text" class="campo__entrada filtro-idiomas__entrada" id="filtro-idiomas-entrada" list="filtro-idiomas-opcoes" ' +
        'placeholder="Adicionar idioma..." autocomplete="off" aria-label="Adicionar idioma">' +
      '<datalist id="filtro-idiomas-opcoes">' + idiomasOpcoesHtml(f) + '</datalist>' +
      '<div class="filtro-idiomas__lista" id="filtro-idiomas-lista">' + idiomasLinhasHtml(f) + '</div>';

    return '<div class="filtro-coluna">' +
             secao("curso", "Curso", checkboxes("cursos", OPCOES.cursos, f.cursos), true) +
             secao("interesses", "Interesses", interesses) +
           '</div>' +
           '<div class="filtro-coluna">' +
             secao("idioma", "Idioma e Nível", idiomas) +
             secao("genero", "Gênero", checkboxes("generos", OPCOES.generos, f.generos)) +
           '</div>';
  }

  function atualizarContagem() {
    var n = contar(rascunho);
    dialogo.querySelector("[data-acao='aplicar']").textContent = n ? "APLICAR FILTROS (" + n + ")" : "APLICAR FILTROS";
  }

  function filtrarOpcoes() {
    var termo = normalizar(dialogo.querySelector(".filtro-modal__busca input").value.trim());
    dialogo.querySelectorAll("[data-rotulo]").forEach(function (el) {
      el.hidden = termo !== "" && el.getAttribute("data-rotulo").indexOf(termo) === -1;
    });
  }

  function renderCorpo() {
    dialogo.querySelector("[data-corpo]").innerHTML = corpoHtml(rascunho);
    filtrarOpcoes();
    atualizarContagem();
  }

  /* Atualiza só a parte de idiomas (mantém o resto e o foco intactos) */
  function renderIdiomas() {
    document.getElementById("filtro-idiomas-lista").innerHTML = idiomasLinhasHtml(rascunho);
    document.getElementById("filtro-idiomas-opcoes").innerHTML = idiomasOpcoesHtml(rascunho);
    filtrarOpcoes();
    atualizarContagem();
  }

  function alternar(lista, valor) {
    var i = lista.indexOf(valor);
    if (i === -1) lista.push(valor); else lista.splice(i, 1);
  }

  function criarDialogo() {
    dialogo = document.createElement("dialog");
    dialogo.className = "filtro-modal";
    dialogo.setAttribute("aria-labelledby", "filtro-modal-titulo");
    dialogo.innerHTML =
      '<button type="button" class="filtro-modal__fechar" data-acao="fechar" aria-label="Fechar">' + ICONE_X + '</button>' +
      '<h2 class="filtro-modal__titulo" id="filtro-modal-titulo">Filtrar Preferências:</h2>' +
      '<div class="filtro-modal__busca">' + ICONE_BUSCA.replace("filtros-ativos__icone", "filtro-modal__busca-icone") +
        '<label class="sr-only" for="filtro-modal-busca">Buscar opções de filtro</label>' +
        '<input type="search" class="campo__entrada" id="filtro-modal-busca" placeholder="Buscar por nome, tipo, interesse..." autocomplete="off">' +
      '</div>' +
      '<div class="filtro-modal__corpo" data-corpo></div>' +
      '<div class="filtro-modal__rodape">' +
        '<button type="button" class="botao botao--secundario" data-acao="limpar">LIMPAR</button>' +
        '<button type="button" class="botao botao--primario" data-acao="aplicar">APLICAR FILTROS</button>' +
      '</div>';
    document.body.appendChild(dialogo);

    dialogo.addEventListener("click", function (e) {
      if (e.target === dialogo) { dialogo.close(); return; } // clique no fundo escuro

      var acao = e.target.closest("[data-acao]");
      if (acao) {
        var a = acao.getAttribute("data-acao");
        if (a === "fechar") dialogo.close();
        if (a === "limpar") { rascunho = vazio(); renderCorpo(); }
        if (a === "aplicar") {
          var resultado = clonar(rascunho);
          dialogo.close();
          if (typeof aoAplicarAtual === "function") aoAplicarAtual(resultado);
        }
        return;
      }

      var sec = e.target.closest("[data-secao]");
      if (sec) {
        var aberto = sec.getAttribute("aria-expanded") === "true";
        sec.setAttribute("aria-expanded", String(!aberto));
        document.getElementById(sec.getAttribute("aria-controls")).hidden = aberto;
        return;
      }

      var inter = e.target.closest("[data-interesse]");
      if (inter) {
        alternar(rascunho.interesses, inter.getAttribute("data-interesse"));
        inter.setAttribute("aria-pressed", String(rascunho.interesses.indexOf(inter.getAttribute("data-interesse")) !== -1));
        atualizarContagem();
        return;
      }

      var remIdioma = e.target.closest("[data-remover-idioma]");
      if (remIdioma) {
        delete rascunho.idiomas[remIdioma.getAttribute("data-remover-idioma")];
        renderIdiomas();
        return;
      }

      var nivel = e.target.closest("[data-nivel]");
      if (nivel) {
        var idioma = nivel.getAttribute("data-idioma");
        rascunho.idiomas[idioma] = nivel.getAttribute("data-nivel");
        dialogo.querySelectorAll("[data-idioma]").forEach(function (b) {
          if (b.getAttribute("data-idioma") === idioma) {
            b.setAttribute("aria-pressed", String(b.getAttribute("data-nivel") === rascunho.idiomas[idioma]));
          }
        });
        atualizarContagem();
      }
    });

    dialogo.addEventListener("change", function (e) {
      var cb = e.target.closest("input[data-grupo]");
      if (!cb) return;
      alternar(rascunho[cb.getAttribute("data-grupo")], cb.value);
      atualizarContagem();
    });

    dialogo.addEventListener("input", function (e) {
      if (e.target.id === "filtro-modal-busca") { filtrarOpcoes(); return; }

      if (e.target.id === "filtro-idiomas-entrada") {
        var digitado = normalizar(e.target.value.trim());
        var idi = OPCOES.idiomas.filter(function (i) { return normalizar(i.nome) === digitado; })[0];
        if (idi && !rascunho.idiomas[idi.id]) {
          rascunho.idiomas[idi.id] = "qualquer"; // nível padrão ao adicionar
          e.target.value = "";
          renderIdiomas();
        }
      }
    });
  }

  function abrir(opcoes) {
    var o = opcoes || {};
    if (!dialogo) criarDialogo();
    rascunho = clonar(o.filtros || vazio());
    aoAplicarAtual = o.aoAplicar;
    dialogo.querySelector(".filtro-modal__busca input").value = "";
    renderCorpo();
    dialogo.showModal();
  }

  global.FiltroPreferencias = {
    OPCOES: OPCOES,
    configurar: configurar,
    vazio: vazio,
    contar: contar,
    corresponde: corresponde,
    renderAtivos: renderAtivos,
    abrir: abrir
  };
})(window);