/*
 * Tradução do cadastro internacional.
 * Não modifica os valores enviados pelo formulário.
 */
(function () {
  "use strict";

  if (document.body.dataset.perfil !== "estudante" || !window.I18nEstudante)
    return;

  const form = document.getElementById("form-cadastro");
  const seletor = document.getElementById("idioma-cadastro");

  if (!form || !seletor) return;

  // Cada entrada: [Inglês, Espanhol, Francês].
  // Português é a chave.
  const textos = {
    Cadastro: ["Registration", "Registro", "Inscription"],
    "Dados Pessoais": [
      "Personal information",
      "Datos personales",
      "Informations personnelles",
    ],
    "Nome Completo": ["Full name", "Nombre completo", "Nom complet"],
    "CPF/Passaporte": ["CPF/Passport", "CPF/Pasaporte", "CPF/Passeport"],
    "E-mail": ["Email", "Correo electrónico", "E-mail"],
    "Telefone para contato (com DDD)": [
      "Contact phone (with area code)",
      "Teléfono de contacto (con código de área)",
      "Téléphone de contact (avec indicatif)",
    ],
    "Qual seu país de origem?": [
      "What is your country of origin?",
      "¿Cuál es tu país de origen?",
      "Quel est votre pays d'origine ?",
    ],
    "Vínculo Institucional": [
      "University affiliation",
      "Vínculo institucional",
      "Statut universitaire",
    ],
    "Qual seu vínculo com a UFU?": [
      "What is your affiliation with UFU?",
      "¿Cuál es tu vínculo con la UFU?",
      "Quel est votre statut à l'UFU ?",
    ],
    Estudante: ["Student", "Estudiante", "Étudiant"],
    Funcionário: ["Staff", "Personal", "Personnel"],
    "Qual a sua matrícula?": [
      "What is your student ID?",
      "¿Cuál es tu matrícula?",
      "Quel est votre numéro d'étudiant ?",
    ],
    "Qual curso você faz na UFU?": [
      "What degree are you studying at UFU?",
      "¿Qué carrera estudias en la UFU?",
      "Quelle formation suivez-vous à l'UFU ?",
    ],
    "Qual período?": ["Which semester?", "¿Qué semestre?", "Quel semestre ?"],
    "Qual campus você tem aulas/trabalha?": [
      "Which campus do you attend?",
      "¿En qué campus estudias?",
      "Sur quel campus étudiez-vous ?",
    ],
    Idiomas: ["Languages", "Idiomas", "Langues"],
    Idioma: ["Language", "Idioma", "Langue"],
    Nível: ["Level", "Nivel", "Niveau"],
    "Quais idiomas você tem conhecimento e qual nível?": [
      "Which languages do you speak, and at what level?",
      "¿Qué idiomas hablas y cuál es tu nivel?",
      "Quelles langues parlez-vous et à quel niveau ?",
    ],
    "Adicionar mais um idioma": [
      "Add another language",
      "Agregar otro idioma",
      "Ajouter une langue",
    ],
    "Selecione seus interesses": [
      "Select your interests",
      "Selecciona tus intereses",
      "Choisissez vos centres d'intérêt",
    ],
    "Quais as suas expectativas quanto ao Projeto MIGUFU?": [
      "What are your expectations for the MIGUFU project?",
      "¿Cuáles son tus expectativas sobre el proyecto MIGUFU?",
      "Quelles sont vos attentes concernant le projet MIGUFU ?",
    ],
    "Sobre mim": ["About me", "Sobre mí", "À propos de moi"],
    "Conte um pouco sobre você": [
      "Tell us a little about yourself",
      "Cuéntanos un poco sobre ti",
      "Parlez-nous un peu de vous",
    ],
    "Essa apresentação poderá aparecer no seu perfil. Máximo de 500 caracteres.":
      [
        "This introduction may appear on your profile. Maximum 500 characters.",
        "Esta presentación podrá aparecer en tu perfil. Máximo 500 caracteres.",
        "Cette présentation pourra apparaître sur votre profil. 500 caractères maximum.",
      ],
    "Cadastrar perfil": ["Create profile", "Crear perfil", "Créer le profil"],

    // Placeholders
    "Selecione...": ["Select...", "Selecciona...", "Sélectionnez..."],
    "Selecione o curso...": [
      "Select a degree...",
      "Selecciona una carrera...",
      "Choisissez une formation...",
    ],
    "Selecione o período...": [
      "Select a semester...",
      "Selecciona un semestre...",
      "Choisissez un semestre...",
    ],
    "Selecione o idioma...": [
      "Select a language...",
      "Selecciona un idioma...",
      "Choisissez une langue...",
    ],
    "Selecione o nível...": [
      "Select a level...",
      "Selecciona un nivel...",
      "Choisissez un niveau...",
    ],
    "digite seu nome...": [
      "Enter your name...",
      "Escribe tu nombre...",
      "Saisissez votre nom...",
    ],
    "digite seu e-mail...": [
      "Enter your email...",
      "Escribe tu correo...",
      "Saisissez votre e-mail...",
    ],
    "digite sua matrícula...": [
      "Enter your student ID...",
      "Escribe tu matrícula...",
      "Saisissez votre numéro d'étudiant...",
    ],
    "Digite aqui as suas expectativas...": [
      "Write your expectations here...",
      "Escribe aquí tus expectativas...",
      "Écrivez vos attentes ici...",
    ],
    "Fale um pouco sobre você, seus hobbies, sua personalidade e o que gosta de fazer...":
      [
        "Tell us about yourself, your hobbies, personality and interests...",
        "Cuéntanos sobre ti, tus aficiones, personalidad e intereses...",
        "Parlez-nous de vous, de vos loisirs, de votre personnalité et de vos centres d'intérêt...",
      ],

    // Gênero
    Gênero: ["Gender", "Género", "Genre"],
    Feminino: ["Female", "Femenino", "Féminin"],
    Masculino: ["Male", "Masculino", "Masculin"],
    Outro: ["Other", "Otro", "Autre"],
    "Prefiro não informar": [
      "Prefer not to say",
      "Prefiero no decirlo",
      "Je préfère ne pas répondre",
    ],

    // Idiomas disponíveis
    Português: ["Portuguese", "Portugués", "Portugais"],
    Inglês: ["English", "Inglés", "Anglais"],
    Espanhol: ["Spanish", "Español", "Espagnol"],
    Francês: ["French", "Francés", "Français"],
    Alemão: ["German", "Alemán", "Allemand"],
    Italiano: ["Italian", "Italiano", "Italien"],
    Libras: [
      "Brazilian Sign Language",
      "Lengua de señas brasileña",
      "Langue des signes brésilienne",
    ],
    Japonês: ["Japanese", "Japonés", "Japonais"],
    Mandarim: ["Mandarin", "Mandarín", "Mandarin"],

    // Níveis
    Básico: ["Beginner", "Básico", "Débutant"],
    Intermediário: ["Intermediate", "Intermedio", "Intermédiaire"],
    Avançado: ["Advanced", "Avanzado", "Avancé"],
    Fluente: ["Fluent", "Fluido", "Courant"],
    Nativo: ["Native", "Nativo", "Langue maternelle"],

    // Cursos
    "Sistemas de Informação": [
      "Information Systems",
      "Sistemas de Información",
      "Systèmes d'information",
    ],
    "Engenharia Civil": [
      "Civil Engineering",
      "Ingeniería Civil",
      "Génie civil",
    ],
    "Ciências Contábeis": ["Accounting", "Contabilidad", "Comptabilité"],
    "Relações Internacionais": [
      "International Relations",
      "Relaciones Internacionales",
      "Relations internationales",
    ],
    Fisioterapia: ["Physiotherapy", "Fisioterapia", "Kinésithérapie"],
    Concluído: ["Completed", "Finalizado", "Terminé"],
    "Não se aplica": ["Not applicable", "No corresponde", "Sans objet"],

    // Interesses
    Parques: ["Parks", "Parques", "Parcs"],
    Música: ["Music", "Música", "Musique"],
    Esportes: ["Sports", "Deportes", "Sports"],
    Culinária: ["Cooking", "Cocina", "Cuisine"],
    Cinema: ["Cinema", "Cine", "Cinéma"],
    Tecnologia: ["Technology", "Tecnología", "Technologie"],
    Viagens: ["Travel", "Viajes", "Voyages"],
    "Jogos de tabuleiro": ["Board games", "Juegos de mesa", "Jeux de société"],
    Animes: ["Anime", "Anime", "Anime"],
    Leitura: ["Reading", "Lectura", "Lecture"],

    // Mensagens de validação
    "Preencha este campo.": [
      "Fill in this field.",
      "Completa este campo.",
      "Remplissez ce champ.",
    ],
    "Selecione uma opção.": [
      "Select an option.",
      "Selecciona una opción.",
      "Sélectionnez une option.",
    ],
    "Selecione o idioma.": [
      "Select a language.",
      "Selecciona un idioma.",
      "Sélectionnez une langue.",
    ],
    "Selecione o nível.": [
      "Select a level.",
      "Selecciona un nivel.",
      "Sélectionnez un niveau.",
    ],
    "Digite um e-mail válido.": [
      "Enter a valid email address.",
      "Introduce un correo válido.",
      "Saisissez une adresse e-mail valide.",
    ],
    "CPF inválido.": ["Invalid CPF.", "CPF no válido.", "CPF non valide."],
    "Digite um CPF ou número de passaporte válido.": [
      "Enter a valid CPF or passport number.",
      "Introduce un CPF o número de pasaporte válido.",
      "Saisissez un CPF ou un numéro de passeport valide.",
    ],
    "Digite um telefone válido.": [
      "Enter a valid phone number.",
      "Introduce un teléfono válido.",
      "Saisissez un numéro de téléphone valide.",
    ],
    "Digite o telefone com DDD.": [
      "Enter your phone with area code.",
      "Introduce el teléfono con código de área.",
      "Saisissez le téléphone avec l'indicatif régional.",
    ],

    // Acessibilidade
    "Voltar para login": [
      "Back to login",
      "Volver al inicio de sesión",
      "Retour à la connexion",
    ],
    "Idioma da página": [
      "Page language",
      "Idioma de la página",
      "Langue de la page",
    ],
  };

  const posicao = { pt: -1, en: 0, es: 1, fr: 2 };
  const originais = new WeakMap();
  const atributosOriginais = new WeakMap();
  const erroReverso = new Map();

  for (const [pt, traducoes] of Object.entries(textos)) {
    for (const traducao of traducoes) {
      erroReverso.set(traducao, pt);
    }
  }

  let idioma = I18nEstudante.obter();

  function traduzir(base) {
    if (idioma === "pt") return base;

    const pos = posicao[idioma];

    if (textos[base]) {
      return textos[base][pos] || base;
    }

    // Traduz períodos mantendo seu valor original.
    const periodo = base.match(/^(\d+)º período$/i);

    if (periodo) {
      return idioma === "en"
        ? `Semester ${periodo[1]}`
        : `Semestre ${periodo[1]}`;
    }

    return base;
  }

  // Guarda o texto português original para permitir troca de idioma.
  function textoDoElemento(elemento) {
    for (const no of elemento.childNodes) {
      if (no.nodeType !== Node.TEXT_NODE || !no.nodeValue.trim()) {
        continue;
      }

      if (!originais.has(no)) {
        originais.set(no, no.nodeValue);
      }

      const original = originais.get(no);
      const inicial = original.match(/^\s*/)[0];
      const final = original.match(/\s*$/)[0];
      const base = original.trim().replace(/\s+/g, " ");
      const novo = inicial + traduzir(base) + final;

      if (no.nodeValue !== novo) {
        no.nodeValue = novo;
      }
    }
  }

  // Tradução de placeholders e rótulos de acessibilidade.
  function atributo(elemento, nome) {
    const atual = elemento.getAttribute(nome);
    if (atual == null) return;

    let registro = atributosOriginais.get(elemento);

    if (!registro) {
      registro = {};
      atributosOriginais.set(elemento, registro);
    }

    if (!(nome in registro)) {
      registro[nome] = atual;
    }

    const novo = traduzir(registro[nome]);

    if (atual !== novo) {
      elemento.setAttribute(nome, novo);
    }
  }

  // Atualiza as opções sem mudar option.value.
  function traduzirOpcoes() {
    const codigos = {
      pt: "pt-BR",
      en: "en",
      es: "es",
      fr: "fr",
    };

    let regioes = null;

    try {
      regioes = new Intl.DisplayNames([codigos[idioma]], { type: "region" });
    } catch (_) {
      // Mantém o nome original se Intl não estiver disponível.
    }

    form.querySelectorAll("select option").forEach((opcao) => {
      if (!originais.has(opcao)) {
        originais.set(opcao, opcao.textContent.trim());
      }

      const base = originais.get(opcao);
      const ehPais = opcao.closest('select[data-opcoes="paises"]');

      const novo =
        ehPais && opcao.value && regioes
          ? regioes.of(opcao.value) || base
          : traduzir(base);

      if (opcao.textContent !== novo) {
        opcao.textContent = novo;
      }
    });
  }

  // O cadastro.js continua validando; traduzimos a mensagem exibida.
  function traduzirErros() {
    form.querySelectorAll(".campo__erro").forEach((erro) => {
      const atual = erro.textContent.trim();
      if (!atual) return;

      const pt = textos[atual] ? atual : erroReverso.get(atual) || atual;

      const novo = traduzir(pt);

      if (atual !== novo) {
        erro.textContent = novo;
      }
    });
  }

  function aplicar() {
    I18nEstudante.aplicarIdiomaDocumento(idioma);

    document.title = traduzir("Cadastro") + " - MIGUFU";

    document
      .querySelectorAll(
        ".cadastro__titulo, .cadastro__form legend, " +
          ".cadastro__form label, #idiomas-pergunta, " +
          ".cadastro__adicionar, " +
          ".cadastro__form button[type=submit], " +
          ".cadastro__ajuda, #cadastro-idioma-label",
      )
      .forEach(textoDoElemento);

    traduzirOpcoes();

    document
      .querySelectorAll(
        ".cadastro__form input[placeholder], " +
          ".cadastro__form textarea[placeholder]",
      )
      .forEach((el) => atributo(el, "placeholder"));

    document
      .querySelectorAll(
        ".cadastro__voltar, " + ".cadastro__form select[aria-label]",
      )
      .forEach((el) => atributo(el, "aria-label"));

    traduzirErros();
  }

  // Carrega a preferência já salva.
  seletor.value = idioma;

  // Troca o idioma sem perder os campos preenchidos.
  seletor.addEventListener("change", function () {
    idioma = seletor.value;
    I18nEstudante.salvar(idioma);
    aplicar();
  });

  // Traduz novas linhas de idioma e mensagens de validação.
  document
    .getElementById("adicionar-idioma")
    .addEventListener("click", () => queueMicrotask(aplicar));

  ["input", "change", "focusout", "submit"].forEach((evento) => {
    form.addEventListener(evento, () => queueMicrotask(traduzirErros));
  });

  aplicar();
})();
