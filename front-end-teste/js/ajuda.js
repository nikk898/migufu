/* ==========================================================================
   Ajuda e Suporte - Voluntário / Estudante Internacional (pages/ajuda.html)

   O perfil define quais itens aparecem na navbar:
     ajuda.html                    -> Voluntário
     ajuda.html?perfil=estudante   -> Estudante Internacional
   ========================================================================== */
/*  * Português para voluntários.
 * PT / EN / ES / FR para estudantes internacionais. */

(function () {
  "use strict";

  const textos = {
    pt: {
      titulo: "Ajuda e Suporte",
      introducao:
        "Tem alguma dúvida, problema ou sugestão? Envie uma mensagem para a nossa equipe de administradores",
      pergunta: "Como podemos ajudar?",
      placeholder: "Escreva aqui a sua mensagem...",
      enviar: "Enviar mensagem",
      erro: "Escreva uma mensagem antes de enviar.",
      sucesso: "Mensagem enviada! Nossa equipe responderá em breve.",
    },

    en: {
      titulo: "Help and Support",
      introducao:
        "Do you have a question, problem or suggestion? Send a message to our administration team.",
      pergunta: "How can we help?",
      placeholder: "Write your message here...",
      enviar: "Send message",
      erro: "Please write a message before submitting.",
      sucesso: "Message sent! Our team will reply soon.",
    },

    es: {
      titulo: "Ayuda y soporte",
      introducao:
        "¿Tienes alguna duda, problema o sugerencia? Envía un mensaje a nuestro equipo de administración.",
      pergunta: "¿Cómo podemos ayudarte?",
      placeholder: "Escribe tu mensaje aquí...",
      enviar: "Enviar mensaje",
      erro: "Escribe un mensaje antes de enviarlo.",
      sucesso: "¡Mensaje enviado! Nuestro equipo responderá pronto.",
    },

    fr: {
      titulo: "Aide et assistance",
      introducao:
        "Vous avez une question, un problème ou une suggestion ? Envoyez un message à notre équipe administrative.",
      pergunta: "Comment pouvons-nous vous aider ?",
      placeholder: "Écrivez votre message ici...",
      enviar: "Envoyer le message",
      erro: "Veuillez écrire un message avant de l'envoyer.",
      sucesso: "Message envoyé ! Notre équipe vous répondra bientôt.",
    },
  };

  let estudante = false;
  let idioma = "pt";

  let form;
  let entrada;
  let erro;
  let sucesso;

  function traducao() {
    return textos[idioma] || textos.pt;
  }

  function renderizarNavbar() {
    const itens = estudante
      ? I18nEstudante.traduzirMenu(Navbar.ITENS_ESTUDANTE)
      : Navbar.ITENS_VOLUNTARIO;

    Navbar.render("#navbar", {
      variante: "app",
      itens: itens,
      ativo: "ajuda",
    });

    if (estudante) {
      const textoSair = document.querySelector("#navbar .navbar__sair span");

      if (textoSair) {
        textoSair.textContent = I18nEstudante.traduzirSair();
      }
    }
  }

  function traduzirPagina() {
    const t = traducao();

    document.title = "MIGUFU - " + t.titulo;

    document.querySelector(".titulo-principal").textContent = t.titulo;

    document.querySelector(".ajuda__intro").textContent = t.introducao;

    document.querySelector(".ajuda__rotulo").textContent = t.pergunta;

    entrada.placeholder = t.placeholder;

    document.querySelector(".ajuda__enviar").textContent = t.enviar;

    // Atualiza mensagens de acordo com o idioma atual.
    if (!erro.hidden) {
      erro.textContent = t.erro;
    }

    if (!sucesso.hidden) {
      sucesso.textContent = t.sucesso;
    }

    if (estudante) {
      I18nEstudante.aplicarIdiomaDocumento(idioma);
    }
  }

  function mostrarErro(mensagem) {
    erro.textContent = mensagem;
    erro.hidden = !mensagem;

    if (mensagem) {
      entrada.setAttribute("aria-invalid", "true");
    } else {
      entrada.removeAttribute("aria-invalid");
    }
  }

  function aoEnviar(evento) {
    evento.preventDefault();

    sucesso.hidden = true;

    const mensagem = entrada.value.trim();

    if (!mensagem) {
      mostrarErro(traducao().erro);
      entrada.focus();
      return;
    }

    mostrarErro("");

    // Mantém a lógica atual do protótipo.
    // TODO: enviar a mensagem à API de suporte.
    form.reset();

    sucesso.textContent = traducao().sucesso;
    sucesso.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const perfil = new URLSearchParams(window.location.search).get("perfil");

    estudante = perfil === "estudante";

    if (estudante && window.I18nEstudante) {
      idioma = I18nEstudante.obter();
    }

    form = document.querySelector('[data-ajuda="form"]');
    entrada = document.getElementById("mensagem");
    erro = document.querySelector('[data-ajuda="erro"]');
    sucesso = document.querySelector('[data-ajuda="sucesso"]');

    renderizarNavbar();
    traduzirPagina();

    form.addEventListener("submit", aoEnviar);

    entrada.addEventListener("input", function () {
      if (entrada.value.trim()) {
        mostrarErro("");
      }
    });
  });
})();
