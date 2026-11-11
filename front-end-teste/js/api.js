/* ==========================================================================
   Api (js/api.js)
   Fala com o back-end. Carregue este arquivo ANTES dos scripts da página:
     <script src="../js/api.js"></script>
     <script src="../js/login.js"></script>

   Uso:
     Api.chamar("/suporte?status=pendente")                       // GET
     Api.chamar("/associar/vinculos", { method: "POST", body: {...} })
     Api.exigirPerfil(["Admin", "Mestre"]).then(function (usuario) { ... });  // páginas protegidas
     Api.sair();                                                  // botão "Sair"
   ========================================================================== */

(function (global) {
  "use strict";

  var API = "http://localhost:3000/api";   // em produção, trocar pela URL do back-end
  var PAGINA_LOGIN = "login.html";

  // perfil do banco -> página inicial (as páginas ficam na mesma pasta de login.html)
  var DESTINOS = {
    Admin: "admin.html",
    Mestre: "mestre.html",
    Voluntario: "voluntario.html",
    Internacional: "estudante.html"
  };

  function token() {
    try { return localStorage.getItem("token"); } catch (e) { return null; }
  }

  // Nestas rotas um 401 significa "dados errados", e não "sessão expirada".
  function ehRotaPublica(caminho) {
    return /^\/(usuarios\/login|senha\/|cadastro\/)/.test(caminho);
  }

  // Quando a página está saindo, devolvemos uma promessa que nunca termina
  // para nenhum .then/.catch rodar e piscar erro na tela.
  function promessaParada() {
    return new Promise(function () {});
  }

  function sair() {
    try { localStorage.removeItem("token"); } catch (e) {}
    window.location.href = PAGINA_LOGIN;
  }

  function destinoDoPerfil(perfil) {
    return DESTINOS[perfil] || PAGINA_LOGIN;
  }

  function chamar(caminho, opcoes) {
    opcoes = opcoes || {};
    var headers = { "Content-Type": "application/json" };
    var t = token();
    if (t) headers.Authorization = "Bearer " + t;

    return fetch(API + caminho, {
      method: opcoes.method || "GET",
      headers: headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined
    })
      .catch(function () {
        throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
      })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (dados) {
          if (res.status === 401 && t && !ehRotaPublica(caminho)) {
            sair();                       // token expirou ou conta desativada
            return promessaParada();
          }
          if (!res.ok) {
            var erro = new Error(dados.erro || "Erro na requisição");
            erro.status = res.status;
            throw erro;
          }
          return dados;
        });
      });
  }

  // Chame no começo de cada página protegida. Confere no servidor se o login ainda vale
  // e se o perfil pode ver a página; senão manda para o login (ou para a página do perfil).
  function exigirPerfil(perfis) {
    if (!token()) {
      sair();
      return promessaParada();
    }
    return chamar("/usuarios/me").then(function (usuario) {
      if (perfis && perfis.indexOf(usuario.perfil) === -1) {
        window.location.href = destinoDoPerfil(usuario.perfil);
        return promessaParada();
      }
      return usuario;                     // { id, nome_completo, email, perfil, ... }
    });
  }

  global.Api = {
    chamar: chamar,
    exigirPerfil: exigirPerfil,
    sair: sair,
    destinoDoPerfil: destinoDoPerfil
  };
})(window);