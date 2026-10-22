/* Home do Estudante Internacional: vínculos e idioma da tela. */
(function () {
  "use strict";

  // Dados de demonstração; no futuro serão retornados pela API.
  const dadosExemplo = {
    nome: "Jean Martin",
    voluntarios: [
      {
        nome: "João Silva",
        curso: "Sistemas de Informação",
        idiomas: "Português (Nativo), Inglês (Intermediário)",
        interesses: "Jogos de tabuleiro, festas, crochê, esportes",
        bio: "Olá! Sou estudante de Sistemas de Informação na UFU. Gosto de praticar esportes, fazer amizades e conhecer pessoas de outros países.",
        telefone: "+5534000000000", // exemplo (inválido de propósito)
        email: "joao.silva@example.com",
      },
      {
        nome: "Mariana Oliveira",
        curso: "Psicologia",
        idiomas: "Português (Nativo), Espanhol (Intermediário)",
        interesses: "Música, cinema, viagens, culinária",
        bio: "Oi! Sou a Mariana, estudante da UFU. Adoro conhecer novas culturas, mostrar a cidade e ajudar estudantes internacionais a se adaptarem à universidade.",
        telefone: "+5534000000000",
        email: "mariana.oliveira@example.com",
      },
    ],
  };

  // Tradução dos textos desta página (não da navbar compartilhada).
  const traducoes = {
    pt: {
      ola: "Olá",
      titulo: "Meus Migufus",
      vinculado: "Migufu Encontrado!",
      aguardando: "Aguardando Migufu",
      vazio:
        "Você ainda não possui Migufus vinculados. Aguarde a validação de um administrador.",
      mentor: "Meu MIGUFU (Mentor)",
      curso: "Curso",
      idiomas: "Idiomas",
      interesses: "Interesses",
      bio: "Bio",
      whatsapp: "Entrar em contato (WhatsApp)",
      email: "Enviar e-mail",
      indisponivel: "Contato ainda não cadastrado",
    },
    en: {
      ola: "Hello",
      titulo: "My Migufus",
      vinculado: "MIGUFU found!",
      aguardando: "Waiting for a MIGUFU",
      vazio:
        "You don't have any linked MIGUFUS yet. Please wait for an administrator to approve your match.",
      mentor: "My MIGUFU (Mentor)",
      curso: "Course",
      idiomas: "Languages",
      interesses: "Interests",
      bio: "Bio",
      whatsapp: "Contact via WhatsApp",
      email: "Send email",
      indisponivel: "Contact details not available yet",
    },
    es: {
      ola: "¡Hola",
      titulo: "Mis Migufus",
      vinculado: "¡MIGUFU encontrado!",
      aguardando: "Esperando un MIGUFU",
      vazio:
        "Todavía no tienes MIGUFUS vinculados. Espera la validación de un administrador.",
      mentor: "Mi MIGUFU (Mentor)",
      curso: "Carrera",
      idiomas: "Idiomas",
      interesses: "Intereses",
      bio: "Bio",
      whatsapp: "Contactar por WhatsApp",
      email: "Enviar correo",
      indisponivel: "Datos de contacto no disponibles",
    },
  };

  function criar(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  function iniciais(nome) {
    const partes = String(nome || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!partes.length) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function adicionarInfo(card, rotulo, valor) {
    if (!valor) return;
    const linha = criar("p", "texto");
    linha.appendChild(criar("strong", "", rotulo + ": "));
    linha.appendChild(document.createTextNode(valor));
    card.appendChild(linha);
  }

  function criarContato(classe, icone, rotulo, endereco, indisponivel) {
    // Enquanto não houver contato real, mostramos um botão desativado.
    const item = criar(
      endereco ? "a" : "button",
      "botao botao--bloco " + classe,
    );
    item.innerHTML = Icones.svg(icone);
    item.appendChild(document.createTextNode(" " + rotulo));

    if (endereco) {
      item.href = endereco;
      if (endereco.startsWith("https://")) {
        item.target = "_blank";
        item.rel = "noopener noreferrer";
      }
    } else {
      item.type = "button";
      item.disabled = true;
      item.title = indisponivel;
    }
    return item;
  }

  function criarCard(pessoa, t) {
    const card = criar("article", "card migufu");
    card.appendChild(criar("h3", "subtitulo", t.mentor));

    const perfil = criar("div", "migufu__perfil");
    const avatar = criar("span", "migufu__avatar", iniciais(pessoa.nome));
    avatar.setAttribute("aria-hidden", "true");
    perfil.appendChild(avatar);
    perfil.appendChild(criar("p", "migufu__nome", pessoa.nome));
    card.appendChild(perfil);

    adicionarInfo(card, t.curso, pessoa.curso);
    adicionarInfo(card, t.idiomas, pessoa.idiomas);
    adicionarInfo(card, t.interesses, pessoa.interesses);
    adicionarInfo(card, t.bio, pessoa.bio);

    const numero = String(pessoa.telefone || "").replace(/\D/g, "");
    const whatsapp =
      /^\d{12,15}$/.test(numero) && !/^(\d)\1+$/.test(numero)
        ? "https://wa.me/" + numero
        : "";

    const email = String(pessoa.email || "").trim();
    const linkEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "mailto:" + email
      : "";

    const botoes = criar("div", "migufu__botoes");
    botoes.appendChild(
      criarContato(
        "botao--primario",
        "whatsapp",
        t.whatsapp,
        whatsapp,
        t.indisponivel,
      ),
    );
    botoes.appendChild(
      criarContato(
        "botao--secundario",
        "email",
        t.email,
        linkEmail,
        t.indisponivel,
      ),
    );
    card.appendChild(botoes);
    return card;
  }

  function renderizar() {
    const idioma = document.getElementById("idioma-interface").value;
    const t = traducoes[idioma] || traducoes.pt;
    document.documentElement.lang =
      { pt: "pt-BR", en: "en", es: "es" }[idioma] || "pt-BR";

    document.querySelector(".estudante__saudacao").textContent =
      t.ola + ", " + dadosExemplo.nome + "!";

    document.getElementById("titulo-migufus").textContent = t.titulo;
    document.getElementById("estudante-vazio-texto").textContent = t.vazio;

    // Estado de demonstração. Sem parâmetro, exibe os vínculos de exemplo.
    const estado = new URLSearchParams(window.location.search).get("estado");
    const voluntarios = estado === "aguardando" ? [] : dadosExemplo.voluntarios;
    const temVinculo = voluntarios.length > 0;

    const chip = document.getElementById("estudante-status");
    chip.classList.toggle("chip--sucesso", temVinculo);
    chip.classList.toggle("chip--pendente", !temVinculo);
    document.getElementById("estudante-status-texto").textContent = temVinculo
      ? t.vinculado
      : t.aguardando;

    const lista = document.getElementById("lista-mentores");
    lista.replaceChildren(...voluntarios.map((pessoa) => criarCard(pessoa, t)));
    lista.hidden = !temVinculo;
    document.getElementById("estudante-vazio").hidden = temVinculo;
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      variante: "app",
      itens: Navbar.ITENS_ESTUDANTE,
      ativo: "inicio",
    });

    document
      .getElementById("idioma-interface")
      .addEventListener("change", renderizar);
    renderizar();
  });
})();
