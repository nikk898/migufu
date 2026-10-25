const express = require('express');
const router = express.Router();
const InstituicaoService = require('../services/instituicao.service.js');

router.post("/", async (req, res) => {
  try {
    const instituicao = await InstituicaoService.createInstituicao(req.body);
    res.status(201).json(instituicao);
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
});

router.get("/", async (req, res) => {
  try {
    const instituicoes = await InstituicaoService.findAllInstituicao();
    res.json(instituicoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const instituicao = await InstituicaoService.findInstituicaoById(req.params.id);
    if (!instituicao) {
      return res.status(404).json({ error: "Instituição não encontrada" });
    }
    res.json(instituicao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const instituicao = await InstituicaoService.updateInstituicao(req.params.id, req.body);
    if (!instituicao) {
      return res.status(404).json({ error: "Instituição não encontrada" });
    }
    res.json(instituicao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const success = await InstituicaoService.removeInstituicao(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Instituição não encontrada" });
    }
    res.status(204).end();
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        error: "Não é possível excluir a instituição porque existem registros relacionados",
        suggestion: "Use PUT /:id com { ativa: false } para desativar em vez de excluir"
      });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
