/*
 * ROTAS DE ASSOCIAÇÃO (vínculos entre voluntário e estudante internacional)
 *
 * Este arquivo ainda não tem rotas. O comentário abaixo resume a regra de negócio
 * do documento do grupo e o que ainda precisa ser decidido, para quem for implementar.
 *
 * ---------------------------------------------------------------------------
 * O QUE O DOCUMENTO DE REGRA DE NEGÓCIO CONFIRMA
 * ---------------------------------------------------------------------------
 * - Só o admin cria vínculos. Não há candidatura nem autoatendimento: o admin
 *   escolhe um estudante internacional e associa um voluntário com base nas
 *   características dos dois.
 * - Aptidão: o voluntário envia o certificado do curso (Moodle) e só o admin muda
 *   voluntario.status_aptidao para 'Apto' ou 'Nao Apto'. As colunas certificado_url
 *   e data_envio_certificado já existem.
 * - Múltiplos vínculos: voluntário e estudante podem ter mais de um Migufu. O banco
 *   já permite isso; a única trava é o mesmo par ativo duplicado (uq_vinculo_ativo).
 * - O admin pode: listar voluntários disponíveis e estudantes que querem Migufu,
 *   marcar apto/não apto, associar, ver quem já tem Migufu e desvincular.
 * - O Mestre: adiciona, edita, pausa e remove instituições.
 * - Voluntário e estudante editam o próprio formulário a qualquer momento, e o
 *   voluntário tem uma área de suporte que envia e-mail aos admins.
 * - Matching: usa idiomas (usuario_idioma), interesses (usuario_interesse),
 *   sobre_mim e expectativas_do_curso. O banco já tem tabelas e colunas para isso.
 *
 * ---------------------------------------------------------------------------
 * EM ABERTO (padrão sugerido; CONFIRMAR COM O GRUPO antes de implementar)
 * ---------------------------------------------------------------------------
 * 1. Mesma instituição: o documento não diz se o admin pode ligar pessoas de
 *    instituições diferentes. Sugestão: exigir que voluntário, estudante e admin
 *    sejam da mesma instituição (base_user.id_instituicao).
 * 2. Condições para vincular: sugestão de exigir voluntário com
 *    status_aptidao = 'Apto' e disponivel = true.
 * 3. Limite de vínculos: o documento diz "mais de um", sem dizer quantos.
 *    Sugestão: sem limite no código, só a trava do par duplicado; deixar uma
 *    constante fácil de mudar caso o grupo defina um teto.
 * 4. Desvincular: sugestão de marcar ativo = false e data_fim = agora, com
 *    motivo_saida opcional. Não apagar a linha, para manter o histórico.
 * 5. O que cada lado vê do outro: o documento não fala. Sugestão: nome, e-mail,
 *    telefone, curso, idiomas, sobre_mim e expectativas_do_curso; esconder CPF
 *    e matrícula.
 * 6. Remover instituição: o banco usa ON DELETE RESTRICT, então não dá para apagar
 *    uma instituição que tenha campus ou usuários. Na prática, "remover" seria
 *    pausar (instituicao.ativa = false).
 * 7. Envio do certificado: hoje só existe a coluna de URL. Falta decidir se o
 *    voluntário cola um link ou envia o arquivo (exigiria o Supabase Storage).
 * 8. "Admin alerta o voluntário" sobre dado incorreto: sugestão de tratar como
 *    e-mail pelo Brevo (ainda não implementado).
 *
 * ---------------------------------------------------------------------------
 * COMO USAR A AUTENTICAÇÃO JÁ PRONTA
 * ---------------------------------------------------------------------------
 * - const { autenticar, autorizar } = require('../middlewares/auth');
 * - autenticar preenche req.usuario com { id, perfil, id_instituicao }.
 * - autorizar('Admin') barra quem não tem o perfil. Perfis: Mestre, Admin,
 *   Voluntario, Internacional.
 * - O middleware só diz QUEM é o usuário e o perfil dele. A restrição de dados
 *   precisa estar no WHERE da consulta SQL:
 *     Admin:                    id_instituicao = req.usuario.id_instituicao
 *     Voluntario/Internacional: só vínculos em vinculo_migufu onde ele participa
 * - Use sempre $1, $2 nas consultas (nunca concatenar texto do usuário no SQL).
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