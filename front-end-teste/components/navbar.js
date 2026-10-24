/* ==========================================================================
   Navbar (componente reutilizável)

   Requer components/icones.js carregado antes.

   Uso na página:
     <div id="navbar"></div>
     <script src="../components/icones.js"></script>
     <script src="../components/navbar.js"></script>
     <script>
       Navbar.render("#navbar", { itens: Navbar.ITENS_ADMIN, ativo: "inicio" });
     </script>

   Variantes:
     "painel" (padrão)  Administrador e Conta Mestre. Desktop: barra lateral.
                        Mobile: cabeçalho com logo + "Sair" e abas embaixo.
     "app"              Voluntário e Estudante Internacional. Mobile: cabeçalho
                        com voltar, logo e notificações; abas embaixo.
                        Desktop: barra lateral.

   Opções:
     itens                lista de { id, rotulo, href, icone }
     ativo                id do item da página atual
     variante             "painel" | "app"
     semCabecalhoMobile   (painel) esconde logo e "Sair" no mobile, para a página
                          usar o seu próprio cabeçalho (components/cabecalho-pagina.js)
     imagens              pasta das imagens (padrão: ../assets/img/)
     aoSair / aoVoltar / aoNotificacoes   funções chamadas nos botões
   ========================================================================== */

(function (global) {
  "use strict";

  // Itens por perfil. Os links assumem páginas na mesma pasta (pages/).
  var ITENS_ADMIN = [
    { id: "inicio", rotulo: "Início", href: "admin.html", icone: "home" },
    { id: "migufus", rotulo: "MIGUFUS", href: "admin-validacao.html", icone: "groups" },
    { id: "usuarios", rotulo: "Usuários", href: "admin-usuarios-voluntarios.html", icone: "language" },
    { id: "ajuda", rotulo: "Ajuda", href: "admin-suporte.html", icone: "ajuda" },
  ];

  var ITENS_MESTRE = [
    { id: "inicio", rotulo: "Início", href: "mestre.html", icone: "home" },
    {
      id: "instituicoes",
      rotulo: "Instituições",
      href: "mestre-instituicoes.html",
      icone: "lista",
    },
  ];

  var ITENS_VOLUNTARIO = [
    { id: "inicio", rotulo: "Início", href: "voluntario.html", icone: "home" },
    {
      id: "perfil",
      rotulo: "Meu Perfil",
      href: "perfil-voluntario.html",
      icone: "usuario",
    },
    { id: "ajuda", rotulo: "Ajuda", href: "ajuda.html", icone: "ajuda" },
  ];

  var ITENS_ESTUDANTE = [
    { id: "inicio", rotulo: "Início", href: "estudante.html", icone: "home" },
    {
      id: "perfil",
      rotulo: "Meu Perfil",
      href: "perfil-estudante.html",
      icone: "usuario",
    },
    {
      id: "ajuda",
      rotulo: "Ajuda",
      href: "ajuda.html?perfil=estudante",
      icone: "ajuda",
    },
  ];

  function icone(nome) {
    return Icones.svg(nome, "navbar__icone");
  }

  function escapar(texto) {
    var el = document.createElement("span");
    el.textContent = texto;
    return el.innerHTML;
  }

  function montarLinks(itens, ativo) {
    return itens
      .map(function (item) {
        var atual = item.id === ativo;
        return (
          '<a class="navbar__item' +
          (atual ? " is-ativo" : "") +
          '" href="' +
          escapar(item.href) +
          '"' +
          (atual ? ' aria-current="page"' : "") +
          ">" +
          icone(item.icone) +
          "<span>" +
          escapar(item.rotulo) +
          "</span></a>"
        );
      })
      .join("");
  }

  function render(alvo, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;

    var o = opcoes || {};
    var itens = o.itens || ITENS_ADMIN;
    var imagens = o.imagens || "../assets/img/";
    var app = o.variante === "app";

    var marca =
      '<a class="navbar__marca" href="' +
      escapar(itens[0].href) +
      '" aria-label="MIGUFU - início">' +
      '<img class="navbar__logo" src="' +
      imagens +
      'logo-migufu.png" alt="">' +
      '<img class="navbar__logo-texto" src="' +
      imagens +
      'logo-migufu-texto.png" alt="MIGUFU">' +
      "</a>";

    var menu =
      '<nav class="navbar__menu" aria-label="Navegação principal">' +
      montarLinks(itens, o.ativo) +
      "</nav>";

    var classes = "navbar";
    if (app) classes += " navbar--app";
    if (o.semCabecalhoMobile) classes += " navbar--sem-cabecalho";

    if (app) {
      el.innerHTML =
        '<header class="' +
        classes +
        '">' +
        marca +
        menu +
        '<button type="button" class="navbar__sair">' +
        icone("sair") +
        "<span>Sair</span></button>" +
        "</header>";

      el.querySelector(".navbar__sair").addEventListener("click", function () {
        if (typeof o.aoSair === "function") {
          o.aoSair();
        } else {
          // TODO: encerrar a sessão no back-end.
          window.location.href = "login.html";
        }
      });

      return;
    }

    el.innerHTML =
      '<header class="' +
      classes +
      '">' +
      marca +
      menu +
      '<button type="button" class="navbar__sair">' +
      icone("sair") +
      "<span>Sair</span></button>" +
      "</header>";

    el.querySelector(".navbar__sair").addEventListener("click", function () {
      if (typeof o.aoSair === "function") {
        o.aoSair();
      } else {
        // TODO: encerrar a sessão no back-end e redirecionar para a tela de login
        window.location.href = "login.html";
      }
    });
  }

  global.Navbar = {
    render: render,
    ITENS_ADMIN: ITENS_ADMIN,
    ITENS_MESTRE: ITENS_MESTRE,
    ITENS_VOLUNTARIO: ITENS_VOLUNTARIO,
    ITENS_ESTUDANTE: ITENS_ESTUDANTE,
  };
})(window);
