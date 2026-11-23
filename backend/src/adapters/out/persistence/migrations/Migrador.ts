import { Pool, PoolClient } from 'pg';
import { schemaInicial } from './001_schema_inicial';
import { Migration } from './Migration';

export const MIGRATIONS: readonly Migration[] = [schemaInicial];

/** Impede que duas instâncias da API apliquem migrations ao mesmo tempo. */
const CHAVE_DE_BLOQUEIO = 20261123;

async function emTransacao<T>(pool: Pool, trabalho: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('SELECT pg_advisory_xact_lock($1)', [CHAVE_DE_BLOQUEIO]);
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        versao INTEGER PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const resultado = await trabalho(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}

/** Aplica as migrations pendentes, em ordem, e devolve os nomes aplicados. */
export function aplicarMigrations(pool: Pool, migrations: readonly Migration[] = MIGRATIONS): Promise<string[]> {
  return emTransacao(pool, async (cliente) => {
    const { rows } = await cliente.query<{ versao: number }>('SELECT versao FROM schema_migrations');
    const aplicadas = new Set(rows.map((linha) => linha.versao));
    const pendentes = [...migrations].filter((m) => !aplicadas.has(m.versao)).sort((a, b) => a.versao - b.versao);

    for (const migration of pendentes) {
      await cliente.query(migration.up);
      await cliente.query('INSERT INTO schema_migrations (versao, nome) VALUES ($1, $2)', [
        migration.versao,
        migration.nome,
      ]);
    }
    return pendentes.map((m) => m.nome);
  });
}

/** Desfaz a última migration aplicada e devolve o nome dela. */
export function reverterUltimaMigration(
  pool: Pool,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<string | null> {
  return emTransacao(pool, async (cliente) => {
    const { rows } = await cliente.query<{ versao: number }>(
      'SELECT versao FROM schema_migrations ORDER BY versao DESC LIMIT 1',
    );
    if (!rows[0]) return null;
    const migration = migrations.find((m) => m.versao === rows[0].versao);
    if (!migration) throw new Error(`Migration ${rows[0].versao} não encontrada no código.`);
    await cliente.query(migration.down);
    await cliente.query('DELETE FROM schema_migrations WHERE versao = $1', [migration.versao]);
    return migration.nome;
  });
}
