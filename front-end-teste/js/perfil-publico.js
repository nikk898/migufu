/*
 * Perfil público MIGUFU — navegação dos cards, visualização e dados de teste.
 * Guarda somente campos públicos, jamais CPF, e-mail, telefone ou matrícula.
 * TODO (backend): substituir obterPerfil() por GET /usuarios/:id/perfil-publico,
 * com autorização e seleção de campos no servidor.
 */
(function (global) {
  "use strict";

  const CHAVE = "migufu-perfil-publico:";
  const CAMPOS_PUBLICOS = [
    "id", "tipo", "nome", "bio", "curso", "campus", "pais", "idiomas", "interesses"
  ];

  // Fallback para link aberto diretamente. IDs fictícios e exclusivos deste protótipo.
  // Ao clicar em um card, os campos atuais dele têm prioridade sobre estes exemplos.
  
  function obterPerfil(id) {
    if (!idValido(id)) return Promise.resolve(null);
    return Api.chamar("/perfil/publico/" + encodeURIComponent(id))
      .catch(function () { return null; });
  }

  const textos = {
    pt: {
      titulo: "Perfil público", bio: "Sobre mim", interesses: "Meus interesses",
      dados: "Informações públicas", academico: "Dados acadêmicos", tipo: "Perfil",
      estudante: "Estudante internacional", voluntario: "Voluntário MIGUFU",
      curso: "Curso", campus: "Campus", pais: "País de origem", idiomas: "Idiomas",
      semBio: "Nenhuma apresentação cadastrada.", semInteresses: "Nenhum interesse informado.",
      naoEncontrado: "Perfil não encontrado.", voltar: "Voltar para o início"
    },
    en: {
      titulo: "Public profile", bio: "About me", interesses: "My interests",
      dados: "Public information", academico: "Academic details", tipo: "Profile",
      estudante: "International student", voluntario: "MIGUFU volunteer",
      curso: "Degree program", campus: "Campus", pais: "Country of origin", idiomas: "Languages",
      semBio: "No bio provided.", semInteresses: "No interests provided.",
      naoEncontrado: "Profile not found.", voltar: "Back to home"
    },
    es: {
      titulo: "Perfil público", bio: "Sobre mí", interesses: "Mis intereses",
      dados: "Información pública", academico: "Datos académicos", tipo: "Perfil",
      estudante: "Estudiante internacional", voluntario: "Voluntario MIGUFU",
      curso: "Carrera", campus: "Campus", pais: "País de origen", idiomas: "Idiomas",
      semBio: "No hay biografía registrada.", semInteresses: "No hay intereses registrados.",
      naoEncontrado: "Perfil no encontrado.", voltar: "Volver al inicio"
    },
    fr: {
      titulo: "Profil public", bio: "À propos de moi", interesses: "Mes centres d’intérêt",
      dados: "Informations publiques", academico: "Parcours universitaire", tipo: "Profil",
      estudante: "Étudiant international", voluntario: "Bénévole MIGUFU",
      curso: "Formation", campus: "Campus", pais: "Pays d’origine", idiomas: "Langues",
      semBio: "Aucune biographie renseignée.", semInteresses: "Aucun centre d’intérêt renseigné.",
      naoEncontrado: "Profil introuvable.", voltar: "Retour à l’accueil"
    }
  };

  // Apenas termos de cadastro, não conteúdo livre (nome e biografia).
  const termos = {
    "sistemas de informação": ["Information Systems", "Sistemas de Información", "Systèmes d’information"],
    "relações internacionais": ["International Relations", "Relaciones Internacionales", "Relations internationales"],
    "psicologia": ["Psychology", "Psicología", "Psychologie"],
    "frança": ["France", "Francia", "France"],
    "argentina": ["Argentina", "Argentina", "Argentine"],
    "português": ["Portuguese", "Portugués", "Portugais"],
    "inglês": ["English", "Inglés", "Anglais"],
    "espanhol": ["Spanish", "Español", "Espagnol"],
    "francês": ["French", "Francés", "Français"],
    "nativo": ["Native", "Nativo", "Langue maternelle"],
    "intermediário": ["Intermediate", "Intermedio", "Intermédiaire"],
    "jogos de tabuleiro": ["Board games", "Juegos de mesa", "Jeux de société"],
    "música": ["Music", "Música", "Musique"],
    "esportes": ["Sports", "Deportes", "Sports"],
    "parques": ["Parks", "Parques", "Parcs"],
    "corrida": ["Running", "Correr", "Course à pied"],
    "animes": ["Anime", "Anime", "Anime"],
    "cinema": ["Cinema", "Cine", "Cinéma"],
    "viagens": ["Travel", "Viajes", "Voyages"],
    "leitura": ["Reading", "Lectura", "Lecture"],
    "culinária": ["Cooking", "Cocina", "Cuisine"],
    "festas": ["Parties", "Fiestas", "Fêtes"],
    "crochê": ["Crochet", "Croché", "Crochet"]
  };

  function idValido(id) {
    return typeof id === "string" && /^[a-z0-9_-]{1,80}$/i.test(id);
  }

  function selecionarPublicos(pessoa, tipo) {
    const seguro = {};
    for (const campo of CAMPOS_PUBLICOS) {
      if (campo === "tipo") {
        seguro.tipo = tipo === "estudante" ? "estudante" : "voluntario";
      } else if (typeof pessoa[campo] === "string") {
        seguro[campo] = pessoa[campo].slice(0, campo === "bio" ? 2000 : 700);
      }
    }
    return seguro;
  }

  function guardar(pessoa, tipo) {
    if (!pessoa || !idValido(pessoa.id)) return;
    try {
      sessionStorage.setItem(CHAVE + pessoa.id, JSON.stringify(selecionarPublicos(pessoa, tipo)));
    } catch (_) {
      // O fallback dos quatro exemplos permite navegar sem sessionStorage.
    }
  }

  function url(id, origem) {
    const busca = new URLSearchParams();
    busca.set("id", id);
    busca.set("origem", origem === "estudante" ? "estudante" : "voluntario");
    const estado = new URLSearchParams(global.location.search).get("estado");
    if (estado && /^[a-z_]{1,30}$/i.test(estado)) busca.set("estado", estado);
    return "perfil-publico.html?" + busca.toString();
  }

  function obterPerfil(id) {
    if (!idValido(id)) return null;
    try {
      const salvo = sessionStorage.getItem(CHAVE + id);
      if (salvo) {
        const pessoa = JSON.parse(salvo);
        if (pessoa && pessoa.id === id && pessoa.nome && ["voluntario", "estudante"].includes(pessoa.tipo)) {
          return selecionarPublicos(pessoa, pessoa.tipo);
        }
      }
    } catch (_) {
      // Conteúdo da sessão indisponível.
    }
    return exemplos[id] || null;
  }

  function iniciais(nome) {
    const partes = String(nome).trim().split(/\s+/);
    return (partes.length > 1 ? partes[0][0] + partes.at(-1)[0] : partes[0].slice(0, 2)).toUpperCase();
  }

  function traduzirTermo(valor, idioma) {
    const original = String(valor || "").trim();
    const indice = { en: 0, es: 1, fr: 2 }[idioma];
    if (indice === undefined) return original;
    return termos[original.toLocaleLowerCase("pt-BR")]?.[indice] || original;
  }

  function traduzirIdiomas(valor, idioma) {
    return String(valor || "")
      .split(",")
      .map(item => {
        const partes = item.trim().match(/^(.+?)\s*\((.+?)\)$/);
        return partes
          ? traduzirTermo(partes[1], idioma) + " (" + traduzirTermo(partes[2], idioma) + ")"
          : traduzirTermo(item, idioma);
      })
      .filter(Boolean)
      .join(", ");
  }

  function linha(lista, rotulo, valor) {
    if (!valor) return;
    const p = document.createElement("p");
    p.className = "perfil__dado";
    const strong = document.createElement("strong");
    strong.textContent = rotulo + ": ";
    p.append(strong, document.createTextNode(valor));
    lista.appendChild(p);
  }

  function renderizar() {
    const raiz = document.getElementById("perfil-publico-raiz");
    if (!raiz) return;

    const busca = new URLSearchParams(global.location.search);
    const id = busca.get("id");
    const origem = busca.get("origem") === "estudante" ? "estudante" : "voluntario";
    const modoEstudante = origem === "estudante";
    const idioma = modoEstudante && global.I18nEstudante ? I18nEstudante.obter() : "pt";
    const t = textos[idioma] || textos.pt;

    if (modoEstudante && global.I18nEstudante) I18nEstudante.aplicarIdiomaDocumento(idioma);
    const itens = modoEstudante
      ? (global.I18nEstudante ? I18nEstudante.traduzirMenu(Navbar.ITENS_ESTUDANTE) : Navbar.ITENS_ESTUDANTE)
      : Navbar.ITENS_VOLUNTARIO;
    Navbar.render("#navbar", { variante: "app", itens, ativo: "" });
    if (modoEstudante && global.I18nEstudante) {
      const sair = document.querySelector("#navbar .navbar__sair span");
      if (sair) sair.textContent = I18nEstudante.traduzirSair();
    }

    const retorno = origem + ".html";
    const estado = busca.get("estado");
    const volta = document.getElementById("perfil-publico-voltar");
    const paramsVolta = new URLSearchParams();
    if (estado && /^[a-z_]{1,30}$/i.test(estado)) paramsVolta.set("estado", estado);
    volta.href = retorno + (paramsVolta.size ? "?" + paramsVolta.toString() : "");
    volta.setAttribute("aria-label", t.voltar);
    volta.innerHTML = Icones.svg("voltar");

    document.getElementById("perfil-publico-titulo").textContent = t.titulo;
    document.getElementById("perfil-publico-bio-titulo").textContent = t.bio;
    document.getElementById("perfil-publico-interesses-titulo").textContent = t.interesses;
    document.getElementById("perfil-publico-dados-titulo").textContent = t.dados;
    document.getElementById("perfil-publico-academico-titulo").textContent = t.academico;
    document.title = "MIGUFU - " + t.titulo;

    obterPerfil(id).then(function (pessoa) {
      if (!pessoa) {
        const erro = document.getElementById("perfil-publico-erro");
        erro.textContent = t.naoEncontrado;
        erro.hidden = false;
        return;
      }

      document.getElementById("perfil-publico-conteudo").hidden = false;
      document.getElementById("perfil-publico-avatar").textContent = iniciais(pessoa.nome);
      document.getElementById("perfil-publico-nome").textContent = pessoa.nome;
      document.getElementById("perfil-publico-bio").textContent = pessoa.bio || t.semBio;

      const tags = document.getElementById("perfil-publico-interesses");
      const interesses = (Array.isArray(pessoa.interesses) ? pessoa.interesses : String(pessoa.interesses || "").split(","))
        .map(interesse => String(interesse).trim())
        .filter(Boolean);
      if (!interesses.length) tags.textContent = t.semInteresses;
      interesses.forEach(interesse => {
        const tag = document.createElement("span");
        tag.className = "perfil__tag";
        tag.textContent = traduzirTermo(interesse, idioma);
        tags.appendChild(tag);
      });

      const lista = document.getElementById("perfil-publico-dados");
      linha(lista, t.tipo, t[pessoa.tipo]);
      linha(lista, t.curso, traduzirTermo(pessoa.curso, idioma));
      linha(lista, t.campus, pessoa.campus);
      linha(lista, t.pais, traduzirTermo(pessoa.pais, idioma));
      linha(lista, t.idiomas, traduzirIdiomas(pessoa.idiomas, idioma));
    });
  }

  global.PerfilPublico = { guardar, url };
  document.addEventListener("DOMContentLoaded", renderizar);
})(window);
