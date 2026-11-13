(function () {
  "use strict";

  function formatarIdiomas(lista) {
    if (!Array.isArray(lista) || !lista.length) return "Não informado";
    return lista.map(function (item) {
      return item.idioma + " (" + item.nivel + ")";
    }).join(", ");
  }

  function mostrarErro(mensagem) {
    var container = document.querySelector("#container-usuario-detalhes");
    if (container) {
      container.textContent = mensagem;
      container.classList.add("mensagem-erro");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "usuarios",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Usuários cadastrados" });

    var parametros = new URLSearchParams(window.location.search);
    var id = parametros.get("id");

    if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
      mostrarErro("ID de usuário inválido ou não informado na URL.");
      return;
    }

    Api.exigirPerfil(["Admin"]).then(function () {
      return Api.chamar("/admin/usuarios/" + encodeURIComponent(id));
    }).then(function (usuario) {
      // Mantém os nomes de propriedades esperados pelo CardUsuarioCad atual.
      var dadosCard = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        documento: usuario.documento,
        telefone: usuario.telefone,
        pais: usuario.pais,
        vinculo: usuario.tipo === "estudante" ? "Estudante internacional" : "Voluntário",
        matricula: usuario.matricula,
        curso: usuario.curso,
        periodo: usuario.periodo,
        campus: usuario.campus,
        idiomas: formatarIdiomas(usuario.idiomas),
        sobreMim: usuario.sobreMim,
        interesses: usuario.interesses,
        expectativas: usuario.expectativas,
        statusAptidao: usuario.statusAptidao,
        certificadoUrl: usuario.certificadoUrl,
        disponivel: usuario.disponivel,
        vinculos: usuario.vinculos
      };

      CardUsuarioCad.render("#container-usuario-detalhes", dadosCard);
    }).catch(function (erro) {
      console.error("Erro ao carregar detalhes do usuário:", erro);
      mostrarErro(erro.message || "Não foi possível carregar os dados do usuário.");
    });
  });
})();
