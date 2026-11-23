import { Pool } from 'pg';
import { aplicarMigrations, reverterUltimaMigration } from './Migrador';

async function executar(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Defina DATABASE_URL para executar as migrations.');

  const pool = new Pool({ connectionString });
  try {
    if (process.argv[2] === 'down') {
      const nome = await reverterUltimaMigration(pool);
      console.log(nome ? `Migration revertida: ${nome}` : 'Nenhuma migration para reverter.');
      return;
    }
    const aplicadas = await aplicarMigrations(pool);
    console.log(aplicadas.length ? `Migrations aplicadas: ${aplicadas.join(', ')}` : 'Schema já atualizado.');
  } finally {
    await pool.end();
  }
}

executar().catch((erro) => {
  console.error('Falha nas migrations:', erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
