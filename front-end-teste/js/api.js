(function (global) {
  "use strict";

  var API = "http://localhost:3000/api"; // em produção, trocar

  // Páginas públicas: um 401 aqui é "senha errada", não "sessão expirada".
  var PUBLICAS = /(login|recuperar-senha|cadastro-estudante|cadastro-voluntario)\.html$/;

  function chamar(caminho, opcoes) {
    opcoes = opcoes || {};
    var headers = { "Content-Type": "application/json" };
    var token = localStorage.getItem("token");
    if (token) headers.Authorization = "Bearer " + token;

    return fetch(API + caminho, {
      method: opcoes.method || "GET",
      headers: headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined
    }).catch(function () {
      // servidor fora do ar, CORS bloqueado, sem internet...
      throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (dados) {
        // sem token ou token expirado: volta para o login
        if (res.status === 401 && !PUBLICAS.test(window.location.pathname)) {
          localStorage.removeItem("token");
          window.location.href = "login.html";
        }
        if (!res.ok) throw new Error(dados.erro || "Erro na requisição");
        return dados;
      });
    });
  }

  /* Baixa um arquivo protegido (ex.: certificado). Devolve { blob, nome }
     ou, se o servidor responder JSON com { url }, devolve { url }. */
  function baixar(caminho) {
    var headers = {};
    var token = localStorage.getItem("token");
    if (token) headers.Authorization = "Bearer " + token;

    return fetch(API + caminho, { headers: headers }).catch(function () {
      throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
    }).then(function (res) {
      var tipo = res.headers.get("Content-Type") || "";
      if (!res.ok || tipo.indexOf("application/json") !== -1) {
        return res.json().catch(function () { return {}; }).then(function (dados) {
          if (res.status === 401 && !PUBLICAS.test(window.location.pathname)) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
          }
          if (!res.ok) throw new Error(dados.erro || "Erro ao baixar o arquivo");
          return { url: dados.url };
        });
      }
      var disp = res.headers.get("Content-Disposition") || "";
      var achou = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disp);
      return res.blob().then(function (blob) {
        return { blob: blob, nome: achou ? decodeURIComponent(achou[1]) : "arquivo" };
      });
    });
  }

  global.Api = { chamar: chamar, baixar: baixar };
})(window);
