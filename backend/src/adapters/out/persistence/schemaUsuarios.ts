/**
 * Tabela `usuarios` conforme a issue #31. Enquanto a migration inicial não existir,
 * este comando idempotente permite executar a fatia RF01. Remover quando a migration chegar.
 */
export const SCHEMA_USUARIOS = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('CLIENTE', 'FREELANCER', 'ADMINISTRADOR'))
  );
`;
