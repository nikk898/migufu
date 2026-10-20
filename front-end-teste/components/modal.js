/* ==========================================================================
   Modal (componente reutilizável) - usa o elemento <dialog>
   Já vem com Esc para fechar, foco preso dentro do modal e fundo escurecido.

   Requer components/icones.js carregado antes.

   Uso:
     var modal = Modal.criar({ titulo: "Adicionar Instituição", larga: true });
     modal.corpo.innerHTML = "...";   // conteúdo do modal
     modal.abrir();
     modal.fechar();
     modal.definirTitulo("Editar Instituição");
     modal.destruir();                // remove do DOM

   Atalho para confirmações:
     Modal.confirmar({
       titulo: "Excluir instituição",
       mensagem: "Tem certeza?",
       textoConfirmar: "EXCLUIR",
       perigo: true,
       aoConfirmar: function () { ... }
     });
   ========================================================================== */

(function (global) {
  "use strict";

  function criar(opcoes) {
    var o = opcoes || {};

    var dlg = document.createElement("dialog");
    dlg.className = "modal" + (o.larga ? " modal--larga" : "");
    dlg.innerHTML =
      '<div class="modal__conteudo">' +
      '<button type="button" class="modal__fechar" aria-label="Fechar">' + Icones.svg("fechar") + "</button>" +
      '<div class="modal__cabecalho"><h2 class="modal__titulo"></h2></div>' +
      '<div class="modal__corpo"></div>' +
      "</div>";

    var titulo = dlg.querySelector(".modal__titulo");
    var corpo = dlg.querySelector(".modal__corpo");
    titulo.textContent = o.titulo || "";
    dlg.setAttribute("aria-labelledby", "modal-titulo-" + Math.random().toString(36).slice(2, 8));
    titulo.id = dlg.getAttribute("aria-labelledby");

    function fechar() {
      if (dlg.open) dlg.close();
    }

    dlg.querySelector(".modal__fechar").addEventListener("click", fechar);

    // Clique no fundo escurecido fecha o modal
    dlg.addEventListener("mousedown", function (e) {
      if (e.target === dlg) fechar();
    });

    dlg.addEventListener("close", function () {
      if (typeof o.aoFechar === "function") o.aoFechar();
    });

    document.body.appendChild(dlg);

    return {
      el: dlg,
      corpo: corpo,
      abrir: function () {
        if (!dlg.open) dlg.showModal();
      },
      fechar: fechar,
      definirTitulo: function (texto) {
        titulo.textContent = texto;
      },
      destruir: function () {
        fechar();
        dlg.remove();
      },
    };
  }

  function confirmar(opcoes) {
    var o = opcoes || {};
    var modal = criar({ titulo: o.titulo || "Confirmar", aoFechar: function () { modal.destruir(); } });

    var texto = document.createElement("p");
    texto.className = "modal__texto";
    texto.textContent = o.mensagem || "";

    var acoes = document.createElement("div");
    acoes.className = "modal__acoes";
    acoes.innerHTML =
      '<button type="button" class="botao botao--secundario" data-acao="cancelar">' +
      (o.textoCancelar || "CANCELAR") + "</button>" +
      '<button type="button" class="botao ' + (o.perigo ? "botao--perigo" : "botao--primario") +
      '" data-acao="confirmar">' + (o.textoConfirmar || "CONFIRMAR") + "</button>";

    modal.corpo.appendChild(texto);
    modal.corpo.appendChild(acoes);

    acoes.querySelector('[data-acao="cancelar"]').addEventListener("click", modal.fechar);
    acoes.querySelector('[data-acao="confirmar"]').addEventListener("click", function () {
      if (typeof o.aoConfirmar === "function") o.aoConfirmar();
      modal.fechar();
    });

    modal.abrir();
    return modal;
  }

  global.Modal = { criar: criar, confirmar: confirmar };
})(window);
