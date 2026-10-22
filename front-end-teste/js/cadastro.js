/* Comportamento dos formulários de cadastro (voluntário e estudante internacional). */
(function () {
  'use strict';

  const form = document.getElementById('form-cadastro');
  if (!form) return;

  const { opcoes, interesses } = window.CADASTRO_DADOS;
  const perfil = document.body.dataset.perfil;
  const listaIdiomas = document.getElementById('lista-idiomas');
  const modeloIdioma = document.getElementById('modelo-idioma');

  /* ---------- Montagem: selects, interesses e linhas de idioma ---------- */
  function preencherSelect(select) {
    (opcoes[select.dataset.opcoes] || []).forEach(({ valor, rotulo }) => select.add(new Option(rotulo, valor)));
    if (select.dataset.padrao) select.value = select.dataset.padrao;
  }

  const slug = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');

  function criarInteresses() {
    document.getElementById('lista-interesses').innerHTML = interesses.map((nome) => `
      <span class="interesse">
        <input class="interesse__entrada" type="checkbox" name="interesses" id="interesse-${slug(nome)}" value="${nome}">
        <label class="interesse__rotulo" for="interesse-${slug(nome)}">${nome}</label>
      </span>`).join('');
  }

  function adicionarIdioma() {
    const linha = modeloIdioma.content.firstElementChild.cloneNode(true);
    linha.querySelectorAll('select').forEach(preencherSelect);
    listaIdiomas.append(linha);
  }

  /* ---------- Máscara e formatação ---------- */
  function mascararTelefone(valor) {
    if (valor.trim().startsWith('+')) return valor.replace(/[^\d+\s()-]/g, ''); // internacional: não força o formato
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  }

  // Só formata ao sair do campo e só se for CPF completo; passaporte numérico não é alterado.
  function formatarDocumento(campo) {
    const limpo = campo.value.replace(/[.\-\s]/g, '');
    if (/^\d{11}$/.test(limpo)) campo.value = limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /* ---------- Validação ---------- */
  function cpfValido(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    const digito = (base) => {
      const soma = [...base].reduce((total, n, i) => total + Number(n) * (base.length + 1 - i), 0);
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };
    return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10]);
  }

  const validadores = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Digite um e-mail válido.',
    documento: (v) => {
      const limpo = v.replace(/[.\-\s]/g, '');
      if (/^\d{11}$/.test(limpo)) return cpfValido(limpo) || 'CPF inválido.';
      return /^[A-Za-z0-9]{6,9}$/.test(limpo) || 'Digite um CPF ou número de passaporte válido.';
    },
    telefone: (v) => {
      const digitos = v.replace(/\D/g, '');
      if (v.startsWith('+')) return (digitos.length >= 8 && digitos.length <= 15) || 'Digite um telefone válido.';
      return digitos.length === 10 || digitos.length === 11 || 'Digite o telefone com DDD.';
    },
  };

  function mensagemDeErro(campo) {
    const valor = campo.value.trim();

    // Linha de idioma: idioma e nível andam juntos.
    const linha = campo.closest('.cadastro__idioma');
    if (linha && !valor) {
      const outro = [...linha.querySelectorAll('select')].find((s) => s !== campo);
      if (outro.value) return campo.name === 'idioma' ? 'Selecione o idioma.' : 'Selecione o nível.';
    }

    if (!valor) {
      if (!campo.required) return '';
      return campo.tagName === 'SELECT' ? 'Selecione uma opção.' : 'Preencha este campo.';
    }

    const regra = validadores[campo.dataset.validar];
    const resultado = regra ? regra(valor) : true;
    return resultado === true ? '' : resultado;
  }

  function validar(campo) {
    const mensagem = mensagemDeErro(campo);
    const erro = campo.closest('.campo').querySelector('.campo__erro');
    campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
    if (erro) {
      erro.textContent = mensagem;
      erro.hidden = !mensagem;
    }
    return !mensagem;
  }

  const controles = () => [...form.querySelectorAll('input:not([type="checkbox"]), select, textarea')];

  function validarTudo() {
    const invalidos = controles().filter((campo) => !validar(campo));
    if (invalidos.length) invalidos[0].focus();
    return invalidos.length === 0;
  }

  /* ---------- Envio ---------- */
  function coletarDados() {
    const formData = new FormData(form);
    const dados = { perfil };
    for (const [chave, valor] of formData.entries()) {
      if (!['idioma', 'nivel', 'interesses'].includes(chave)) dados[chave] = valor.trim();
    }
    dados.idiomas = [...listaIdiomas.querySelectorAll('.cadastro__idioma')]
      .map((linha) => ({
        idioma: linha.querySelector('[name="idioma"]').value,
        nivel: linha.querySelector('[name="nivel"]').value,
      }))
      .filter((item) => item.idioma && item.nivel);
    dados.interesses = formData.getAll('interesses');
    return dados;
  }

  function enviarCadastro(dados) {
    // TODO: integrar com o back-end quando a rota de cadastro existir.
    return Promise.resolve(dados);
  }

  /* ---------- Eventos ---------- */
  form.addEventListener('input', (e) => {
    const campo = e.target;
    if (campo.dataset.mascara === 'telefone') campo.value = mascararTelefone(campo.value);
    if (campo.getAttribute('aria-invalid') === 'true') validar(campo);
  });

  form.addEventListener('change', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') validar(e.target);
  });

  form.addEventListener('focusout', (e) => {
    const campo = e.target;
    if (!campo.matches('input, select, textarea') || campo.type === 'checkbox') return;
    if (campo.dataset.validar === 'documento') formatarDocumento(campo);
    validar(campo);
  });

  document.getElementById('adicionar-idioma').addEventListener('click', adicionarIdioma);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validarTudo()) enviarCadastro(coletarDados());
  });

  /* ---------- Inicialização ---------- */
  document.querySelectorAll('select[data-opcoes]').forEach(preencherSelect);
  criarInteresses();
  adicionarIdioma();
})();
