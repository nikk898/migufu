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

  // Tamanho máximo do PDF (o back-end também limita a 3 MB).
  var TAMANHO_MAXIMO = 3 * 1024 * 1024;

  // Preenchido por GET /api/painel/voluntario
  var dados = { nome: "", status: "pendente", migufus: [] };

  // Converte o status do banco nos estados da tela.
  function statusDaTela(r) {
    if (r.status_aptidao === "Apto") return "apto";
    if (r.status_aptidao === "Nao Apto") return "reprovado";
    return r.certificado_enviado ? "em_analise" : "pendente";
  }

  function carregarPainel() {
    return Api.chamar("/painel/voluntario")
      .then(function (r) {
        dados.nome = String(r.nome || "").split(" ")[0];
        dados.status = statusDaTela(r);
        dados.migufus = r.migufus;
        preencherTela(dados);
      })
      .catch(function (e) { alert(e.message); });
  }
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
    p.appendChild(document.createTextNode(valor || "Não informado"));
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

    var link = criar("a", "migufu__link-perfil");

    link.href = PerfilPublico.url(m.id, "voluntario");

    link.setAttribute("aria-label", "Ver perfil de " + m.nome);

    link.appendChild(avatar);
    link.appendChild(criar("span", "migufu__nome", m.nome));

    perfil.appendChild(link);

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

      if (arquivo.size > TAMANHO_MAXIMO) {
        entrada.value = "";
        mostrarMensagem("O arquivo deve ter no máximo 3 MB.", true);
        return;
      }

      enviar.disabled = false;

      mostrarMensagem("Arquivo selecionado: " + arquivo.name, false);
    });

    // Envia o PDF para o back-end.
    enviar.addEventListener("click", function () {
      var arquivo = entrada.files[0];

      if (!arquivo) {
        mostrarMensagem("Escolha o certificado antes de continuar.", true);
        return;
      }

      enviar.disabled = true;
      mostrarMensagem("Enviando certificado...", false);

      Api.enviarArquivo("/painel/voluntario/certificado", arquivo)
        .then(function () {
          dados.status = "em_analise";
          entrada.value = "";
          mostrarMensagem("", false);
          preencherTela(dados);
        })
        .catch(function (e) {
          enviar.disabled = false;
          mostrarMensagem(e.message, true);
        });
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

    configurarAcao(dados);
    preencherTela(dados);
    carregarPainel();
  });
})();