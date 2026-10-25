const express = require("express");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "./src/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const app = express();
app.use(express.json());

//INSERT
app.post('/test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('instituicao')
      .insert({
        id: 15,
        nome: 'UFUDEU',
        sigla: 'UFUDEUU',
        cidade: 'Uaiberlândia',
        uf: 'MG',
        status: 'ativa',
        criado_em: '2026-05-23',
        atualizado_em:'2026-10-11'
      });

    if (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3333;
app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));

// Conexão com o banco funciona
