/*
 * Tradução da página Meu Perfil do estudante internacional.
 * Utiliza a preferência salva em i18n.js.
 * Não altera os valores internos dos formulários.
 */
(function () {
  "use strict";

  if (document.body.dataset.perfil !== "estudante") return;

  const idioma = window.I18nEstudante?.obter() || "pt";
  if (idioma === "pt") return;

  const textos = {
    en: {
      "Meu perfil": "My profile",
      "Editar perfil": "Edit profile",
      "Sobre mim": "About me",
      "Meus interesses": "My interests",
      "Dados do Cadastro": "Registration details",
      "Dados Pessoais": "Personal information",
      "Editar dados": "Edit details",
      "Alterar senha": "Change password",
      Desconectar: "Log out",
      "Editar meus dados": "Edit my information",
      "CPF/Passaporte": "CPF/Passport",
      "E-mail": "Email",
      Telefone: "Phone",
      "Telefone (com DDD)": "Phone (with area code)",
      Gênero: "Gender",
      Instituição: "Institution",
      Vínculo: "Affiliation",
      "Vínculo Institucional": "University affiliation",
      "Vínculo com a UFU": "Affiliation with UFU",
      "Estudante internacional": "International student",
      "País de origem": "Country of origin",
      Matrícula: "Student ID",
      Curso: "Degree program",
      Período: "Semester",
      Campus: "Campus",
      Idiomas: "Languages",
      Idioma: "Language",
      Nível: "Level",
      "Nome completo": "Full name",
      "Selecione...": "Select...",
      "+ Adicionar mais um idioma": "+ Add another language",
      Remover: "Remove",
      "Selecione seus interesses": "Select your interests",
      "Conte um pouco sobre você": "Tell us about yourself",
      "Expectativas quanto ao Projeto MIGUFU":
        "Expectations for the MIGUFU project",
      "Texto informado no cadastro": "Text provided at registration",
      Cancelar: "Cancel",
      "Salvar alterações": "Save changes",
      Confirmar: "Confirm",
      "Senha atual": "Current password",
      "Nova senha": "New password",
      "Confirmar nova senha": "Confirm new password",
      "Mostrar senha atual": "Show current password",
      "Mostrar nova senha": "Show new password",
      "Mostrar confirmação": "Show password confirmation",
      "Mostrar senha": "Show password",
      "Ocultar senha": "Hide password",
      Fechar: "Close",
      "Voltar para o início": "Back to home",
      "Avatar do perfil": "Profile avatar",
      "Escolher foto de perfil": "Choose profile picture",
      "Editar minha biografia": "Edit my bio",
      "Foto do perfil": "Profile picture",
      "Não informado": "Not provided",
      "Nenhuma apresentação cadastrada.": "No bio provided.",
      "Nenhum interesse informado.": "No interests provided.",
      "Não selecione o mesmo idioma duas vezes.":
        "Please don't select the same language twice.",
      "Informe um telefone válido, com DDD ou código internacional.":
        "Enter a valid phone number with an area code or country code.",
      "Escolha uma imagem PNG, JPG ou WebP de até 2 MB.":
        "Choose a PNG, JPG or WebP image up to 2 MB.",
      "Preencha os três campos.": "Fill in all three fields.",
      "A nova senha deve ter pelo menos 8 caracteres.":
        "The new password must contain at least 8 characters.",
      "A confirmação não corresponde à nova senha.":
        "The passwords do not match.",
      "Escolha uma senha diferente da atual.":
        "Choose a password different from the current one.",
      "A alteração de senha ainda não está disponível.":
        "Password changes are not available yet.",
      Feminino: "Female",
      Masculino: "Male",
      Outro: "Other",
      "Prefiro não informar": "Prefer not to say",
      Estudante: "Student",
      Funcionário: "Staff",
      Português: "Portuguese",
      Inglês: "English",
      Espanhol: "Spanish",
      Francês: "French",
      Alemão: "German",
      Italiano: "Italian",
      Libras: "Brazilian Sign Language",
      Japonês: "Japanese",
      Mandarim: "Mandarin",
      Nativo: "Native",
      Básico: "Beginner",
      Intermediário: "Intermediate",
      Avançado: "Advanced",
      Fluente: "Fluent",
      "Sistemas de Informação": "Information Systems",
      "Engenharia Civil": "Civil Engineering",
      "Ciências Contábeis": "Accounting",
      "Relações Internacionais": "International Relations",
      Fisioterapia: "Physiotherapy",
      Concluído: "Completed",
      "Não se aplica": "Not applicable",
      Parques: "Parks",
      Música: "Music",
      Esportes: "Sports",
      Culinária: "Cooking",
      Cinema: "Cinema",
      Tecnologia: "Technology",
      Viagens: "Travel",
      "Jogos de tabuleiro": "Board games",
      Animes: "Anime",
      Leitura: "Reading",
    },

    es: {
      "Meu perfil": "Mi perfil",
      "Editar perfil": "Editar perfil",
      "Sobre mim": "Sobre mí",
      "Meus interesses": "Mis intereses",
      "Dados do Cadastro": "Datos del registro",
      "Dados Pessoais": "Datos personales",
      "Editar dados": "Editar datos",
      "Alterar senha": "Cambiar contraseña",
      Desconectar: "Cerrar sesión",
      "Editar meus dados": "Editar mis datos",
      "CPF/Passaporte": "CPF/Pasaporte",
      "E-mail": "Correo electrónico",
      Telefone: "Teléfono",
      "Telefone (com DDD)": "Teléfono (con código de área)",
      Gênero: "Género",
      Instituição: "Institución",
      Vínculo: "Vínculo",
      "Vínculo Institucional": "Vínculo institucional",
      "Vínculo com a UFU": "Vínculo con la UFU",
      "Estudante internacional": "Estudiante internacional",
      "País de origem": "País de origen",
      Matrícula: "Matrícula",
      Curso: "Carrera",
      Período: "Semestre",
      Campus: "Campus",
      Idiomas: "Idiomas",
      Idioma: "Idioma",
      Nível: "Nivel",
      "Nome completo": "Nombre completo",
      "Selecione...": "Seleccionar...",
      "+ Adicionar mais um idioma": "+ Agregar otro idioma",
      Remover: "Eliminar",
      "Selecione seus interesses": "Selecciona tus intereses",
      "Conte um pouco sobre você": "Cuéntanos un poco sobre ti",
      "Expectativas quanto ao Projeto MIGUFU":
        "Expectativas sobre el proyecto MIGUFU",
      "Texto informado no cadastro": "Texto proporcionado en el registro",
      Cancelar: "Cancelar",
      "Salvar alterações": "Guardar cambios",
      Confirmar: "Confirmar",
      "Senha atual": "Contraseña actual",
      "Nova senha": "Nueva contraseña",
      "Confirmar nova senha": "Confirmar nueva contraseña",
      "Mostrar senha atual": "Mostrar contraseña actual",
      "Mostrar nova senha": "Mostrar contraseña nueva",
      "Mostrar confirmação": "Mostrar confirmación",
      "Mostrar senha": "Mostrar contraseña",
      "Ocultar senha": "Ocultar contraseña",
      Fechar: "Cerrar",
      "Voltar para o início": "Volver al inicio",
      "Avatar do perfil": "Avatar del perfil",
      "Escolher foto de perfil": "Elegir foto de perfil",
      "Editar minha biografia": "Editar mi biografía",
      "Foto do perfil": "Foto de perfil",
      "Não informado": "No informado",
      "Nenhuma apresentação cadastrada.": "No hay biografía registrada.",
      "Nenhum interesse informado.": "No hay intereses registrados.",
      "Não selecione o mesmo idioma duas vezes.":
        "No selecciones el mismo idioma dos veces.",
      "Informe um telefone válido, com DDD ou código internacional.":
        "Introduce un teléfono válido con prefijo de área o de país.",
      "Escolha uma imagem PNG, JPG ou WebP de até 2 MB.":
        "Elige una imagen PNG, JPG o WebP de hasta 2 MB.",
      "Preencha os três campos.": "Completa los tres campos.",
      "A nova senha deve ter pelo menos 8 caracteres.":
        "La nueva contraseña debe tener al menos 8 caracteres.",
      "A confirmação não corresponde à nova senha.":
        "Las contraseñas no coinciden.",
      "Escolha uma senha diferente da atual.":
        "Elige una contraseña diferente de la actual.",
      "A alteração de senha ainda não está disponível.":
        "El cambio de contraseña aún no está disponible.",
      Feminino: "Femenino",
      Masculino: "Masculino",
      Outro: "Otro",
      "Prefiro não informar": "Prefiero no decirlo",
      Estudante: "Estudiante",
      Funcionário: "Empleado",
      Português: "Portugués",
      Inglês: "Inglés",
      Espanhol: "Español",
      Francês: "Francés",
      Alemão: "Alemán",
      Italiano: "Italiano",
      Libras: "Lengua de señas brasileña",
      Japonês: "Japonés",
      Mandarim: "Mandarín",
      Nativo: "Nativo",
      Básico: "Básico",
      Intermediário: "Intermedio",
      Avançado: "Avanzado",
      Fluente: "Fluido",
      "Sistemas de Informação": "Sistemas de Información",
      "Engenharia Civil": "Ingeniería Civil",
      "Ciências Contábeis": "Contabilidad",
      "Relações Internacionais": "Relaciones Internacionales",
      Fisioterapia: "Fisioterapia",
      Concluído: "Completado",
      "Não se aplica": "No aplica",
      Parques: "Parques",
      Música: "Música",
      Esportes: "Deportes",
      Culinária: "Cocina",
      Cinema: "Cine",
      Tecnologia: "Tecnología",
      Viagens: "Viajes",
      "Jogos de tabuleiro": "Juegos de mesa",
      Animes: "Anime",
      Leitura: "Lectura",
    },

    fr: {
      "Meu perfil": "Mon profil",
      "Editar perfil": "Modifier le profil",
      "Sobre mim": "À propos de moi",
      "Meus interesses": "Mes centres d’intérêt",
      "Dados do Cadastro": "Informations d'inscription",
      "Dados Pessoais": "Informations personnelles",
      "Editar dados": "Modifier mes informations",
      "Alterar senha": "Changer le mot de passe",
      Desconectar: "Se déconnecter",
      "Editar meus dados": "Modifier mes informations",
      "CPF/Passaporte": "CPF/Passeport",
      "E-mail": "E-mail",
      Telefone: "Téléphone",
      "Telefone (com DDD)": "Téléphone (avec indicatif)",
      Gênero: "Genre",
      Instituição: "Établissement",
      Vínculo: "Statut universitaire",
      "Vínculo Institucional": "Statut universitaire",
      "Vínculo com a UFU": "Statut à l’UFU",
      "Estudante internacional": "Étudiant international",
      "País de origem": "Pays d’origine",
      Matrícula: "Numéro d’étudiant",
      Curso: "Formation",
      Período: "Semestre",
      Campus: "Campus",
      Idiomas: "Langues",
      Idioma: "Langue",
      Nível: "Niveau",
      "Nome completo": "Nom complet",
      "Selecione...": "Sélectionner...",
      "+ Adicionar mais um idioma": "+ Ajouter une langue",
      Remover: "Supprimer",
      "Selecione seus interesses": "Choisissez vos centres d’intérêt",
      "Conte um pouco sobre você": "Parlez-nous un peu de vous",
      "Expectativas quanto ao Projeto MIGUFU":
        "Attentes concernant le projet MIGUFU",
      "Texto informado no cadastro": "Texte fourni lors de l’inscription",
      Cancelar: "Annuler",
      "Salvar alterações": "Enregistrer",
      Confirmar: "Confirmer",
      "Senha atual": "Mot de passe actuel",
      "Nova senha": "Nouveau mot de passe",
      "Confirmar nova senha": "Confirmer le nouveau mot de passe",
      "Mostrar senha atual": "Afficher le mot de passe actuel",
      "Mostrar nova senha": "Afficher le nouveau mot de passe",
      "Mostrar confirmação": "Afficher la confirmation",
      "Mostrar senha": "Afficher le mot de passe",
      "Ocultar senha": "Masquer le mot de passe",
      Fechar: "Fermer",
      "Voltar para o início": "Retour à l'accueil",
      "Avatar do perfil": "Avatar du profil",
      "Escolher foto de perfil": "Choisir une photo de profil",
      "Editar minha biografia": "Modifier ma biographie",
      "Foto do perfil": "Photo de profil",
      "Não informado": "Non renseigné",
      "Nenhuma apresentação cadastrada.": "Aucune biographie renseignée.",
      "Nenhum interesse informado.": "Aucun centre d’intérêt renseigné.",
      "Não selecione o mesmo idioma duas vezes.":
        "Ne sélectionnez pas deux fois la même langue.",
      "Informe um telefone válido, com DDD ou código internacional.":
        "Saisissez un téléphone valide avec indicatif régional ou international.",
      "Escolha uma imagem PNG, JPG ou WebP de até 2 MB.":
        "Choisissez une image PNG, JPG ou WebP de 2 Mo maximum.",
      "Preencha os três campos.": "Remplissez les trois champs.",
      "A nova senha deve ter pelo menos 8 caracteres.":
        "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      "A confirmação não corresponde à nova senha.":
        "Les mots de passe ne correspondent pas.",
      "Escolha uma senha diferente da atual.":
        "Choisissez un mot de passe différent de l’actuel.",
      "A alteração de senha ainda não está disponível.":
        "Le changement de mot de passe n’est pas encore disponible.",
      Feminino: "Féminin",
      Masculino: "Masculin",
      Outro: "Autre",
      "Prefiro não informar": "Je préfère ne pas répondre",
      Estudante: "Étudiant",
      Funcionário: "Personnel",
      Português: "Portugais",
      Inglês: "Anglais",
      Espanhol: "Espagnol",
      Francês: "Français",
      Alemão: "Allemand",
      Italiano: "Italien",
      Libras: "Langue des signes brésilienne",
      Japonês: "Japonais",
      Mandarim: "Mandarin",
      Nativo: "Langue maternelle",
      Básico: "Débutant",
      Intermediário: "Intermédiaire",
      Avançado: "Avancé",
      Fluente: "Courant",
      "Sistemas de Informação": "Systèmes d’information",
      "Engenharia Civil": "Génie civil",
      "Ciências Contábeis": "Comptabilité",
      "Relações Internacionais": "Relations internationales",
      Fisioterapia: "Kinésithérapie",
      Concluído: "Terminé",
      "Não se aplica": "Sans objet",
      Parques: "Parcs",
      Música: "Musique",
      Esportes: "Sports",
      Culinária: "Cuisine",
      Cinema: "Cinéma",
      Tecnologia: "Technologie",
      Viagens: "Voyages",
      "Jogos de tabuleiro": "Jeux de société",
      Animes: "Anime",
      Leitura: "Lecture",
    },
  };

  const d = textos[idioma];
  if (!d) return;

  let regioes;

  try {
    regioes = new Intl.DisplayNames([idioma], {
      type: "region",
    });
  } catch (_) {
    regioes = null;
  }

  const listaPaises = window.CADASTRO_DADOS?.opcoes?.paises || [];

  function valorTraduzido(texto) {
    const original = texto.trim();

    if (d[original]) return d[original];

    if (original.includes(", ")) {
      return original.split(", ").map(valorTraduzido).join(", ");
    }

    const composto = original.match(/^(.+?) \((.+)\)$/);

    if (composto) {
      return (
        (d[composto[1]] || composto[1]) +
        " (" +
        (d[composto[2]] || composto[2]) +
        ")"
      );
    }

    const periodo = original.match(/^(\d+)º período$/);

    if (periodo) {
      return (idioma === "en" ? "Semester " : "Semestre ") + periodo[1];
    }

    const pais = listaPaises.find((item) => item.rotulo === original);

    if (pais && regioes) {
      return regioes.of(pais.valor) || original;
    }

    return original;
  }

  function definirTexto(el, novo) {
    if (el && novo !== undefined && el.textContent !== novo) {
      el.textContent = novo;
    }
  }

  function traduzirElementos(seletor) {
    document.querySelectorAll(seletor).forEach((el) => {
      const original = el.textContent.trim();

      if (d[original]) {
        definirTexto(el, d[original]);
      }
    });
  }

  function traduzirAtributo(seletor, atributo) {
    document.querySelectorAll(seletor).forEach((el) => {
      const atual = el.getAttribute(atributo);

      if (atual && d[atual]) {
        el.setAttribute(atributo, d[atual]);
      }
    });
  }

  function atualizar() {
    // Textos da visualização, edição e modal
    traduzirElementos(
      [
        "#perfil-titulo",
        ".perfil__linha-titulo h3",
        ".perfil__interesses-titulo",
        ".perfil__secao-titulo",
        ".perfil__dados-card h3",
        "#perfil-editar",
        "#perfil-senha",
        "#perfil-edicao-titulo",
        "#perfil-form legend",
        "#perfil-form label",
        "#perfil-form .perfil__remover-idioma",
        "#perfil-form .cadastro__adicionar",
        "#perfil-form .perfil__form-acoes button",
        "#perfil-aviso",
        ".modal--perfil-senha .modal__titulo",
        ".modal--perfil-senha label",
        ".modal--perfil-senha .perfil-senha__acoes button",
        "#perfil-senha-erro",
      ].join(","),
    );

    // Preserva o ícone SVG do botão Desconectar
    const sair = document.querySelector("#perfil-sair");

    if (sair) {
      for (const no of sair.childNodes) {
        if (no.nodeType === Node.TEXT_NODE && d[no.textContent.trim()]) {
          no.textContent = " " + d[no.textContent.trim()];
        }
      }
    }

    // Interesses
    document
      .querySelectorAll(
        "#perfil-interesses .perfil__tag, " + "#perfil-form .interesse__rotulo",
      )
      .forEach((el) => {
        definirTexto(el, valorTraduzido(el.textContent));
      });

    // Rótulos e valores dos dados pessoais
    document
      .querySelectorAll("#perfil-dados-lista .perfil__dado")
      .forEach((p) => {
        const forte = p.querySelector("strong");
        if (!forte) return;

        const rotulo = forte.textContent.replace(/:\s*$/, "").trim();

        if (d[rotulo]) {
          definirTexto(forte, d[rotulo] + ": ");
        }

        for (const no of p.childNodes) {
          if (no.nodeType === Node.TEXT_NODE) {
            const resultado = valorTraduzido(no.textContent);

            if (no.textContent.trim() !== resultado) {
              no.textContent = resultado;
            }
          }
        }
      });

    // Tradução das opções sem modificar seus valores
    document.querySelectorAll("#perfil-form select").forEach((select) => {
      for (const opcao of select.options) {
        let nome = valorTraduzido(opcao.textContent);

        if (select.name === "pais" && opcao.value && regioes) {
          nome = regioes.of(opcao.value) || nome;
        }

        if (opcao.textContent !== nome) {
          opcao.textContent = nome;
        }
      }
    });

    // Rótulos de acessibilidade
    traduzirAtributo(
      ".perfil__voltar, #perfil-avatar, " +
        "#perfil-mudar-foto, #perfil-editar-bio, " +
        ".modal--perfil-senha .modal__fechar, " +
        ".modal--perfil-senha [data-senha]",
      "aria-label",
    );

    traduzirAtributo("#perfil-avatar img", "alt");
  }

  document.addEventListener("DOMContentLoaded", function () {
    atualizar();

    // Os formulários e modais são criados dinamicamente.
    // Observa novas estruturas sem modificar valores dos inputs.
    let agendado = false;

    const observador = new MutationObserver(function () {
      if (agendado) return;

      agendado = true;

      queueMicrotask(function () {
        agendado = false;
        atualizar();
      });
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
})();
