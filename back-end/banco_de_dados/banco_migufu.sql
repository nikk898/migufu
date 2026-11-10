CREATE TYPE tipo_user AS ENUM (
    'Mestre', 'Admin', 'Voluntario', 'Internacional'
);

CREATE TYPE tipo_vinculo AS ENUM (
    'Estudante', 'Funcionario'
);

CREATE TYPE status_aptidao AS ENUM (
    'Pendente', 'Apto', 'Nao Apto'
);

CREATE TYPE status_envio AS ENUM (
    'Enviado', 'Nao enviado'
);

CREATE TYPE tipo_idioma AS ENUM (
    'Portugues', 'Espanhol', 'Ingles', 'Mandarim',
    'Latim', 'Frances', 'Japones', 'Russo'
);

CREATE TYPE nivel_idioma AS ENUM (
    'Basico', 'Intermediario', 'Avancado', 'Fluente', 'Nativo'
);


CREATE TABLE instituicao (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(5) NOT NULL UNIQUE,
    cidade VARCHAR(30) NOT NULL,
    uf CHAR(2) NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE campus (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_instituicao INTEGER NOT NULL
        REFERENCES instituicao(id) ON DELETE RESTRICT,
    nome VARCHAR(100) NOT NULL,

    UNIQUE (id_instituicao, nome)
);

CREATE TABLE base_user (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_instituicao INTEGER
        REFERENCES instituicao(id) ON DELETE RESTRICT,
    nome_completo VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash TEXT,
    telefone VARCHAR(30),
    perfil tipo_user NOT NULL DEFAULT 'Voluntario',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE interesse (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE usuario_interesse (
    usuario_id INTEGER NOT NULL
        REFERENCES base_user(id) ON DELETE CASCADE,
    interesse_id INTEGER NOT NULL
        REFERENCES interesse(id) ON DELETE CASCADE,

    PRIMARY KEY (usuario_id, interesse_id)
);


CREATE TABLE voluntario (
    user_id INTEGER PRIMARY KEY
        REFERENCES base_user(id) ON DELETE CASCADE,
    cpf CHAR(11) NOT NULL UNIQUE
        CHECK (cpf ~ '^[0-9]{11}$'),
    vinculo tipo_vinculo NOT NULL DEFAULT 'Funcionario',
    curso VARCHAR(50),
    periodo SMALLINT CHECK (periodo > 0),
    campus_id INTEGER
        REFERENCES campus(id) ON DELETE RESTRICT,
    status_aptidao status_aptidao NOT NULL DEFAULT 'Pendente',
    certificado_url TEXT,
    data_envio_certificado TIMESTAMPTZ,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    sobre_mim TEXT,
    expectativas_do_curso TEXT,
    observacao TEXT,
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE mensagem_suporte (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL
        REFERENCES base_user(id) ON DELETE RESTRICT,
    assunto VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    status_env status_envio NOT NULL DEFAULT 'Enviado',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE usuario_idioma (
    usuario_id INTEGER NOT NULL
        REFERENCES base_user(id) ON DELETE CASCADE,
    idioma tipo_idioma NOT NULL DEFAULT 'Portugues',
    nivel nivel_idioma NOT NULL DEFAULT 'Basico',

    PRIMARY KEY (usuario_id, idioma)
);


CREATE TABLE token_recuperar_senha (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL
        REFERENCES base_user(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    usado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (expira_em > criado_em)
);


CREATE TABLE estudante_internacional (
    usuario_id INTEGER PRIMARY KEY
        REFERENCES base_user(id) ON DELETE CASCADE,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    cpf CHAR(11) NOT NULL UNIQUE
        CHECK (cpf ~ '^[0-9]{11}$'),
    pais_origem VARCHAR(100) NOT NULL DEFAULT 'Angola',
    curso VARCHAR(100) NOT NULL,
    campus_id INTEGER NOT NULL
        REFERENCES campus(id) ON DELETE RESTRICT,
    idioma_site tipo_idioma NOT NULL DEFAULT 'Portugues',
    data_chegada DATE,
    termo_aceito BOOLEAN NOT NULL DEFAULT FALSE,
    termo_aceito_em TIMESTAMPTZ,
    expectativas_do_curso TEXT,
    observacao TEXT,
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (termo_aceito = FALSE AND termo_aceito_em IS NULL)
        OR
        (termo_aceito = TRUE AND termo_aceito_em IS NOT NULL)
    )
);



CREATE TABLE vinculo_migufu (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    voluntario_id INTEGER NOT NULL
        REFERENCES voluntario(user_id) ON DELETE RESTRICT,
    estudante_internacional_id INTEGER NOT NULL
        REFERENCES estudante_internacional(usuario_id) ON DELETE RESTRICT,
    admin_id INTEGER NOT NULL
        REFERENCES base_user(id) ON DELETE RESTRICT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMPTZ,
    motivo_saida TEXT,

    CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    CHECK (ativo OR data_fim IS NOT NULL)
);


CREATE INDEX idx_campus_instituicao
    ON campus(id_instituicao);

CREATE INDEX idx_base_user_instituicao
    ON base_user(id_instituicao);

CREATE INDEX idx_voluntario_campus
    ON voluntario(campus_id);

CREATE INDEX idx_mensagem_usuario
    ON mensagem_suporte(usuario_id);

CREATE INDEX idx_token_usuario
    ON token_recuperar_senha(usuario_id);

CREATE INDEX idx_estudante_campus
    ON estudante_internacional(campus_id);

CREATE INDEX idx_vinculo_voluntario
    ON vinculo_migufu(voluntario_id);

CREATE INDEX idx_vinculo_estudante
    ON vinculo_migufu(estudante_internacional_id);

CREATE INDEX idx_vinculo_admin
    ON vinculo_migufu(admin_id);

CREATE UNIQUE INDEX uq_vinculo_ativo
    ON vinculo_migufu(voluntario_id, estudante_internacional_id)
    WHERE ativo = TRUE;


-- RODAR NO BANCO DE DADOS PARA ADICIONAR CAMPOS QUE O FRONT PUXA

ALTER TABLE base_user ADD COLUMN genero VARCHAR(30);

ALTER TABLE estudante_internacional ADD COLUMN sobre_mim TEXT;
ALTER TABLE estudante_internacional ADD COLUMN passaporte VARCHAR(20) UNIQUE;
ALTER TABLE estudante_internacional ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE estudante_internacional
    ADD CONSTRAINT chk_estudante_documento
    CHECK (cpf IS NOT NULL OR passaporte IS NOT NULL);

-- idiomas que existem no select do front mas não no enum
ALTER TYPE tipo_idioma ADD VALUE IF NOT EXISTS 'Alemao';
ALTER TYPE tipo_idioma ADD VALUE IF NOT EXISTS 'Italiano';
ALTER TYPE tipo_idioma ADD VALUE IF NOT EXISTS 'Libras';

-- colunas que o tutorial usa em admin-suporte (o .sql que você mandou não tinha)
ALTER TABLE mensagem_suporte
  ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolvido_por INTEGER REFERENCES base_user(id);

-- periodo do estudante internacional (o formulário de cadastro e o perfil já enviam esse campo)
ALTER TABLE estudante_internacional
  ADD COLUMN IF NOT EXISTS periodo SMALLINT CHECK (periodo > 0);