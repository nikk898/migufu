/*
 * Opções dos selects e dos interesses dos formulários de cadastro.
 * Do Figma: interesses e o vínculo "Estudante". Países: códigos ISO 3166-1 com
 * o nome em português gerado pelo Intl.
 *
 * TODO (equipe/back-end): idiomas, niveis, cursos, periodos e campus não estão
 * no Figma e ficam vazios até a lista oficial existir. O vínculo com a UFU
 * também só tem "Estudante" por enquanto.
 */
window.CADASTRO_DADOS = (function () {
  'use strict';

  const CODIGOS_PAISES = ('AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
    'CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ ' +
    'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY ' +
    'QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN ' +
    'TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');

  function listarPaises() {
    let nomes = null;
    try { nomes = new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch (e) { /* usa o código */ }
    return CODIGOS_PAISES
      .map((codigo) => ({ valor: codigo, rotulo: (nomes && nomes.of(codigo)) || codigo }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  }

  return {
    opcoes: {
      paises: listarPaises(),
      vinculos: [{ valor: 'estudante', rotulo: 'Estudante' }],
      idiomas: [],
      niveis: [],
      cursos: [],
      periodos: [],
      campus: [],
    },
    interesses: ['Parques', 'Música', 'Esportes', 'Culinária', 'Cinema', 'Tecnologia', 'Viagens', 'Jogos de tabuleiro', 'Animes', 'Leitura'],
  };
})();
