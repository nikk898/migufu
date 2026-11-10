require('dotenv').config(); // sempre a primeira linha
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { limiteGeral } = require('./middlewares/limites');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL não definido no .env (obrigatório em produção)');
}

const app = express();

// Descomente se o servidor for publicado atrás de um proxy (Render, Railway, Nginx...).
// Sem isso, o limite de tentativas enxerga o IP do proxy e bloqueia todo mundo junto.
// app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true
}));
app.use(express.json({ limit: '100kb' }));

// No Express 5, req.body fica undefined quando a requisição não tem corpo.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

app.use('/api', limiteGeral);

app.get('/api/saude', (req, res) => res.json({ ok: true }));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/senha', require('./routes/senha'));
app.use('/api/cadastro', require('./routes/cadastro'));
app.use('/api/painel', require('./routes/painel'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/suporte', require('./routes/suporte'));
app.use('/api/admin', require('./routes/admin'));

// Descomente quando esses arquivos exportarem um router (module.exports = router):
// app.use('/api/formulario', require('./routes/formulario'));
// app.use('/api/associar', require('./routes/associar'));

// Sempre por último: rota não encontrada e tratador central de erros.
app.use(naoEncontrado);
app.use(tratarErros);

const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log(`Servidor rodando na porta ${porta}`));