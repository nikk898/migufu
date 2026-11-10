class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.statusHttp = status;
  }
}

const IDIOMAS = ['Portugues', 'Espanhol', 'Ingles', 'Mandarim', 'Latim', 'Frances', 'Japones', 'Russo', 'Alemao', 'Italiano', 'Libras'];
const NIVEIS = ['Basico', 'Intermediario', 'Avancado', 'Fluente', 'Nativo'];
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const semAcento = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function texto(valor, campo, { min = 1, max = 255, obrigatorio = true } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (obrigatorio) throw new ErroHttp(400, `${campo} é obrigatório`);
    return null;
  }
  if (typeof valor !== 'string') throw new ErroHttp(400, `${campo} inválido`);
  const t = valor.replace(CONTROLE, '').trim();
  if (!t && !obrigatorio) return null;
  if (t.length < min || t.length > max) {
    throw new ErroHttp(400, `${campo} deve ter entre ${min} e ${max} caracteres`);
  }
  return t;
}

function email(valor) {
  const e = texto(valor, 'E-mail', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ErroHttp(400, 'E-mail inválido');
  return e;
}

function telefone(valor) {
  const bruto = texto(valor, 'Telefone', { max: 30 });
  let d = bruto.replace(/\D/g, '');
  // sem "+" = número brasileiro: acrescenta o 55 (necessário para o wa.me)
  if (!bruto.startsWith('+') && d.length <= 11) d = '55' + d;
  if (d.length < 10 || d.length > 15) throw new ErroHttp(400, 'Telefone inválido');
  return d;
}

function cpfValido(c) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

// Retorna { cpf, passaporte }. Voluntário: só CPF. Estudante: CPF ou passaporte.
function documento(valor, aceitaPassaporte) {
  const bruto = texto(valor, 'Documento', { max: 30 });
  const digitos = bruto.replace(/\D/g, '');
  if (cpfValido(digitos)) return { cpf: digitos, passaporte: null };
  if (aceitaPassaporte && /^[A-Za-z0-9]{6,20}$/.test(bruto)) {
    return { cpf: null, passaporte: bruto.toUpperCase() };
  }
  throw new ErroHttp(400, aceitaPassaporte ? 'CPF ou passaporte inválido' : 'CPF inválido');
}

function senhaForte(valor) {
  if (
    typeof valor !== 'string' || valor.length < 8 || Buffer.byteLength(valor) > 72 ||
    !/[A-Za-z]/.test(valor) || !/\d/.test(valor)
  ) {
    throw new ErroHttp(400, 'A senha deve ter de 8 a 72 caracteres, com letras e números');
  }
  return valor;
}

function enumerado(valor, lista, campo) {
  const chave = semAcento(String(valor ?? '')).trim().toLowerCase();
  const achado = lista.find((i) => i.toLowerCase() === chave);
  if (!achado) throw new ErroHttp(400, `${campo} inválido`);
  return achado;
}

function idPositivo(valor, campo = 'Id') {
  if (typeof valor !== 'string' && typeof valor !== 'number') throw new ErroHttp(400, `${campo} inválido`);
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 2147483647) throw new ErroHttp(400, `${campo} inválido`);
  return n;
}

// Devolve o número do período (1 a 20) ou null para "Concluído" / "Não se aplica" / vazio.
function periodo(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const chave = semAcento(String(valor)).trim().toLowerCase();
  if (chave === 'concluido' || chave === 'nao-se-aplica' || chave === 'nao se aplica') return null;
  if (!/^\d{1,2}$/.test(chave)) throw new ErroHttp(400, 'Período inválido');
  const n = Number(chave);
  if (n < 1 || n > 20) throw new ErroHttp(400, 'Período inválido');
  return n;
}

function listaIdiomas(arr) {
  if (arr === undefined || arr === null) return [];
  if (!Array.isArray(arr) || arr.length > IDIOMAS.length) throw new ErroHttp(400, 'Lista de idiomas inválida');
  const vistos = new Set();
  return arr
    .filter((i) => i && (i.idioma || i.nivel)) // ignora linhas vazias do formulário
    .map((i) => {
      const idioma = enumerado(i.idioma, IDIOMAS, 'Idioma');
      const nivel = enumerado(i.nivel, NIVEIS, 'Nível');
      if (vistos.has(idioma)) throw new ErroHttp(400, 'Idioma repetido');
      vistos.add(idioma);
      return { idioma, nivel };
    });
}

function listaInteresses(arr) {
  if (arr === undefined || arr === null) return [];
  if (!Array.isArray(arr) || arr.length > 20) throw new ErroHttp(400, 'Lista de interesses inválida');
  const mapa = new Map();
  for (const x of arr) {
    const t = texto(x, 'Interesse', { max: 100 });
    mapa.set(t.toLowerCase(), t);
  }
  return [...mapa.values()];
}

module.exports = {
  ErroHttp, IDIOMAS, NIVEIS, texto, email, telefone, documento, senhaForte,
  enumerado, idPositivo, periodo, listaIdiomas, listaInteresses,
};