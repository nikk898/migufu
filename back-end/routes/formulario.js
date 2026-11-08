/*
 * ROTAS DE FORMULÁRIO (perfil do voluntário e do estudante internacional)
 *
 * Este arquivo ainda não tem rotas. O comentário abaixo resume o que o documento de
 * regra de negócio pede e o que ainda precisa ser decidido, para quem for implementar.
 *
 * ---------------------------------------------------------------------------
 * O QUE O DOCUMENTO PEDE
 * ---------------------------------------------------------------------------
 * - Voluntário e estudante internacional preenchem um formulário com dados que
 *   ajudam o admin a encontrar o par (referência de interface: Tinder).
 * - Os dados podem ser alterados a qualquer momento (pode haver informação
 *   incorreta, e o admin pode alertar o usuário para corrigir).
 * - Voluntário: precisa enviar o certificado do curso obrigatório (Moodle) para o
 *   admin marcá-lo como apto; define a própria disponibilidade.
 * - Estudante internacional: o formulário substitui o "Termo de Adesão" em papel,
 *   então precisa do aceite do termo; o site deve ter acessibilidade no idioma dele.
 * - Há uma área de suporte (envio de e-mail aos admins). Provavelmente é outro
 *   arquivo de rotas (tabela mensagem_suporte), não este.
 *
 * ---------------------------------------------------------------------------
 * CAMPOS DOS FORMULÁRIOS ATUAIS (Google Forms / papel) E ONDE FICAM NO BANCO
 * ---------------------------------------------------------------------------
 * Voluntário:
 *   nome completo, e-mail, telefone ........ base_user (nome_completo, email, telefone)
 *   CPF ..................................... voluntario.cpf
 *   vínculo institucional ................... voluntario.vinculo (ver item 5 abaixo)
 *   curso e período (se estudante) .......... voluntario.curso, voluntario.periodo
 *   campus .................................. voluntario.campus_id
 *   idiomas e nível ......................... usuario_idioma (idioma, nivel)
 *   (novos) sobre mim, expectativas ......... voluntario.sobre_mim, expectativas_do_curso
 *   (novos) interesses ...................... usuario_interesse (tabela interesse)
 *   (novo) disponibilidade .................. voluntario.disponivel
 *   certificado ............................. voluntario.certificado_url,
 *                                             data_envio_certificado
 *
 * Estudante internacional:
 *   nome completo, e-mail, telefone ........ base_user
 *   nº de matrícula, CPF .................... estudante_internacional.matricula, cpf
 *   curso e campus .......................... estudante_internacional.curso, campus_id
 *   (novos) país de origem, data de chegada . pais_origem, data_chegada
 *   idioma do site .......................... idioma_site
 *   aceite do termo ......................... termo_aceito, termo_aceito_em
 *                                             (o banco exige as duas colunas coerentes)
 *   (novos) sobre mim, expectativas ......... sobre_mim, expectativas_do_curso
 *   idiomas e interesses .................... usuario_idioma, usuario_interesse
 *
 * ---------------------------------------------------------------------------
 * O QUE JÁ EXISTE EM routes/usuarios.js (para não duplicar)
 * ---------------------------------------------------------------------------
 * POST /api/usuarios/cadastro já cria base_user (com senha em hash) e o registro
 * em voluntario ou estudante_internacional, dentro de uma transação, com estes
 * campos: nome, e-mail, senha, telefone, CPF, curso, campus, vínculo, período,
 * matrícula, país de origem, sobre_mim e expectativas_do_curso.
 * Ainda NÃO existe: idiomas, interesses, aceite do termo, data de chegada,
 * idioma do site, disponibilidade, envio do certificado, nem edição de perfil.
 *
 * ---------------------------------------------------------------------------
 * EM ABERTO (confirmar com o grupo antes de implementar)
 * ---------------------------------------------------------------------------
 * 1. Divisão com o cadastro: o formulário é preenchido na criação da conta ou em
 *    uma etapa depois do login? Sugestão: usuarios.js cuida da conta (e-mail,
 *    senha, login) e este arquivo cuida do perfil (consulta e edição).
 * 2. Campos editáveis: e-mail, CPF e matrícula identificam a pessoa e o e-mail é
 *    usado no login. Sugestão: só o admin altera esses três.
 * 3. Segurança: o usuário só edita o PRÓPRIO perfil (usar req.usuario.id, nunca um
 *    id vindo do corpo da requisição). Aceitar só uma lista fixa de campos. Nunca
 *    deixar o usuário alterar perfil, id_instituicao ou status_aptidao.
 * 4. Dados para o formulário: precisa de rotas para listar campus (da instituição),
 *    interesses e idiomas. A tabela interesse está vazia e precisa de dados iniciais
 *    (as opções "estilo Tinder"). Idiomas e níveis são enums fixos no banco.
 * 5. Vínculo institucional: o Google Forms pergunta graduação, mestrado, servidor,
 *    mas o enum tipo_vinculo só tem 'Estudante' e 'Funcionario'. Decidir se o enum
 *    muda ou se o nível (graduação/mestrado) vira outro campo.
 * 6. Certificado: link colado ou arquivo enviado (Supabase Storage)? E, se o
 *    voluntário trocar o certificado depois de apto, o status volta a 'Pendente'?
 * 7. Dados sensíveis: CPF e matrícula não devem ser devolvidos para o outro lado
 *    do vínculo.
 *
 * ---------------------------------------------------------------------------
 * COMO USAR A AUTENTICAÇÃO JÁ PRONTA
 * ---------------------------------------------------------------------------
 * - const { autenticar, autorizar } = require('../middlewares/auth');
 * - autenticar preenche req.usuario com { id, perfil, id_instituicao }.
 * - Use sempre $1, $2 nas consultas SQL (nunca concatenar texto do usuário).
 * - Validar formato: CPF com 11 dígitos; o aceite do termo é obrigatório para o
 *   estudante internacional.
 * 
 *  * ---------------------------------------------------------------------------
 * ERROS E VALIDAÇÃO (já prontos no app.js)
 * ---------------------------------------------------------------------------
 * - Erros inesperados caem no tratador central (resposta 500 "Erro interno"); o
 *   detalhe só aparece no log do servidor. No Express 5, um erro lançado em rota
 *   async já é encaminhado para esse tratador.
 * - req.body nunca é undefined (o app.js garante {}), mas valide o TIPO dos campos
 *   (ex.: typeof campo === 'string') e o tamanho antes de gravar no banco.
 * - Para ativar este arquivo, descomente a linha correspondente em app.js.
 * 
 *  * - Para restringir dados por perfil, use utils/escopo.js:
 *   escopoPorPerfil (consultas em base_user), escopoVinculos (vinculo_migufu) e
 *   podeAcessarUsuario (rotas com :id). Detalhes no comentário daquele arquivo.
 */

const express = require('express');
// const pool = require('../database');
// const { autenticar, autorizar } = require('../middlewares/auth');

const router = express.Router();

module.exports = router;