(function () {
  "use strict";

  var POR_PAGINA = 10;
  var URL_DETALHE = "admin-usuario.html?id="; // página de detalhe do usuário (recebe o id)

  /* ---- Dados de exemplo (trocar pela API depois) ---- */
  var PRIMEIROS = ["João", "Maria", "Felipe", "Ana", "Carlos", "Luiza", "Pedro", "Sofia", "Rafael", "Camila", "Diego", "Beatriz"];
  var SOBRENOMES = ["Silva", "Martins", "Souza", "Lima", "Prado", "Alves", "Costa", "Torres", "Moreau", "Herrera"];

  function gerar(qtd, tipo, inicioId, statusLista) {
    var O = FiltroPreferencias.OPCOES;
    var idsIdioma = ["frances", "ingles", "espanhol", "alemao", "italiano"];
    var niveis = O.niveis.filter(function (n) { return n.id !== "qualquer"; }); // usuário sempre tem um nível real
    var lista = [];

    for (var i = 0; i < qtd; i++) {
      var nome = PRIMEIROS[i % PRIMEIROS.length] + " " + SOBRENOMES[(i * 3) % SOBRENOMES.length];
      var idiomas = {};
      idiomas[idsIdioma[i % 5]] = niveis[i % 4].id;
      if (i % 2 === 0) idiomas[idsIdioma[(i + 1) % 5]] = niveis[(i + 2) % 4].id;

      var cpf = String(10000000000 + i * 7919).slice(0, 11);
      lista.push({
        id: inicioId + i,
        tipo: tipo,
        nome: nome,
        email: nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".") + i + "@ufu.br",
        cpf: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
        curso: i % 4 === 3 ? "Não se aplica" : O.cursos[(i * 7) % O.cursos.length],
        genero: O.generos[i % 3],
        interesses: [O.interesses[i % 10], O.interesses[(i + 3) % 10], O.interesses[(i + 6) % 10]],
        idiomas: idiomas,
        status: statusLista[i % statusLista.length]
      });
    }
    return lista;
  }

  var usuarios = gerar(27, "voluntario", 1, ["apto", "nao_apto", "vinculado"])
    .concat(gerar(14, "estudante", 100, ["vinculado", "sem_vinculo"]));

  /* ---- Estado ---- */
  var principal = document.querySelector("main[data-tipo]");
  var TIPO = principal.getAttribute("data-tipo"); // "voluntario" | "estudante"
  var estado = { pagina: 1, busca: "", status: "todos", filtros: FiltroPreferencias.vazio() };

  /* Opções do filtro de situação, separado por tipo de usuário.
     Os ids precisam ser iguais ao campo "status" do usuário. */
  var OPCOES_STATUS = {
    voluntario: [
      { id: "todos",     rotulo: "Todos" },
      { id: "apto",      rotulo: "Aptos" },
      { id: "nao_apto",  rotulo: "Não aptos" },
      { id: "vinculado", rotulo: "Vinculados" }
    ],
    estudante: [
      { id: "todos",       rotulo: "Todos" },
      { id: "vinculado",   rotulo: "Com vínculo" },
      { id: "sem_vinculo", rotulo: "Sem vínculo" }
    ]
  };

  function filtrados() {
    var termo = estado.busca.toLowerCase();
    var digitos = estado.busca.replace(/\D/g, "");

    return usuarios.filter(function (u) {
      if (u.tipo !== TIPO) return false;
      if (estado.status !== "todos" && u.status !== estado.status) return false;
      if (termo) {
        var achou = u.nome.toLowerCase().indexOf(termo) !== -1 ||
                    u.email.toLowerCase().indexOf(termo) !== -1 ||
                    (digitos !== "" && u.cpf.replace(/\D/g, "").indexOf(digitos) !== -1);
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
        renderTudo();
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
      urlDetalhe: function (u) { return URL_DETALHE + encodeURIComponent(u.id); },
      textoVazio: TIPO === "voluntario" ? "Nenhum voluntário encontrado." : "Nenhum estudante encontrado.",
      aoExcluir: excluir,
      aoMais: function (u) {
        // TODO: definir o que o menu "⋮" faz (ex.: editar, ver detalhes)
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
      mensagem: "Tem certeza que deseja excluir " + u.nome + "? Essa ação não pode ser desfeita.",
      textoConfirmar: "EXCLUIR",
      perigo: true,
      aoConfirmar: function () {
        usuarios = usuarios.filter(function (x) { return x.id !== u.id; });
        renderTudo();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "usuarios",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Usuários cadastrados" });

    document.getElementById("busca-usuario").addEventListener("input", function (e) {
      estado.busca = e.target.value.trim();
      estado.pagina = 1;
      renderTudo();
    });

    renderTudo();
  });
})();