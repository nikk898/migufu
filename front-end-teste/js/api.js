(function (global) {
  "use strict";

  var API = "http://localhost:3000/api"; // em produção, trocar

  function chamar(caminho, opcoes) {
    opcoes = opcoes || {};
    var headers = { "Content-Type": "application/json" };
    var token = localStorage.getItem("token");
    if (token) headers.Authorization = "Bearer " + token;

    return fetch(API + caminho, {
      method: opcoes.method || "GET",
      headers: headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (dados) {
        if (res.status === 401 && token) { // token expirou: volta para o login
          localStorage.removeItem("token");
          window.location.href = "login.html";
        }
        if (!res.ok) throw new Error(dados.erro || "Erro na requisição");
        return dados;
      });
    });
  }

  global.Api = { chamar: chamar };
})(window);