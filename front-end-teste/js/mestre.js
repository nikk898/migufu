/* ==========================================================================
   Interface da Conta Mestre - Home (pages/mestre.html)
   ========================================================================== */

(function () {
  "use strict";

  // Dados de exemplo (iguais aos do protótipo do Figma).
  // TODO: substituir por uma chamada ao back-end quando a API estiver pronta.
  var dadosExemplo = {
    instituicoesCadastradas: 2,
    instituicoesAtivas: 1,
    instituicoesPausadas: 1,
  };

  function texto(nome, valor) {
    var el = document.querySelector('[data-mestre="' + nome + '"]');
    if (el) el.textContent = valor;
  }

  function preencherTela(dados) {
    texto("cadastradas", dados.instituicoesCadastradas);
    texto("ativas", dados.instituicoesAtivas);
    texto("pausadas", dados.instituicoesPausadas);
  }

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", { itens: Navbar.ITENS_MESTRE, ativo: "inicio" });
    preencherTela(dadosExemplo);
  });
})();
