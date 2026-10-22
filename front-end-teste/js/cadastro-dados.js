/*
 * Opções dos selects e dos interesses dos formulários de cadastro.
 * Os dados de gêneros, vínculos, cursos, períodos, campus, idiomas e níveis
 * são mockados para permitir o funcionamento do formulário.
 * Países: códigos ISO 3166-1 com o nome em português gerado pelo Intl.
 */
window.CADASTRO_DADOS = (function () {
  'use strict';

  const CODIGOS_PAISES = ('AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
    'CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ ' +
    'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY ' +
    'QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN ' +
    'TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');

  function listarPaises() {
    let nomes = null;

    try {
      nomes = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    } catch (e) {
      /* usa o código se Intl.DisplayNames não estiver disponível */
    }

    return CODIGOS_PAISES
      .map((codigo) => ({
        valor: codigo,
        rotulo: (nomes && nomes.of(codigo)) || codigo
      }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  }

  return {
    opcoes: {
      paises: listarPaises(),

      generos: [
        { valor: 'feminino', rotulo: 'Feminino' },
        { valor: 'masculino', rotulo: 'Masculino' },
        { valor: 'outro', rotulo: 'Outro' },
        { valor: 'prefiro-nao-informar', rotulo: 'Prefiro não informar' }
      ],

      vinculos: [
        { valor: 'estudante', rotulo: 'Estudante' },
        { valor: 'funcionario', rotulo: 'Funcionário' }
      ],

      idiomas: [
        { valor: 'portugues', rotulo: 'Português' },
        { valor: 'ingles', rotulo: 'Inglês' },
        { valor: 'espanhol', rotulo: 'Espanhol' },
        { valor: 'frances', rotulo: 'Francês' },
        { valor: 'alemao', rotulo: 'Alemão' },
        { valor: 'italiano', rotulo: 'Italiano' },
        { valor: 'libras', rotulo: 'Libras' },
        { valor: 'japones', rotulo: 'Japonês' },
        { valor: 'mandarim', rotulo: 'Mandarim' }
      ],

      niveis: [
        { valor: 'basico', rotulo: 'Básico' },
        { valor: 'intermediario', rotulo: 'Intermediário' },
        { valor: 'avancado', rotulo: 'Avançado' },
        { valor: 'fluente', rotulo: 'Fluente' },
        { valor: 'nativo', rotulo: 'Nativo' }
      ],

      cursos: [
        { valor: 'sistemas-de-informacao', rotulo: 'Sistemas de Informação' },
        { valor: 'engenharia-civil', rotulo: 'Engenharia Civil' },
        { valor: 'ciencias-contabeis', rotulo: 'Ciências Contábeis' },
        { valor: 'relacoes-internacionais', rotulo: 'Relações Internacionais' },
        { valor: 'fisioterapia', rotulo: 'Fisioterapia' }
      ],

      periodos: [
        { valor: '1', rotulo: '1º período' },
        { valor: '2', rotulo: '2º período' },
        { valor: '3', rotulo: '3º período' },
        { valor: '4', rotulo: '4º período' },
        { valor: '5', rotulo: '5º período' },
        { valor: '6', rotulo: '6º período' },
        { valor: '7', rotulo: '7º período' },
        { valor: '8', rotulo: '8º período' },
        { valor: '9', rotulo: '9º período' },
        { valor: '10', rotulo: '10º período' },
        { valor: '11', rotulo: '11º período' },
        { valor: '12', rotulo: '12º período' },
        { valor: 'concluido', rotulo: 'Concluído' },
        { valor: 'nao-se-aplica', rotulo: 'Não se aplica' }
      ],

      campus: [
        { valor: 'santa-monica', rotulo: 'Campus Santa Mônica' },
        { valor: 'umuarama', rotulo: 'Campus Umuarama' },
        { valor: 'educacao-fisica', rotulo: 'Campus Educação Física' },
        { valor: 'gloria', rotulo: 'Campus Glória' },
        { valor: 'pontal', rotulo: 'Campus Pontal (Ituiutaba)' },
        { valor: 'monte-carmelo', rotulo: 'Campus Monte Carmelo' },
        { valor: 'patos-de-minas', rotulo: 'Campus Patos de Minas' }
      ]
    },

    interesses: [
      'Parques',
      'Música',
      'Esportes',
      'Culinária',
      'Cinema',
      'Tecnologia',
      'Viagens',
      'Jogos de tabuleiro',
      'Animes',
      'Leitura'
    ]
  };
})();