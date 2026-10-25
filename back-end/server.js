const express = require('express');
const app = express();
const instituicaoRoutes = require('./controllers/instituicao.controller.js');

app.use(express.json());
app.use("/instituicao", instituicaoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
