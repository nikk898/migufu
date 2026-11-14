-- ==========================================================================
-- Migração: armazenamento de certificados (PDF) dentro do banco
-- Rodar no SQL Editor do Supabase. Pode ser rodado mais de uma vez sem erro.
-- ==========================================================================

-- 1) Tabela com o PDF do certificado (um por voluntário; o reenvio substitui).
CREATE TABLE IF NOT EXISTS voluntario_certificado (
    voluntario_id INTEGER PRIMARY KEY
        REFERENCES voluntario(user_id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    tamanho_bytes INTEGER NOT NULL CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 3145728),
    conteudo BYTEA NOT NULL,
    enviado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
