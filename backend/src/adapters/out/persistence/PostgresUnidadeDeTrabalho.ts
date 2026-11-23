import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { UnidadeDeTrabalho } from '../../../application/ports/UnidadeDeTrabalho';
import { Consultavel } from './Consultavel';

/**
 * Executa o trabalho em uma transação do PostgreSQL. Os repositórios recebem `conexao`,
 * que usa o cliente da transação corrente ou, fora de uma transação, o pool.
 */
export class PostgresUnidadeDeTrabalho implements UnidadeDeTrabalho {
  private readonly transacao = new AsyncLocalStorage<PoolClient>();

  readonly conexao: Consultavel = {
    query: <R extends QueryResultRow = QueryResultRow>(texto: string, valores?: unknown[]) => {
      const alvo: Consultavel = this.transacao.getStore() ?? this.pool;
      return alvo.query<R>(texto, valores);
    },
  };

  constructor(private readonly pool: Pool) {}

  async executar<T>(trabalho: () => Promise<T>): Promise<T> {
    if (this.transacao.getStore()) return trabalho();

    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const resultado = await this.transacao.run(cliente, trabalho);
      await cliente.query('COMMIT');
      return resultado;
    } catch (erro) {
      await cliente.query('ROLLBACK');
      throw erro;
    } finally {
      cliente.release();
    }
  }
}
