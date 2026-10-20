/* ==========================================================================
   Interface do Administrador - Home (pages/admin.html)
   ========================================================================== */

(function () {
  "use strict";

  // Dados de exemplo (iguais aos do protótipo do Figma).
  // TODO: substituir por uma chamada ao back-end quando a API estiver pronta.
  var dadosExemplo = {
    nome: "Administrador",
    instituicao: "Universidade Federal de Uberlândia (UFU)",
    estudantesComMigufu: 25,
    estudantesSemMigufu: 15,
    voluntariosAptos: 30,
    certificadosPendentes: 5,
    mensagensPendentes: 4,
  };

  function campo(nome) {
    return document.querySelector('[data-admin="' + nome + '"]');
  }

  function texto(nome, valor) {
    var el = campo(nome);
    if (el) el.textContent = valor;
  }

  function preencherTela(dados) {
    texto("nome", dados.nome);
    texto("instituicao", dados.instituicao);

    texto("com-migufu", dados.estudantesComMigufu);
    texto("sem-migufu", dados.estudantesSemMigufu);

    texto("resumo-sem-migufu", dados.estudantesSemMigufu);
    texto("resumo-voluntarios-aptos", dados.voluntariosAptos);
    texto("resumo-certificados", dados.certificadosPendentes);
    texto("resumo-mensagens", dados.mensagensPendentes);

    // Barra de apadrinhamento: a parte vermelha é a proporção sem MIGUFU
    var total = dados.estudantesComMigufu + dados.estudantesSemMigufu;
    var percentualSem = total > 0 ? (dados.estudantesSemMigufu / total) * 100 : 0;
    var barra = campo("barra-sem");
    if (barra) barra.style.width = percentualSem + "%";
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", { itens: Navbar.ITENS_ADMIN, ativo: "inicio" });
    preencherTela(dadosExemplo);
  });
})();
