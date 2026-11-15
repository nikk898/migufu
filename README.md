# MiguFU

Plataforma de gestão e conexão entre estudantes voluntários e estudantes internacionais da Universidade Federal de Uberlândia (UFU).

Este documento apresenta os passos para configurar e executar o projeto localmente.

## 1. Pré-requisitos

Antes de iniciar, instale:

- [Node.js](https://nodejs.org/) (versão LTS recomendada).
- npm (instalado junto com o Node.js).
- [Visual Studio Code](https://code.visualstudio.com/).
- Extensão **Live Server** do VS Code.
- Uma conta e um projeto no [Supabase](https://supabase.com/), com banco PostgreSQL.

Confira as instalações:

```bash
node -v
npm -v
```

## 2. Estrutura esperada

O projeto é dividido em duas partes:

```text
MiguFU/
├── back-end/
│   ├── app.js
│   ├── package.json
│   ├── .env.exemple
│   ├── banco_de_dados/
│   │   └── banco_migufu.sql
│   ├── middlewares/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   └── utils/
│
└── front-end-teste/
    ├── pages/
    ├── components/
    ├── css/
    └── js/
```

> A estrutura do front-end acima representa a organização esperada pelos caminhos utilizados nas configurações atuais. Caso a pasta tenha outro nome no seu clone, ajuste os caminhos indicados neste README e as URLs do arquivo `.env`.

## 3. Configurar o banco de dados

1. Crie um projeto no Supabase.
2. No painel do projeto, abra o **SQL Editor**.
3. Abra o arquivo `back-end/banco_de_dados/banco_migufu.sql`.
4. Copie o conteúdo e execute no SQL Editor.
5. No Supabase, acesse **Project Settings → Database** e copie a string de conexão PostgreSQL. Se a conexão direta não funcionar no seu ambiente, utilize o Session Pooler.

O script SQL cria as tabelas, tipos, relacionamentos e índices utilizados pela aplicação, além de cadastrar a instituição UFU.

## 4. Configurar as variáveis de ambiente

Entre na pasta `back-end`:

```bash
cd back-end
```

Crie o arquivo `.env` a partir do modelo `.env.exemple`.

No Windows, você pode copiar pelo terminal:

```powershell
Copy-Item .env.exemple .env
```

No Linux/macOS:

```bash
cp .env.exemple .env
```

Abra o `.env` e preencha as variáveis:

```env
PORT=3000

DATABASE_URL=sua_string_de_conexao_postgresql
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=10

FRONTEND_URL=http://127.0.0.1:5500

BREVO_API_KEY=
EMAIL_REMETENTE=
EMAIL_REMETENTE_NOME=Migufu

URL_REDEFINIR_SENHA=http://127.0.0.1:5500/front-end-teste/pages/recuperar-senha.html
URL_SITE=http://127.0.0.1:5500/front-end-teste/pages/login.html
```

Gere uma chave para `JWT_SECRET` com:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado para `JWT_SECRET`.

### Configuração de e-mail (Brevo)

O envio de e-mails transacionais utiliza a API da Brevo. Para habilitar recuperação de senha e notificações:

1. Crie ou acesse sua conta Brevo.
2. Gere uma API Key em **SMTP & API → API Keys**.
3. Informe a chave em `BREVO_API_KEY`.
4. Configure em `EMAIL_REMETENTE` um endereço verificado na Brevo.

Se essas variáveis não forem configuradas, as funcionalidades que dependem do envio de e-mail não funcionarão corretamente. Não compartilhe sua API Key, senha do banco ou arquivo `.env`.

> O arquivo `.env` contém informações privadas e não deve ser enviado ao GitHub. Mantenha apenas o modelo `.env.exemple` no repositório.

## 5. Instalar e iniciar o back-end

Ainda dentro da pasta `back-end`, instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
node app.js
```

Quando estiver funcionando, o terminal deverá apresentar:

```text
Servidor rodando na porta 3000
```

A API ficará disponível em:

```text
http://localhost:3000/api
```

Para verificar se o servidor está ativo, acesse:

```text
http://localhost:3000/api/saude
```

A resposta esperada é:

```json
{
  "ok": true
}
```

Para encerrar o servidor, pressione `Ctrl + C` no terminal.

### Criar um usuário administrador

O projeto possui um script para criar usuários com perfil `Admin` ou `Mestre`.

Execute o comando dentro da pasta `back-end`.

Administrador (informe a sigla de uma instituição já cadastrada no banco):

```bash
node scripts/criar-admin.js --perfil Admin --nome "Nome do Administrador" --email administrador@exemplo.com --instituicao UFU
```

Conta mestre:

```bash
node scripts/criar-admin.js --perfil Mestre --nome "Nome do Responsável" --email mestre@exemplo.com
```

O script solicitará a senha no próprio terminal. Ela deve ter pelo menos 8 caracteres.

## 6. Iniciar o front-end

O front-end é composto por HTML, CSS e JavaScript e pode ser executado pelo Live Server.

1. Abra a pasta raiz do projeto no VS Code.
2. Localize a pasta `front-end-teste`.
3. Abra `pages/login.html`.
4. Clique com o botão direito no arquivo e selecione **Open with Live Server**.

O endereço local normalmente será:

```text
http://127.0.0.1:5500/front-end-teste/pages/login.html
```

Mantenha o back-end em execução enquanto utiliza o front-end.

### Conferir o endereço da API

No arquivo `front-end-teste/js/api.js`, confira a constante:

```javascript
var API = "http://localhost:3000/api";
```

Ela deve apontar para o endereço em que o back-end está rodando.

O arquivo `api.js` precisa ser carregado antes dos scripts das páginas que utilizam o objeto `Api`. Exemplo:

```html
<script src="../js/api.js"></script>
<script src="../js/login.js"></script>
```

## 7. Executar o projeto no dia a dia

Depois da configuração inicial, a rotina para iniciar o sistema é:

**Terminal 1 — Back-end**

```bash
cd back-end
node app.js
```

**Front-end**

No VS Code, abra `front-end-teste/pages/login.html` com o Live Server.

Acesse o endereço exibido pelo Live Server no navegador.

## 8. Solução de problemas

| Problema | Possível solução |
|---|---|
| `JWT_SECRET não definido no .env` | Verifique se o arquivo `.env` existe dentro de `back-end` e se `JWT_SECRET` está preenchido. |
| `DATABASE_URL não definida no .env` | Configure a string de conexão do PostgreSQL no `.env`. |
| Erro ao conectar ao banco | Confira a URL, as credenciais, a disponibilidade do Supabase e o tipo de conexão utilizado. |
| Erro de CORS | Confira se `FRONTEND_URL` corresponde exatamente à origem aberta pelo Live Server, incluindo protocolo, host e porta. |
| `Api is not defined` | Inclua `api.js` antes do script que utiliza `Api` na página HTML. |
| Erro de conexão com a API | Confirme que o back-end está ativo na porta configurada e que `API` em `api.js` aponta para ele. |
| E-mails não são enviados | Confira a API Key da Brevo e se o remetente está verificado. |

## 9. Tecnologias

- HTML5, CSS3 e JavaScript
- Node.js
- Express
- PostgreSQL
- Supabase
- Brevo
- Git e GitHub

## 10. Segurança

- Não publique o arquivo `.env`.
- Não compartilhe credenciais do Supabase ou a API Key da Brevo.
- Utilize senhas fortes para contas administrativas.
- As permissões dos usuários são verificadas pelo back-end.

---

**MiguFU — Universidade Federal de Uberlândia (UFU)**
