(function () {
  "use strict";

  var usuarioExemplo = {
    nome: "Jean Martin",
    email: "jean.martin@ufu.br",
    documento: "000.000.000-00",
    telefone: "+33 6 1234 5678",
    pais: "França",
    vinculo: "Estudante internacional",
    matricula: "12345BSI678",
    curso: "Sistemas de Informação",
    periodo: "4º Período",
    campus: "Santa Mônica",
    idiomas: "Francês (Nativo), Inglês (Intermediário)",
    sobreMim: "Olá! Sou o Jean, vim da França para estudar na UFU. Gosto de fazer novos amigos, praticar esportes, ouvir música e assistir animes. Se quiser jogar um jogo de tabuleiro ou conversar, me dê um oi!",
    interesses: ["Jogos de tabuleiro", "Música", "Parques", "Corrida", "Animes"],
    expectativas: "Espero que o projeto me ajude a me integrar mais facilmente à rotina da universidade e à cultura local. Minhas expectativas incluem receber apoio prático com o campus, conhecer novas pessoas, praticar o idioma e criar conexões que tornem minha experiência de intercâmbio mais acolhedora."
  };

  document.addEventListener("DOMContentLoaded", function () {
    Navbar.render("#navbar", {
      itens: Navbar.ITENS_ADMIN,
      ativo: "usuarios",
      semCabecalhoMobile: true
    });
    CabecalhoPagina.render("#cabecalho", { titulo: "Usuários cadastrados" });

    CardUsuarioCad.render("#container-usuario-detalhes", usuarioExemplo);
  });
})();