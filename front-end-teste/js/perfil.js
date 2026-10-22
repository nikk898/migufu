/*
  Perfil compartilhado do voluntário e estudante internacional.
  Os dados e a edição são simulados no navegador.
*/
(function () {
  "use strict";

  const estudante = document.body.dataset.perfil === "estudante";
  const opcoes = window.CADASTRO_DADOS.opcoes;
  const interessesDisponiveis = window.CADASTRO_DADOS.interesses;
  const inicio = estudante ? "estudante.html" : "voluntario.html";

  // Dados fictícios para desenvolvimento.
  // TODO: substituir pelos dados da API.
  const exemplos = {
    estudante: {
      nome: "Jean Martin",
      documento: "000.000.000-00",
      email: "jean.martin@ufu.br",
      telefone: "+33 6 1234 5678",
      genero: "masculino",
      pais: "FR",
      vinculo: "estudante",
      matricula: "12345BSI678",
      curso: "sistemas-de-informacao",
      periodo: "4",
      campus: "santa-monica",
      idiomas: [
        { idioma: "frances", nivel: "nativo" },
        { idioma: "ingles", nivel: "intermediario" },
      ],
      interesses: ["Jogos de tabuleiro", "Música", "Parques", "Animes"],
      bio: "Olá! Sou o Jean, vim da França para estudar na UFU. Gosto de fazer novos amigos, praticar esportes e conhecer novas culturas.",
      expectativas:
        "Quero conhecer pessoas e me integrar à vida universitária.",
    },

    voluntario: {
      nome: "João Silva",
      documento: "000.000.000-00",
      email: "joao.silva@ufu.br",
      telefone: "+55 34 91234 5678",
      genero: "masculino",
      pais: "BR",
      vinculo: "estudante",
      matricula: "",
      curso: "sistemas-de-informacao",
      periodo: "4",
      campus: "santa-monica",
      idiomas: [
        { idioma: "portugues", nivel: "nativo" },
        { idioma: "ingles", nivel: "intermediario" },
      ],
      interesses: ["Jogos de tabuleiro", "Esportes", "Música"],
      bio: "Olá! Sou estudante de Sistemas de Informação na UFU. Gosto de praticar esportes e fazer novas amizades.",
      expectativas:
        "Quero ajudar estudantes internacionais a se adaptarem à UFU.",
    },
  };

  const usuario = JSON.parse(
    JSON.stringify(exemplos[estudante ? "estudante" : "voluntario"]),
  );

  let fotoTemporaria = "";

  function buscar(id) {
    return document.getElementById(id);
  }

  function elemento(tag, classe, texto) {
    const el = document.createElement(tag);

    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;

    return el;
  }

  function rotulo(lista, valor) {
    const item = (opcoes[lista] || []).find((op) => op.valor === valor);

    return item ? item.rotulo : valor || "Não informado";
  }

  function iniciais(nome) {
    const partes = String(nome || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (partes.length > 1) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    return (partes[0] || "?").slice(0, 2).toUpperCase();
  }

  function textoIdiomas() {
    return usuario.idiomas
      .map(
        (item) =>
          rotulo("idiomas", item.idioma) +
          " (" +
          rotulo("niveis", item.nivel) +
          ")",
      )
      .join(", ");
  }

  /* Modal de alteração de senha */
  function abrirModalSenha() {
    const modal = Modal.criar({
      titulo: "Alterar senha",
      aoFechar: function () {
        modal.destruir();
      },
    });

    modal.el.classList.add("modal--perfil-senha");

    modal.corpo.innerHTML = `
  <form class="perfil-senha__form"
        id="form-perfil-senha"
        novalidate>

    <div class="campo">
      <label class="campo__rotulo" for="senha-atual">
        Senha atual
      </label>

      <div class="perfil-senha__entrada">
        <input
          class="campo__entrada"
          id="senha-atual"
          type="password"
          autocomplete="current-password"
          required>

        <button
          class="perfil-senha__mostrar"
          type="button"
          data-senha="senha-atual"
          aria-label="Mostrar senha atual">
          ${Icones.svg("olho")}
        </button>
      </div>
    </div>

    <div class="campo">
      <label class="campo__rotulo" for="senha-nova">
        Nova senha
      </label>

      <div class="perfil-senha__entrada">
        <input
          class="campo__entrada"
          id="senha-nova"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required>

        <button
          class="perfil-senha__mostrar"
          type="button"
          data-senha="senha-nova"
          aria-label="Mostrar nova senha">
          ${Icones.svg("olho")}
        </button>
      </div>
    </div>

    <div class="campo">
      <label class="campo__rotulo" for="senha-confirmacao">
        Confirmar nova senha
      </label>

      <div class="perfil-senha__entrada">
        <input
          class="campo__entrada"
          id="senha-confirmacao"
          type="password"
          autocomplete="new-password"
          required>

        <button
          class="perfil-senha__mostrar"
          type="button"
          data-senha="senha-confirmacao"
          aria-label="Mostrar confirmação">
          ${Icones.svg("olho")}
        </button>
      </div>
    </div>

    <p
      id="perfil-senha-erro"
      class="campo__erro perfil-senha__erro"
      role="alert"
      hidden>
    </p>

    <div class="perfil-senha__acoes">
      <button
        class="botao botao--secundario"
        type="button"
        data-cancelar>
        Cancelar
      </button>

      <button
        class="botao botao--primario"
        type="submit">
        Confirmar
      </button>
    </div>
  </form>
`;

    const form = modal.corpo.querySelector("#form-perfil-senha");
    const erro = modal.corpo.querySelector("#perfil-senha-erro");

    function mostrarErro(mensagem) {
      erro.textContent = mensagem;
      erro.hidden = !mensagem;
    }

    // Cancelar
    modal.corpo
      .querySelector("[data-cancelar]")
      .addEventListener("click", modal.fechar);

    // Mostrar ou ocultar as senhas
    modal.corpo.querySelectorAll("[data-senha]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const entrada = modal.corpo.querySelector("#" + botao.dataset.senha);

        const revelar = entrada.type === "password";

        entrada.type = revelar ? "text" : "password";

        botao.innerHTML = Icones.svg(revelar ? "olho-fechado" : "olho");

        botao.setAttribute(
          "aria-label",
          revelar ? "Ocultar senha" : "Mostrar senha",
        );
      });
    });

    // Validação da alteração
    form.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const atual = form.querySelector("#senha-atual").value;
      const nova = form.querySelector("#senha-nova").value;
      const confirmacao = form.querySelector("#senha-confirmacao").value;

      if (!atual || !nova || !confirmacao) {
        mostrarErro("Preencha os três campos.");
        return;
      }

      if (nova.length < 8) {
        mostrarErro("A nova senha deve ter pelo menos 8 caracteres.");
        return;
      }

      if (nova !== confirmacao) {
        mostrarErro("A confirmação não corresponde à nova senha.");
        return;
      }

      if (nova === atual) {
        mostrarErro("Escolha uma senha diferente da atual.");
        return;
      }

      // TODO: integração com a API de autenticação.
      // O servidor deverá conferir a senha atual,
      // validar a nova senha e atualizar seu hash.
      mostrarErro("A alteração de senha ainda não está disponível.");
    });

    modal.abrir();
    form.querySelector("#senha-atual").focus();
  }

  // Cria a estrutura principal da página.
  function montarPagina() {
    const raiz = buscar("perfil-raiz");

    raiz.innerHTML = `
      <header class="perfil__cabecalho">
        <a
          href="${inicio}"
          aria-label="Voltar para o início"
          class="perfil__voltar">
          ${Icones.svg("voltar")}
        </a>

        <h1 class="titulo-principal" id="perfil-titulo">
          Meu perfil
        </h1>

        <div class="perfil__marca" aria-label="MIGUFU">
          <img src="../assets/img/logo-migufu.png" alt="">
          <img src="../assets/img/logo-migufu-texto.png" alt="MIGUFU">
        </div>
      </header>

      <p
        class="perfil__aviso"
        id="perfil-aviso"
        role="status"
        hidden>
      </p>

      <div class="perfil__grade" id="perfil-visualizacao">

        <article class="card perfil__cartao">
          <div class="perfil__foto-area">
            <div
              class="perfil__avatar"
              id="perfil-avatar"
              aria-label="Avatar do perfil">
            </div>

            <button
              class="perfil__editar-foto"
              type="button"
              id="perfil-mudar-foto"
              aria-label="Escolher foto de perfil">
              ${Icones.svg("editar")}
            </button>

            <input
              type="file"
              id="perfil-arquivo-foto"
              accept="image/png,image/jpeg,image/webp"
              hidden>
          </div>

          <h2 class="perfil__nome" id="perfil-nome"></h2>

          <div class="perfil__linha-titulo">
            <h3>Sobre mim</h3>

            <button
              type="button"
              id="perfil-editar-bio"
              aria-label="Editar minha biografia">
              ${Icones.svg("editar")}
            </button>
          </div>

          <p class="perfil__bio" id="perfil-bio"></p>

          <h3 class="perfil__interesses-titulo">
            Meus interesses
          </h3>

          <div class="perfil__tags" id="perfil-interesses"></div>
        </article>

        <section class="perfil__dados">
          <h2 class="perfil__secao-titulo">
            Dados do Cadastro
          </h2>

          <div class="card perfil__dados-card">
            <h3>Dados Pessoais</h3>
            <div
              class="perfil__dados-lista"
              id="perfil-dados-lista">
            </div>
          </div>

          <div class="perfil__acoes">
            <button
              type="button"
              class="botao botao--primario"
              id="perfil-editar">
              Editar dados
            </button>

            <button
              type="button"
              class="botao botao--secundario"
              id="perfil-senha">
              Alterar senha
            </button>
          </div>

          <button
            type="button"
            class="perfil__desconectar"
            id="perfil-sair">
            ${Icones.svg("sair")} Desconectar
          </button>
        </section>
      </div>

      <section
        class="perfil__edicao"
        id="perfil-edicao"
        hidden
        aria-labelledby="perfil-edicao-titulo">

        <h2 class="subtitulo" id="perfil-edicao-titulo">
          Editar meus dados
        </h2>

        <form
          class="cadastro__form perfil__form"
          id="perfil-form"
          novalidate>
        </form>
      </section>
    `;

    buscar("perfil-editar").addEventListener("click", () => mostrarEdicao());

    buscar("perfil-editar-bio").addEventListener("click", () =>
      mostrarEdicao("bio"),
    );

    buscar("perfil-senha").addEventListener("click", abrirModalSenha);

    buscar("perfil-sair").addEventListener("click", () => {
      // TODO: encerrar a sessão real no back-end.
      window.location.href = "login.html";
    });

    buscar("perfil-mudar-foto").addEventListener("click", () => {
      buscar("perfil-arquivo-foto").click();
    });

    buscar("perfil-arquivo-foto").addEventListener("change", aoEscolherFoto);

    renderizarPerfil();
  }

  function aviso(mensagem) {
    const area = buscar("perfil-aviso");

    area.textContent = mensagem;
    area.hidden = !mensagem;
  }

  function linhaDado(lista, titulo, valor) {
    const p = elemento("p", "perfil__dado");

    p.appendChild(elemento("strong", "", titulo + ": "));

    p.appendChild(document.createTextNode(valor || "Não informado"));

    lista.appendChild(p);
  }

  // Preenche a tela de visualização.
  function renderizarPerfil() {
    buscar("perfil-nome").textContent = usuario.nome;

    buscar("perfil-bio").textContent =
      usuario.bio || "Nenhuma apresentação cadastrada.";

    const avatar = buscar("perfil-avatar");
    avatar.replaceChildren();

    if (fotoTemporaria) {
      const foto = elemento("img");

      foto.src = fotoTemporaria;
      foto.alt = "Foto do perfil";

      avatar.appendChild(foto);
    } else {
      avatar.textContent = iniciais(usuario.nome);
    }

    const tags = buscar("perfil-interesses");
    tags.replaceChildren();

    usuario.interesses.forEach((nome) => {
      tags.appendChild(elemento("span", "perfil__tag", nome));
    });

    if (!usuario.interesses.length) {
      tags.textContent = "Nenhum interesse informado.";
    }

    const lista = buscar("perfil-dados-lista");
    lista.replaceChildren();

    linhaDado(lista, "CPF/Passaporte", usuario.documento);
    linhaDado(lista, "E-mail", usuario.email);
    linhaDado(lista, "Telefone", usuario.telefone);
    linhaDado(lista, "Gênero", rotulo("generos", usuario.genero));

    linhaDado(lista, "Instituição", "Universidade Federal de Uberlândia (UFU)");

    linhaDado(
      lista,
      "Vínculo",
      estudante
        ? "Estudante internacional"
        : rotulo("vinculos", usuario.vinculo),
    );

    if (estudante) {
      linhaDado(lista, "País de origem", rotulo("paises", usuario.pais));

      linhaDado(lista, "Matrícula", usuario.matricula);
    }

    if (estudante || usuario.vinculo === "estudante") {
      linhaDado(lista, "Curso", rotulo("cursos", usuario.curso));

      linhaDado(lista, "Período", rotulo("periodos", usuario.periodo));
    }

    linhaDado(lista, "Campus", rotulo("campus", usuario.campus));

    linhaDado(lista, "Idiomas", textoIdiomas());
  }

  // Montagem dos campos da edição.
  function secao(titulo) {
    const fieldset = elemento("fieldset", "cadastro__secao");

    fieldset.appendChild(elemento("legend", "subtitulo", titulo));

    buscar("perfil-form").appendChild(fieldset);

    return fieldset;
  }

  function campo(
    pai,
    nome,
    titulo,
    tipo,
    valor,
    bloqueado = false,
    obrigatorio = false,
  ) {
    const grupo = elemento("div", "campo");
    const label = elemento("label", "campo__rotulo", titulo);

    label.htmlFor = "ed-" + nome;

    let entrada;

    if (tipo === "textarea") {
      entrada = elemento("textarea", "campo__entrada");
      entrada.rows = 4;
      entrada.maxLength = 500;
    } else if (opcoes[tipo]) {
      entrada = elemento("select", "campo__entrada");
      entrada.add(new Option("Selecione...", ""));

      opcoes[tipo].forEach((item) => {
        entrada.add(new Option(item.rotulo, item.valor));
      });
    } else {
      entrada = elemento("input", "campo__entrada");
      entrada.type = tipo;
    }

    entrada.id = "ed-" + nome;
    entrada.name = nome;
    entrada.value = valor ?? "";
    entrada.disabled = bloqueado;
    entrada.required = obrigatorio && !bloqueado;

    if (bloqueado) {
      grupo.classList.add("perfil__campo-bloqueado");
    }

    grupo.append(label, entrada);
    pai.appendChild(grupo);

    return entrada;
  }

  function adicionarIdioma(idioma = "", nivel = "") {
    const linha = elemento("div", "perfil__idioma-linha");

    const idiomaInput = campo(
      linha,
      "idioma",
      "Idioma",
      "idiomas",
      idioma,
      false,
      true,
    );

    campo(linha, "nivel", "Nível", "niveis", nivel, false, true);

    const remover = elemento("button", "perfil__remover-idioma", "Remover");

    remover.type = "button";
    remover.addEventListener("click", () => linha.remove());

    linha.appendChild(remover);
    buscar("perfil-idiomas").appendChild(linha);

    return idiomaInput;
  }

  function montarFormulario() {
    const form = buscar("perfil-form");
    form.replaceChildren();

    // Dados Pessoais
    const pessoais = secao("Dados Pessoais");

    campo(pessoais, "nome", "Nome completo", "text", usuario.nome, false, true);

    campo(
      pessoais,
      "documento",
      "CPF/Passaporte",
      "text",
      usuario.documento,
      true,
    );

    campo(pessoais, "email", "E-mail", "email", usuario.email, true);

    campo(
      pessoais,
      "telefone",
      "Telefone (com DDD)",
      "tel",
      usuario.telefone,
      false,
      true,
    );

    campo(pessoais, "genero", "Gênero", "generos", usuario.genero);

    if (estudante) {
      campo(
        pessoais,
        "pais",
        "País de origem",
        "paises",
        usuario.pais,
        false,
        true,
      );
    }

    // Vínculo Institucional
    const vinculo = secao("Vínculo Institucional");

    campo(
      vinculo,
      "vinculo",
      "Vínculo com a UFU",
      "vinculos",
      usuario.vinculo,
      true,
    );

    if (estudante) {
      campo(
        vinculo,
        "matricula",
        "Matrícula",
        "text",
        usuario.matricula,
        false,
        true,
      );
    }

    if (estudante || usuario.vinculo === "estudante") {
      campo(vinculo, "curso", "Curso", "cursos", usuario.curso, false, true);

      campo(
        vinculo,
        "periodo",
        "Período",
        "periodos",
        usuario.periodo,
        false,
        true,
      );
    }

    campo(vinculo, "campus", "Campus", "campus", usuario.campus, false, true);

    // Idiomas
    const secIdiomas = secao("Idiomas");

    const idiomas = elemento("div", "perfil__idiomas");
    idiomas.id = "perfil-idiomas";
    secIdiomas.appendChild(idiomas);

    usuario.idiomas.forEach((item) => {
      adicionarIdioma(item.idioma, item.nivel);
    });

    const addIdioma = elemento(
      "button",
      "cadastro__adicionar",
      "+ Adicionar mais um idioma",
    );

    addIdioma.type = "button";
    addIdioma.addEventListener("click", () => {
      adicionarIdioma().focus();
    });

    secIdiomas.appendChild(addIdioma);

    // Interesses
    const secInteresses = secao("Selecione seus interesses");

    const chips = elemento("div", "cadastro__interesses");

    const todos = [
      ...new Set([...interessesDisponiveis, ...usuario.interesses]),
    ];

    todos.forEach((nome, indice) => {
      const chip = elemento("span", "interesse");
      const input = elemento("input", "interesse__entrada");

      input.type = "checkbox";
      input.name = "interesses";
      input.id = "ed-interesse-" + indice;
      input.value = nome;
      input.checked = usuario.interesses.includes(nome);

      const label = elemento("label", "interesse__rotulo", nome);

      label.htmlFor = input.id;

      chip.append(input, label);
      chips.appendChild(chip);
    });

    secInteresses.appendChild(chips);

    // Bio
    const apresentacao = secao("Sobre mim");

    campo(
      apresentacao,
      "bio",
      "Conte um pouco sobre você",
      "textarea",
      usuario.bio,
    );

    // Campo histórico - somente leitura
    const historico = secao("Expectativas quanto ao Projeto MIGUFU");

    campo(
      historico,
      "expectativas",
      "Texto informado no cadastro",
      "textarea",
      usuario.expectativas,
      true,
    );

    // Botões finais
    const acoes = elemento("div", "perfil__form-acoes");

    const cancelar = elemento("button", "botao botao--secundario", "Cancelar");

    cancelar.type = "button";
    cancelar.addEventListener("click", fecharEdicao);

    const salvar = elemento(
      "button",
      "botao botao--primario",
      "Salvar alterações",
    );

    salvar.type = "submit";

    acoes.append(cancelar, salvar);
    form.appendChild(acoes);

    form.onsubmit = salvarFormulario;
  }

  function mostrarEdicao(foco) {
    aviso("");
    montarFormulario();

    buscar("perfil-visualizacao").hidden = true;
    buscar("perfil-edicao").hidden = false;

    buscar("perfil-titulo").textContent = "Editar perfil";

    const campoFoco = buscar("ed-" + foco) || buscar("ed-nome");

    campoFoco.focus();
  }

  function fecharEdicao() {
    buscar("perfil-edicao").hidden = true;
    buscar("perfil-visualizacao").hidden = false;

    buscar("perfil-titulo").textContent = "Meu perfil";
  }

  // Salva apenas na memória da página.
  function salvarFormulario(evento) {
    evento.preventDefault();

    const form = evento.currentTarget;

    if (!form.reportValidity()) return;

    const dados = new FormData(form);

    const pares = [...form.querySelectorAll(".perfil__idioma-linha")].map(
      (linha) => ({
        idioma: linha.querySelector('[name="idioma"]').value,
        nivel: linha.querySelector('[name="nivel"]').value,
      }),
    );

    const idiomas = pares.map((item) => item.idioma);

    if (new Set(idiomas).size !== idiomas.length) {
      aviso("Não selecione o mesmo idioma duas vezes.");
      return;
    }

    const digitos = String(dados.get("telefone") || "").replace(/\D/g, "");

    if (digitos.length < 8 || digitos.length > 15) {
      aviso("Informe um telefone válido, com DDD ou código internacional.");
      return;
    }

    // Somente os campos permitidos são atualizados.
    ["nome", "telefone", "genero", "bio", "campus"].forEach((chave) => {
      usuario[chave] = String(dados.get(chave) || "").trim();
    });

    if (estudante) {
      usuario.pais = String(dados.get("pais") || "");
      usuario.matricula = String(dados.get("matricula") || "").trim();
    }

    if (estudante || usuario.vinculo === "estudante") {
      usuario.curso = String(dados.get("curso") || "");
      usuario.periodo = String(dados.get("periodo") || "");
    }

    usuario.idiomas = pares;
    usuario.interesses = dados.getAll("interesses");

    fecharEdicao();
    renderizarPerfil();

    aviso("");
  }

  function aoEscolherFoto(evento) {
    const arquivo = evento.target.files[0];

    if (!arquivo) return;

    const tipos = ["image/png", "image/jpeg", "image/webp"];

    if (!tipos.includes(arquivo.type) || arquivo.size > 2 * 1024 * 1024) {
      aviso("Escolha uma imagem PNG, JPG ou WebP de até 2 MB.");

      evento.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      fotoTemporaria = String(leitor.result || "");

      renderizarPerfil();

      aviso("");
    };

    leitor.readAsDataURL(arquivo);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const possuiTraducao = estudante && Boolean(window.I18nEstudante);

    const itens = possuiTraducao
      ? I18nEstudante.traduzirMenu(Navbar.ITENS_ESTUDANTE)
      : Navbar.ITENS_VOLUNTARIO;

    Navbar.render("#navbar", {
      variante: "app",
      itens: itens,
      ativo: "perfil",
    });

    montarPagina();

    if (possuiTraducao) {
      const idioma = I18nEstudante.obter();

      I18nEstudante.aplicarIdiomaDocumento(idioma);

      const textoSair = document.querySelector("#navbar .navbar__sair span");

      if (textoSair) {
        textoSair.textContent = I18nEstudante.traduzirSair();
      }
    }

    montarPagina();
  });
})();
