(function () {
  "use strict";

  var POR_PAGINA = 10;
  var URL_DETALHE = "admin-usuario.html?id=";
  var usuarios = [];

  var principal = document.querySelector("main[data-tipo]");
  if (!principal) return;

  var TIPO = principal.getAttribute("data-tipo");
  var estado = {
    pagina: 1,
    busca: "",
    status: "todos",
    filtros: FiltroPreferencias.vazio()
  };

  var OPCOES_STATUS = {
    voluntario: [
      { id: "todos", rotulo: "Todos" },
      { id: "apto", rotulo: "Aptos" },
      { id: "nao_apto", rotulo: "Não aptos" },
      { id: "vinculado", rotulo: "Vinculados" },
      { id: "pendente", rotulo: "Certificado pendente" }
    ],
    estudante: [
      { id: "todos", rotulo: "Todos" },
      { id: "vinculado", rotulo: "Com vínculo" },
      { id: "sem_vinculo", rotulo: "Sem vínculo" }
    ]
  };

  function erro(e) {
    alert((e && e.message) || "Não foi possível concluir a operação.");
  }

  function carregar() {
    var q = "?tipo=" + encodeURIComponent(TIPO);
    if (estado.status !== "todos") {
      q += "&status=" + encodeURIComponent(estado.status);
    }

    return Api.chamar("/admin/usuarios" + q)
      .then(function (lista) {
        usuarios = Array.isArray(lista) ? lista : [];
        renderTudo();
      })
      .catch(erro);
  }

  function filtrados() {
    var termo = estado.busca.toLowerCase();
    var digitos = estado.busca.replace(/\D/g, "");

    return usuarios.filter(function (u) {
      if (u.tipo !== TIPO) return false;
      if (estado.status !== "todos" && u.status !== estado.status) return false;

      if (termo) {
        var nome = (u.nome || "").toLowerCase();
        var email = (u.email || "").toLowerCase();
        var cpf = (u.cpf || "").replace(/\D/g, "");
        var achou = nome.indexOf(termo) !== -1 ||
                    email.indexOf(termo) !== -1 ||
                    (digitos !== "" && cpf.indexOf(digitos) !== -1);
        if (!achou) return false;
      }

      return FiltroPreferencias.corresponde(u, estado.filtros);
    });
  }

  function renderTudo() {
    var lista = filtrados();
    var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;

    var inicio = (estado.pagina - 1) * POR_PAGINA;
    var itens = lista.slice(inicio, inicio + POR_PAGINA);

    FiltroStatus.render("#filtro-status", {
      rotulo: "Filtrar por situação",
      opcoes: OPCOES_STATUS[TIPO],
      selecionado: estado.status,
      aoMudar: function (id) {
        estado.status = id;
        estado.pagina = 1;
        carregar();
      }
    });

    FiltroPreferencias.renderAtivos("#filtros-ativos", estado.filtros, {
      aoRemover: function (novos) {
        estado.filtros = novos;
        estado.pagina = 1;
        renderTudo();
      },
      aoAbrir: function () {
        FiltroPreferencias.abrir({
          filtros: estado.filtros,
          aoAplicar: function (novos) {
            estado.filtros = novos;
            estado.pagina = 1;
            renderTudo();
          }
        });
      }
    });

    CardUsuario.renderLista("#lista-usuarios", itens, {
      urlDetalhe: function (u) {
        return URL_DETALHE + encodeURIComponent(u.id);
      },
      textoVazio: TIPO === "voluntario"
        ? "Nenhum voluntário encontrado."
        : "Nenhum estudante encontrado.",
      mostrarOpcaoCertificado: TIPO === "voluntario",
      aoExcluir: excluir,
      aoMais: function (u) {
        solicitarNovoCertificado(u);
      }
    });

    Paginacao.render("#paginacao", {
      total: lista.length,
      porPagina: POR_PAGINA,
      paginaAtual: estado.pagina,
      aoMudar: function (p) {
        estado.pagina = p;
        renderTudo();
        window.scrollTo({ top: 0 });
      }
    });
  }

  function excluir(u) {
    Modal.confirmar({
      titulo: "Excluir usuário",
      mensagem: "Tem certeza que deseja excluir " + u.nome +
        "? O cadastro, os vínculos e os chamados de suporte dessa pessoa serão apagados. Essa ação não pode ser desfeita.",
      textoConfirmar: "EXCLUIR",
      perigo: true,
      aoConfirmar: function () {
        Api.chamar("/admin/usuarios/" + encodeURIComponent(u.id), {
          method: "DELETE"
        }).then(function () {
          return carregar();
        }).catch(erro);
      }
    });
  }

  /*
   * Solicita um novo certificado:
   * - o backend altera a situação para Pendente;
   * - remove a referência ao certificado anterior;
   * - envia um e-mail ao voluntário pedindo um novo envio.
   */
  function solicitarNovoCertificado(u) {
    Modal.confirmar({
      titulo: "Solicitar novo certificado",
      mensagem: "O certificado atual de " + u.nome +
        " será marcado como pendente e a referência ao arquivo anterior será removida. " +
        "Um e-mail será enviado para " + u.email +
        " solicitando que envie o certificado novamente. Deseja continuar?",
      textoConfirmar: "SOLICITAR NOVO CERTIFICADO",
      perigo: false,
      aoConfirmar: function () {
        Api.chamar(
          "/admin/usuarios/" + encodeURIComponent(u.id) + "/certificado-pendente",
          { method: "PUT", body: {} }
        ).then(function (resposta) {
          var aviso = resposta && resposta.email_enviado
            ? "O voluntário foi notificado por e-mail."
            : "O certificado foi marcado como pendente, mas o e-mail não pôde ser enviado. Verifique a configuração SMTP do servidor.";
          alert((resposta && resposta.mensagem ? resposta.mensagem + "\n\n" : "") + aviso);
          return carregar();
        }).catch(erro);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (Api.exigirPerfil) Api.exigirPerfil(["Admin"]);

    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "usuarios",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", {
      titulo: "Usuários cadastrados"
    });

    var busca = document.getElementById("busca-usuario");
    if (busca) {
      busca.addEventListener("input", function (e) {
        estado.busca = e.target.value.trim();
        estado.pagina = 1;
        renderTudo();
      });
    }

    carregar();
  });
})();
