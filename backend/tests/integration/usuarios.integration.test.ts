import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PostgresUsuarioRepository } from '../../src/adapters/out/persistence/PostgresUsuarioRepository';
import { aplicarMigrations } from '../../src/adapters/out/persistence/migrations/Migrador';
import { carregarAdministrador } from '../../src/adapters/out/persistence/seedAdministrador';
import { BcryptSenhaHasher } from '../../src/adapters/out/security/BcryptSenhaHasher';
import { ErroConflito } from '../../src/domain/erros';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';

const URL_BANCO = process.env.TEST_DATABASE_URL;
if (!URL_BANCO) {
  throw new Error('Defina TEST_DATABASE_URL para rodar os testes de integração.');
}

// Cada execução usa um schema próprio e descartável, sem tocar nos dados do ambiente.
const SCHEMA = `teste_rf01_${randomBytes(6).toString('hex')}`;
const admin = { email: 'admin@exemplo.com', senha: 'senha-do-admin' };
const novo = { nome: 'Ana', email: 'ana@exemplo.com', senhaHash: '$2b$04$hash', perfil: PerfilUsuario.CLIENTE };

describe('PostgresUsuarioRepository e carga inicial', () => {
  const hasher = new BcryptSenhaHasher(4);
  let controle: Pool;
  let pool: Pool;
  let repositorio: PostgresUsuarioRepository;

  beforeAll(async () => {
    controle = new Pool({ connectionString: URL_BANCO });
    await controle.query(`CREATE SCHEMA ${SCHEMA}`);
    pool = new Pool({ connectionString: URL_BANCO, options: `-c search_path=${SCHEMA}` });
    await aplicarMigrations(pool);
    repositorio = new PostgresUsuarioRepository(pool);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE usuarios');
  });

  afterAll(async () => {
    await pool?.end();
    await controle.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await controle.end();
  });

  it('inclui e busca por e-mail e por id', async () => {
    const criado = await repositorio.incluir(novo);
    expect((await repositorio.buscarPorEmail(novo.email))?.id).toBe(criado.id);
    expect((await repositorio.buscarPorId(criado.id))?.email).toBe(novo.email);
  });

  it('devolve null quando não encontra, inclusive para id que não é UUID', async () => {
    expect(await repositorio.buscarPorEmail('x@exemplo.com')).toBeNull();
    expect(await repositorio.buscarPorId('nao-e-uuid')).toBeNull();
  });

  it('a restrição do banco recusa e-mail repetido como conflito', async () => {
    await repositorio.incluir(novo);
    await expect(repositorio.incluir(novo)).rejects.toThrow(ErroConflito);
  });

  it('o banco recusa perfil fora da RN01', async () => {
    await expect(
      pool.query(`INSERT INTO usuarios (nome, email, senha, perfil) VALUES ('a', 'a@b.co', 'h', 'GERENTE')`),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('a carga é idempotente e grava apenas hash', async () => {
    await carregarAdministrador(pool, hasher, admin);
    await carregarAdministrador(pool, hasher, admin);
    const { rows } = await pool.query(`SELECT senha FROM usuarios WHERE perfil = 'ADMINISTRADOR'`);
    expect(rows).toHaveLength(1);
    expect(rows[0].senha).not.toBe(admin.senha);
    expect(await hasher.comparar(admin.senha, rows[0].senha)).toBe(true);
  });

  it('não promove usuário comum quando ADMIN_EMAIL já está em uso', async () => {
    await repositorio.incluir({ ...novo, email: admin.email });
    await expect(carregarAdministrador(pool, hasher, admin)).rejects.toThrow(/não é Administrador/);
    expect((await repositorio.buscarPorEmail(admin.email))?.perfil).toBe(PerfilUsuario.CLIENTE);
  });
});
