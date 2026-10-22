/*
 * MIGUFU - Gerenciador de idiomas
 * Exclusivo do fluxo de Estudante Internacional
 */

(function (global) {
  "use strict";

  const CHAVE_IDIOMA = "migufu-idioma-estudante";

  const idiomasPermitidos = ["pt", "en", "es", "fr"];

  const rotulosMenu = {
    pt: {
      inicio: "Início",
      perfil: "Meu Perfil",
      ajuda: "Ajuda",
      sair: "Sair",
    },

    en: {
      inicio: "Home",
      perfil: "My Profile",
      ajuda: "Help",
      sair: "Log out",
    },

    es: {
      inicio: "Inicio",
      perfil: "Mi Perfil",
      ajuda: "Ayuda",
      sair: "Cerrar sesión",
    },

    fr: {
      inicio: "Accueil",
      perfil: "Mon profil",
      ajuda: "Aide",
      sair: "Se déconnecter",
    },
  };

  // Recupera a preferência do estudante
  function obter() {
    try {
      const salvo = localStorage.getItem(CHAVE_IDIOMA);

      if (idiomasPermitidos.includes(salvo)) {
        return salvo;
      }
    } catch (erro) {
      console.warn("Preferência de idioma indisponível.");
    }

    return "pt";
  }

  // Guarda a preferência no navegador
  function salvar(idioma) {
    if (!idiomasPermitidos.includes(idioma)) {
      return;
    }

    try {
      localStorage.setItem(CHAVE_IDIOMA, idioma);
    } catch (erro) {
      console.warn("Não foi possível salvar o idioma.");
    }

    aplicarIdiomaDocumento(idioma);
  }

  function aplicarIdiomaDocumento(idioma) {
    const codigos = {
      pt: "pt-BR",
      en: "en",
      es: "es",
      fr: "fr",
    };

    document.documentElement.lang = codigos[idioma] || "pt-BR";
  }

  // Traduz somente os rótulos da navbar recebida
  function traduzirMenu(itens) {
    const idioma = obter();
    const traducoes = rotulosMenu[idioma];

    return itens.map(function (item) {
      return {
        ...item,
        rotulo: traducoes[item.id] || item.rotulo,
      };
    });
  }

  function traduzirSair() {
    return rotulosMenu[obter()].sair;
  }

  global.I18nEstudante = {
    obter,
    salvar,
    aplicarIdiomaDocumento,
    traduzirMenu,
    traduzirSair,
  };
})(window);
