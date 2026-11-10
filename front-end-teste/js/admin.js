/* ==========================================================================
   Interface do Administrador - Home (pages/admin.html)
   ========================================================================== */

(function () {
  "use strict";

  // Preenchido por GET /api/admin/resumo (números da instituição do admin logado).

  function campo(nome) {
    return document.querySelector('[data-admin="' + nome + '"]');
  }

  function texto(nome, valor) {
    var el = campo(nome);
    if (el) el.textContent = valor;
  }

  // Converte a resposta da API (snake_case) nos nomes usados pela tela.
  function converter(r) {
    return {
      nome: String(r.nome || "").split(" ")[0] || "Administrador",
      instituicao: r.instituicao,
      estudantesComMigufu: r.estudantes_com_migufu,
      estudantesSemMigufu: r.estudantes_sem_migufu,
      voluntariosAptos: r.voluntarios_aptos,
      certificadosPendentes: r.certificados_pendentes,
      mensagensPendentes: r.mensagens_pendentes,
    };
  }

  function carregarResumo() {
    return Api.chamar("/admin/resumo")
      .then(function (r) { preencherTela(converter(r)); })
      .catch(function (e) { alert(e.message); });
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
    carregarResumo();
  });
})();
