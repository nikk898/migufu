/* ==========================================================================
   Conta Mestre - Gestão de Instituições (pages/mestre-instituicoes.html)

   Funcionalidades: listar, buscar, adicionar, editar, excluir (com confirmação)
   e pausar/reativar instituições.

   Os dados ficam só em memória por enquanto.
   TODO: ligar cada ação (criar/editar/excluir/pausar) à API do back-end.
   ========================================================================== */

(function () {
  "use strict";

  var ESTADOS = [
    ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"],
    ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"],
    ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"],
    ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"],
    ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
    ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"],
    ["SE", "Sergipe"], ["TO", "Tocantins"],
  ];

  // Dados de exemplo (iguais aos do protótipo do Figma; e-mails são fictícios).
  var instituicoes = [
    {
      id: 1,
      nome: "Universidade Federal de Uberlândia",
      sigla: "UFU",
      uf: "MG",
      cidade: "Uberlândia",
      email: "migufu@ufu.br",
      status: "ativa",
    },
    {
      id: 2,
      nome: "Instituto Federal do Triângulo Mineiro",
      sigla: "IFTM",
      uf: "MG",
      cidade: "Uberaba",
      email: "migufu@iftm.edu.br",
      status: "pausada",
    },
  ];

  var proximoId = 3;
  var listaEl;
  var vazioEl;
  var buscaEl;
  var cacheCidades = {};

  /* ---------- utilidades ---------- */

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function nomeCompleto(inst) {
    return inst.nome + " (" + inst.sigla + ")";
  }

  function semAcento(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  /* ---------- lista ---------- */

  function botaoAcao(icone, rotulo, perigo, aoClicar) {
    var b = criar("button", "inst-card__acao" + (perigo ? " inst-card__acao--perigo" : ""));
    b.type = "button";
    b.setAttribute("aria-label", rotulo);
    b.title = rotulo;
    b.innerHTML = Icones.svg(icone);
    b.addEventListener("click", aoClicar);
    return b;
  }

  function cardInstituicao(inst) {
    var ativa = inst.status === "ativa";
    var nome = nomeCompleto(inst);

    var li = criar("li", "card inst-card");

    var principal = criar("div", "inst-card__principal");
    principal.appendChild(criar("p", "inst-card__nome", nome));
    principal.appendChild(
      criar("span", "chip chip--fixo " + (ativa ? "chip--sucesso" : "chip--pendente"), ativa ? "Ativa" : "Pausada")
    );

    var acoes = criar("div", "inst-card__acoes");
    acoes.appendChild(botaoAcao("lixeira", "Excluir " + nome, true, function () { excluir(inst); }));
    acoes.appendChild(botaoAcao("editar", "Editar " + nome, false, function () { abrirFormulario(inst); }));
    acoes.appendChild(
      botaoAcao(ativa ? "pausar" : "retomar", (ativa ? "Pausar " : "Reativar ") + nome, false, function () {
        inst.status = ativa ? "pausada" : "ativa";
        // TODO: PATCH na API alterando o status
        renderizar();
      })
    );

    li.appendChild(principal);
    li.appendChild(acoes);
    return li;
  }

  function renderizar() {
    var termo = semAcento(buscaEl.value.trim());
    var filtradas = instituicoes.filter(function (i) {
      if (!termo) return true;
      return semAcento([i.nome, i.sigla, i.email].join(" ")).indexOf(termo) !== -1;
    });

    listaEl.textContent = "";
    filtradas.forEach(function (i) {
      listaEl.appendChild(cardInstituicao(i));
    });
    vazioEl.hidden = filtradas.length > 0;
  }

  /* ---------- exclusão ---------- */

  function excluir(inst) {
    Modal.confirmar({
      titulo: "Excluir instituição",
      mensagem: "Tem certeza que deseja excluir " + nomeCompleto(inst) + "? Esta ação não pode ser desfeita.",
      textoConfirmar: "EXCLUIR",
      perigo: true,
      aoConfirmar: function () {
        // TODO: DELETE na API
        instituicoes = instituicoes.filter(function (i) { return i.id !== inst.id; });
        renderizar();
      },
    });
  }

  /* ---------- formulário (adicionar / editar) ---------- */

  function campoHtml(id, rotulo, opcoes) {
    var o = opcoes || {};
    var tipo = o.tipo || "text";
    var atributos =
      'class="campo__entrada" id="' + id + '" name="' + id + '" type="' + tipo + '"' +
      ' placeholder="' + (o.placeholder || "") + '"' +
      (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : "") +
      (o.somenteLeitura ? " readonly" : "") +
      ' aria-describedby="' + id + '-erro"';

    var entrada = o.senha
      ? '<div class="campo__senha"><input ' + atributos + ">" +
        '<button type="button" class="campo__olho" data-olho="' + id + '" aria-label="Mostrar senha">' +
        Icones.svg("olho") + "</button></div>"
      : "<input " + atributos + ">";

    return (
      '<div class="campo"><label class="campo__rotulo" for="' + id + '">' + rotulo + "</label>" +
      entrada + '<p class="campo__erro" id="' + id + '-erro" hidden></p></div>'
    );
  }

  function selectHtml(id, rotulo, placeholder) {
    return (
      '<div class="campo"><label class="campo__rotulo" for="' + id + '">' + rotulo + "</label>" +
      '<select class="campo__entrada" id="' + id + '" name="' + id + '" aria-describedby="' + id + '-erro">' +
      '<option value="">' + placeholder + "</option></select>" +
      '<p class="campo__erro" id="' + id + '-erro" hidden></p></div>'
    );
  }

  function carregarCidades(uf, selectEl, selecionada) {
    function preencher(nomes) {
      selectEl.innerHTML = "";
      var vazio = criar("option", "", "selecione a cidade da instituição...");
      vazio.value = "";
      selectEl.appendChild(vazio);
      nomes.forEach(function (n) {
        var op = criar("option", "", n);
        op.value = n;
        selectEl.appendChild(op);
      });
      selectEl.value = selecionada || "";
      selectEl.disabled = false;
    }

    if (!uf) {
      preencher([]);
      selectEl.disabled = true;
      return;
    }

    if (cacheCidades[uf]) {
      preencher(cacheCidades[uf]);
      return;
    }

    selectEl.disabled = true;
    selectEl.innerHTML = "<option value=''>carregando cidades...</option>";

    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/" + uf + "/municipios?orderBy=nome")
      .then(function (r) {
        if (!r.ok) throw new Error("IBGE " + r.status);
        return r.json();
      })
      .then(function (cidades) {
        cacheCidades[uf] = cidades.map(function (c) { return c.nome; });
        // se o estado mudou enquanto carregava, ignora
        if (selectEl.dataset.uf === uf) preencher(cacheCidades[uf]);
      })
      .catch(function () {
        // Sem rede/IBGE: mantém ao menos a cidade já cadastrada
        if (selectEl.dataset.uf === uf) preencher(selecionada ? [selecionada] : []);
      });
  }

  function mostrarErroCampo(form, id, mensagem) {
    var entrada = form.querySelector("#" + id);
    var erro = form.querySelector("#" + id + "-erro");
    entrada.setAttribute("aria-invalid", mensagem ? "true" : "false");
    erro.textContent = mensagem || "";
    erro.hidden = !mensagem;
  }

  function abrirFormulario(inst) {
    var edicao = !!inst;
    var modal = Modal.criar({
      titulo: edicao ? "Editar Instituição" : "Adicionar Instituição",
      larga: true,
      aoFechar: function () { modal.destruir(); },
    });

    var colunaDireita =
      campoHtml("inst-email", "E-mail", { tipo: "email", placeholder: "digite o e-mail...", autocomplete: "off" }) +
      (edicao
        ? campoHtml("inst-senha-atual", "Senha", { tipo: "password", somenteLeitura: true }) +
          campoHtml("inst-senha", "Alterar senha", { tipo: "password", senha: true, placeholder: "digite uma nova senha...", autocomplete: "new-password" })
        : campoHtml("inst-senha", "Senha", { tipo: "password", senha: true, placeholder: "digite uma senha...", autocomplete: "new-password" })) +
      campoHtml("inst-senha2", "Confirmar senha", { tipo: "password", senha: true, placeholder: "confirme a senha...", autocomplete: "new-password" });

    modal.corpo.innerHTML =
      '<form novalidate>' +
      '<div class="inst-form__grade">' +
      '<div class="inst-form__coluna">' +
      campoHtml("inst-nome", "Nome da Instituição", { placeholder: "digite o nome da instituição..." }) +
      campoHtml("inst-sigla", "Sigla", { placeholder: "digite a sigla da instituição..." }) +
      selectHtml("inst-uf", "Estado/UF", "selecione o estado da instituição...") +
      selectHtml("inst-cidade", "Cidade", "selecione a cidade da instituição...") +
      "</div>" +
      '<div class="inst-form__coluna">' + colunaDireita + "</div>" +
      "</div>" +
      '<div class="modal__acoes">' +
      '<button type="button" class="botao botao--secundario" data-acao="cancelar">CANCELAR</button>' +
      '<button type="submit" class="botao botao--primario">SALVAR</button>' +
      "</div></form>";

    var form = modal.corpo.querySelector("form");
    var ufEl = form.querySelector("#inst-uf");
    var cidadeEl = form.querySelector("#inst-cidade");

    ESTADOS.forEach(function (e) {
      var op = criar("option", "", e[1] + " - " + e[0]);
      op.value = e[0];
      ufEl.appendChild(op);
    });

    // valores iniciais
    if (edicao) {
      form.querySelector("#inst-nome").value = inst.nome;
      form.querySelector("#inst-sigla").value = inst.sigla;
      form.querySelector("#inst-email").value = inst.email;
      form.querySelector("#inst-senha-atual").value = "••••••••";
      ufEl.value = inst.uf;
      cidadeEl.dataset.uf = inst.uf;
      carregarCidades(inst.uf, cidadeEl, inst.cidade);
    } else {
      cidadeEl.disabled = true;
    }

    ufEl.addEventListener("change", function () {
      cidadeEl.dataset.uf = ufEl.value;
      carregarCidades(ufEl.value, cidadeEl, "");
    });

    // mostrar / ocultar senha
    form.querySelectorAll("[data-olho]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var entrada = form.querySelector("#" + botao.dataset.olho);
        var mostrar = entrada.type === "password";
        entrada.type = mostrar ? "text" : "password";
        botao.innerHTML = Icones.svg(mostrar ? "olho-fechado" : "olho");
        botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      });
    });

    form.querySelector('[data-acao="cancelar"]').addEventListener("click", modal.fechar);

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      var v = {
        nome: form.querySelector("#inst-nome").value.trim(),
        sigla: form.querySelector("#inst-sigla").value.trim(),
        uf: ufEl.value,
        cidade: cidadeEl.value,
        email: form.querySelector("#inst-email").value.trim(),
        senha: form.querySelector("#inst-senha").value,
        senha2: form.querySelector("#inst-senha2").value,
      };

      var erros = {
        "inst-nome": v.nome ? "" : "Informe o nome da instituição.",
        "inst-sigla": v.sigla ? "" : "Informe a sigla.",
        "inst-uf": v.uf ? "" : "Selecione o estado.",
        "inst-cidade": v.cidade ? "" : "Selecione a cidade.",
        "inst-email": /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? "" : "Informe um e-mail válido.",
        "inst-senha": !edicao && !v.senha ? "Defina uma senha." : "",
        "inst-senha2": v.senha !== v.senha2 ? "As senhas não coincidem." : "",
      };

      var primeiroInvalido = null;
      Object.keys(erros).forEach(function (id) {
        mostrarErroCampo(form, id, erros[id]);
        if (erros[id] && !primeiroInvalido) primeiroInvalido = id;
      });
      if (primeiroInvalido) {
        form.querySelector("#" + primeiroInvalido).focus();
        return;
      }

      // A senha NUNCA é guardada no front-end: só seria enviada à API.
      // TODO: POST (criar) / PUT (editar) na API
      if (edicao) {
        inst.nome = v.nome;
        inst.sigla = v.sigla;
        inst.uf = v.uf;
        inst.cidade = v.cidade;
        inst.email = v.email;
      } else {
        instituicoes.push({
          id: proximoId++,
          nome: v.nome,
          sigla: v.sigla,
          uf: v.uf,
          cidade: v.cidade,
          email: v.email,
          status: "ativa",
        });
      }

      renderizar();
      modal.fechar();
    });

    modal.abrir();
    form.querySelector("#inst-nome").focus();
  }

  /* ---------- inicialização ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_MESTRE,
      ativo: "instituicoes",
      semCabecalhoMobile: true,
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Instituições" });

    listaEl = document.querySelector('[data-inst="lista"]');
    vazioEl = document.querySelector('[data-inst="vazio"]');
    buscaEl = document.querySelector('[data-inst="busca"]');

    buscaEl.addEventListener("input", renderizar);
    document.querySelector('[data-inst="adicionar"]').addEventListener("click", function () { abrirFormulario(null); });
    document.querySelector('[data-inst="fab"]').addEventListener("click", function () { abrirFormulario(null); });

    renderizar();
  });
})();
