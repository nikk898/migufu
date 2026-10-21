/*
   Componente CardUsuario
   
*/

(function (global) {
  "use strict";

  function escaping(texto) {
    var el = document.createElement("span");
    el.textContent = texto != null ? String(texto) : "";
    return el.innerHTML;
  }

  function obterIniciais(nome) {
    if (!nome) return "??";
    var partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  function html(dados) {
    var u = dados || {};
    var tags = Array.isArray(u.interesses) ? u.interesses : (u.interesses ? u.interesses.split(",") : []);

    var htmlTags = tags.map(function (tag) {
      return '<span class="ucad-tag">' + escaping(tag.trim()) + '</span>';
    }).join("");

    return (
      '<div class="ucad-detalhes">' +
        /* Painel Esquerdo */
        '<div class="ucad-perfil">' +
          '<div class="ucad-perfil__avatar">' + obterIniciais(u.nome) + '</div>' +
          '<h2 class="ucad-perfil__nome">' + escaping(u.nome) + '</h2>' +

          '<div class="ucad-perfil__bloco">' +
            '<h3 class="ucad-perfil__subtitulo">Sobre mim</h3>' +
            '<p class="ucad-perfil__texto">' + escaping(u.sobreMim || "Sem biografia cadastrada.") + '</p>' +
          '</div>' +

          '<div class="ucad-perfil__bloco">' +
            '<h3 class="ucad-perfil__subtitulo">Meus Interesses</h3>' +
            '<div class="ucad-perfil__tags">' + (htmlTags || '<span class="ucad-perfil__texto">Nenhum interesse informado.</span>') + '</div>' +
          '</div>' +
        '</div>' +

        /* Painel Direito */
        '<div class="ucad-info">' +
          '<div>' +
            '<h2 class="ucad-info__titulo-secao">Dados do Cadastro</h2>' +
            '<div class="ucad-card-info">' +
              '<h3 class="ucad-perfil__subtitulo" style="margin-bottom: 12px;">Dados Pessoais</h3>' +
              '<div class="ucad-grid-dados">' +
                '<div>' +
                  '<p class="ucad-dado"><strong>CPF/Passaporte:</strong> ' + escaping(u.documento || "000.000.000-00") + '</p>' +
                  '<p class="ucad-dado"><strong>E-mail:</strong> ' + escaping(u.email) + '</p>' +
                  '<p class="ucad-dado"><strong>Telefone:</strong> ' + escaping(u.telefone || "+33 6 1234 5678") + '</p>' +
                  '<p class="ucad-dado"><strong>País de origem:</strong> ' + escaping(u.pais || "França") + '</p>' +
                  '<p class="ucad-dado"><strong>Vínculo:</strong> ' + escaping(u.vinculo || "Estudante internacional") + '</p>' +
                '</div>' +
                '<div>' +
                  '<p class="ucad-dado"><strong>Matrícula:</strong> ' + escaping(u.matricula || "12345BSI678") + '</p>' +
                  '<p class="ucad-dado"><strong>Curso:</strong> ' + escaping(u.curso) + '</p>' +
                  '<p class="ucad-dado"><strong>Período:</strong> ' + escaping(u.periodo || "4º Período") + '</p>' +
                  '<p class="ucad-dado"><strong>Campus:</strong> ' + escaping(u.campus || "Santa Mônica") + '</p>' +
                  '<p class="ucad-dado"><strong>Idiomas:</strong> ' + escaping(u.idiomas || "Francês (Nativo), Inglês (Intermediário)") + '</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<h2 class="ucad-info__titulo-secao">Expectativas com o projeto</h2>' +
            '<div class="ucad-card-info">' +
              '<p class="ucad-perfil__texto">' +
                escaping(u.expectativas || "Espero que o projeto me ajude a me integrar mais facilmente à rotina da universidade e à cultura local. Minhas expectativas incluem receber apoio prático com o campus, conhecer novas pessoas, praticar o idioma e criar conexões que tornem minha experiência de intercâmbio mais acolhedora.") +
              '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render(alvo, opcoes) {
    var el = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!el) return;
    el.innerHTML = html(opcoes || {});
  }

  global.CardUsuarioCad = { render: render };
})(window);