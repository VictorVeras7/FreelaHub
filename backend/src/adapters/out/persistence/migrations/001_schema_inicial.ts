import { Migration } from './Migration';

/** Schema relacional do FreelaHub (ADR-005), com os status da seção 7 dos requisitos. */
export const schemaInicial: Migration = {
  versao: 1,
  nome: 'schema_inicial',
  up: `
    CREATE TABLE IF NOT EXISTS usuarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('CLIENTE', 'FREELANCER', 'ADMINISTRADOR'))
    );

    CREATE TABLE projetos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id UUID NOT NULL REFERENCES usuarios (id),
      titulo VARCHAR(160) NOT NULL,
      descricao TEXT NOT NULL,
      orcamento NUMERIC(12, 2) NOT NULL CHECK (orcamento > 0),
      prazo_desejado DATE,
      habilidades TEXT[] NOT NULL DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'ABERTO'
        CHECK (status IN ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_projetos_cliente ON projetos (cliente_id);
    CREATE INDEX idx_projetos_status ON projetos (status);

    CREATE TABLE propostas (
      id UUID PRIMARY KEY,
      projeto_id UUID NOT NULL REFERENCES projetos (id),
      freelancer_id UUID NOT NULL REFERENCES usuarios (id),
      valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
      prazo_dias INTEGER NOT NULL CHECK (prazo_dias > 0),
      mensagem TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
        CHECK (status IN ('PENDENTE', 'ACEITA', 'RECUSADA')),
      criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_proposta_freelancer_projeto UNIQUE (projeto_id, freelancer_id)
    );
    CREATE INDEX idx_propostas_freelancer ON propostas (freelancer_id);
    CREATE UNIQUE INDEX uq_proposta_aceita_por_projeto ON propostas (projeto_id) WHERE status = 'ACEITA';

    CREATE TABLE contratos (
      id UUID PRIMARY KEY,
      projeto_id UUID NOT NULL UNIQUE REFERENCES projetos (id),
      proposta_id UUID NOT NULL UNIQUE REFERENCES propostas (id),
      cliente_id UUID NOT NULL REFERENCES usuarios (id),
      freelancer_id UUID NOT NULL REFERENCES usuarios (id),
      valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
      prazo_dias INTEGER NOT NULL CHECK (prazo_dias > 0),
      status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'CONCLUIDO')),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_contratos_cliente ON contratos (cliente_id);
    CREATE INDEX idx_contratos_freelancer ON contratos (freelancer_id);

    CREATE TABLE pagamentos (
      id UUID PRIMARY KEY,
      contrato_id UUID NOT NULL UNIQUE REFERENCES contratos (id),
      valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
      status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
        CHECK (status IN ('PENDENTE', 'RETIDO', 'LIBERADO')),
      transacao_id VARCHAR(120),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  down: `
    DROP TABLE IF EXISTS pagamentos;
    DROP TABLE IF EXISTS contratos;
    DROP TABLE IF EXISTS propostas;
    DROP TABLE IF EXISTS projetos;
    DROP TABLE IF EXISTS usuarios;
  `,
};
