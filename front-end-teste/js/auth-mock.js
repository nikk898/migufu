/* ==========================================================================
   Autenticação de exemplo (SOMENTE DESENVOLVIMENTO)

   Simula o back-end para permitir testar o fluxo de login e de recuperação
   de senha. Apagar este arquivo (e o <script> nas páginas) quando a API
   estiver pronta e trocar as chamadas em login.js e recuperar-senha.js.

   Contas de teste (senha de todas: 123456):
     admin@migufu.com        -> admin.html
     mestre@migufu.com       -> mestre.html
     voluntario@migufu.com   -> voluntario.html
     estudante@migufu.com    -> estudante.html
   ========================================================================== */

(function (global) {
  "use strict";

  var USUARIOS = [
    { email: "admin@migufu.com", senha: "123456", destino: "admin.html" },
    { email: "mestre@migufu.com", senha: "123456", destino: "mestre.html" },
    { email: "voluntario@migufu.com", senha: "123456", destino: "voluntario.html" },
    { email: "estudante@migufu.com", senha: "123456", destino: "estudante.html" },
  ];

  function normalizar(email) {
    return String(email || "").trim().toLowerCase();
  }

  // Retorna a página de destino do perfil, ou null se as credenciais não conferem.
  function entrar(email, senha) {
    var e = normalizar(email);
    for (var i = 0; i < USUARIOS.length; i++) {
      if (USUARIOS[i].email === e && USUARIOS[i].senha === senha) {
        return USUARIOS[i].destino;
      }
    }
    return null;
  }

  function emailExiste(email) {
    var e = normalizar(email);
    return USUARIOS.some(function (u) {
      return u.email === e;
    });
  }

  global.AuthMock = { entrar: entrar, emailExiste: emailExiste };
})(window);