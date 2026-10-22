/* ==========================================================================
   Interface do Voluntário - Home (pages/voluntario.html)

   Dois estados, como no protótipo do Figma:
     "pendente"  mostra o card "Ação Necessária" (certificado + curso)
     "apto"      mostra o estudante internacional vinculado ("Meu MIGUFU")

   Para visualizar cada estado durante o desenvolvimento:
     voluntario.html              -> pendente
     voluntario.html?estado=apto  -> apto
   ========================================================================== */

(function () {
  "use strict";

  // TODO: link do curso obrigatório no Moodle (ainda não definido)
  var URL_MOODLE = "";

  // Dados de exemplo (iguais aos do protótipo do Figma).
  // TODO: substituir por chamadas ao back-end quando a API estiver pronta.
  var dadosExemplo = {
    nome: "João",
    status: "pendente", // "pendente" | "apto"
    migufus: [
      {
        nome: "Jean Martin",
        curso: "Sistemas de Informação",
        pais: "França",
        idiomas: "Francês (Nativo), Inglês (Intermediário)",
        interesses: "Jogos de tabuleiro, música, parques, corrida, animes",
        bio: "Olá! Sou o Jean, vim da França para estudar na UFU. Gosto de fazer novos amigos, praticar esportes, ouvir música e assistir animes. Se quiser jogar um jogo de tabuleiro ou conversar, me dê um oi!",
        telefone: "5500000000000", // exemplo (inválido de propósito)
        email: "contato@exemplo.com", // exemplo
      },
      {
        nome: "Sofia Rodriguez",
        curso: "Relações Internacionais",
        pais: "Argentina",
        idiomas: "Espanhol (Nativo), Português (Intermediário)",
        interesses: "Música, cinema, viagens, leitura",
        bio: "Olá! Sou a Sofia, estudante de intercâmbio na UFU. Gosto de conhecer pessoas, explorar a cidade, ouvir música e fazer novas amizades.",
        telefone: "",
        email: "sofia@example.com",
      },
    ],
  };

  function campo(nome) {
    return document.querySelector('[data-vol="' + nome + '"]');
  }

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function linhaInfo(rotulo, valor) {
    var p = criar("p", "texto");
    p.appendChild(criar("strong", "", rotulo + ": "));
    p.appendChild(document.createTextNode(valor));
    return p;
  }

  function botaoLink(classe, icone, rotulo, href) {
    var a = criar("a", "botao botao--bloco " + classe);
    a.innerHTML = Icones.svg(icone);
    a.appendChild(document.createTextNode(rotulo));
    if (href) {
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#";
      a.setAttribute("aria-disabled", "true");
    }
    return a;
  }

  function cardMigufu(m) {
    var card = criar("article", "card migufu");
    card.appendChild(criar("h3", "subtitulo", "Meu MIGUFU"));

    // Cria as iniciais a partir do nome
    var partes = (m.nome || "").trim().split(/\s+/);

    var iniciais =
      partes.length > 1
        ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
        : (partes[0] || "?").slice(0, 2).toUpperCase();

    // Avatar e nome lado a lado
    var perfil = criar("div", "migufu__perfil");

    var avatar = criar("span", "migufu__avatar", iniciais);
    avatar.setAttribute("aria-hidden", "true");

    perfil.appendChild(avatar);
    perfil.appendChild(criar("p", "migufu__nome", m.nome));

    card.appendChild(perfil);

    card.appendChild(linhaInfo("Curso", m.curso));
    card.appendChild(linhaInfo("País de origem", m.pais));
    card.appendChild(linhaInfo("Idiomas", m.idiomas));
    card.appendChild(linhaInfo("Interesses", m.interesses));
    card.appendChild(linhaInfo("Bio", m.bio));

    var botoes = criar("div", "migufu__botoes");
    var numero = (m.telefone || "").replace(/\D/g, "");
    botoes.appendChild(
      botaoLink(
        "botao--primario",
        "whatsapp",
        "Entrar em contato (WhatsApp)",
        numero ? "https://wa.me/" + numero : "",
      ),
    );
    botoes.appendChild(
      botaoLink(
        "botao--secundario",
        "email",
        "Enviar e-mail",
        m.email ? "mailto:" + m.email : "",
      ),
    );
    card.appendChild(botoes);
    return card;
  }

  function mostrarMensagem(texto, erro) {
    var el = campo("mensagem");
    el.textContent = texto;
    el.classList.toggle("is-erro", !!erro);
    el.hidden = !texto;
  }

  function configurarAcao(dados) {
    var entrada = document.getElementById("arquivo-certificado");
    var enviar = campo("enviar");

    // Abre o seletor de arquivos.
    campo("anexar").addEventListener("click", function () {
      entrada.click();
    });

    // Verifica o arquivo escolhido.
    entrada.addEventListener("change", function () {
      var arquivo = entrada.files[0];

      enviar.disabled = true;

      if (!arquivo) {
        mostrarMensagem("", false);
        return;
      }

      var ehPdf =
        arquivo.type === "application/pdf" || /\.pdf$/i.test(arquivo.name);

      if (!ehPdf) {
        entrada.value = "";
        mostrarMensagem("Selecione um arquivo no formato PDF.", true);
        return;
      }

      enviar.disabled = false;

      mostrarMensagem("Arquivo selecionado: " + arquivo.name, false);
    });

    // Simula o envio para análise.
    enviar.addEventListener("click", function () {
      if (!entrada.files[0]) {
        mostrarMensagem("Escolha o certificado antes de continuar.", true);
        return;
      }

      // TODO: substituir pela chamada real ao back-end.
      dados.status = "em_analise";

      entrada.value = "";
      enviar.disabled = true;

      mostrarMensagem("", false);
      preencherTela(dados);
    });

    // Mantém o comportamento existente do Moodle.
    var moodle = campo("moodle");

    if (URL_MOODLE) {
      moodle.href = URL_MOODLE;
    } else {
      moodle.addEventListener("click", function (e) {
        e.preventDefault();
        mostrarMensagem("O link do curso ainda não foi configurado.", true);
      });
    }
  }

  function preencherTela(dados) {
    campo("nome").textContent = dados.nome;

    var apto = dados.status === "apto";
    var reprovado = dados.status === "reprovado";
    var emAnalise = dados.status === "em_analise";

    // Atualiza a cor do status.
    var chip = campo("chip");

    chip.classList.toggle("chip--sucesso", apto);
    chip.classList.toggle("chip--erro", reprovado);
    chip.classList.toggle("chip--pendente", !apto && !reprovado);

    // Atualiza o texto do status.
    campo("chip-texto").textContent = apto
      ? "Apto"
      : reprovado
        ? "Reprovado"
        : emAnalise
          ? "Em análise"
          : "Pendente";

    // Mostra ou esconde as seções.
    campo("acao").hidden = apto || emAnalise;
    campo("analise").hidden = !emAnalise;

    // Ajusta a orientação em caso de reprovação.
    document.getElementById("titulo-acao").textContent = reprovado
      ? "Certificado reprovado — envie novamente"
      : "Ação Necessária";

    campo("orientacao").textContent = reprovado
      ? "Seu certificado não foi aprovado. Revise o arquivo e envie um novo PDF para análise."
      : "Para participar do programa, realize o treinamento obrigatório e envie o certificado.";

    var lista = campo("lista");
    lista.textContent = "";
    var temMigufus = apto && dados.migufus.length > 0;
    dados.migufus.forEach(function (m) {
      if (apto) lista.appendChild(cardMigufu(m));
    });
    lista.hidden = !temMigufus;
    campo("vazio").hidden = temMigufus;
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      variante: "app",
      itens: Navbar.ITENS_VOLUNTARIO,
      ativo: "inicio",
    });

    var estado = new URLSearchParams(window.location.search).get("estado");
    var dados = Object.assign({}, dadosExemplo);

    if (["apto", "pendente", "reprovado", "em_analise"].includes(estado)) {
      dados.status = estado;
    }

    configurarAcao(dados);
    preencherTela(dados);
  });
})();
