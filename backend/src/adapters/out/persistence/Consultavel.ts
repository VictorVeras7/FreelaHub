import { QueryResult, QueryResultRow } from 'pg';

/**
 * Qualquer objeto capaz de executar SQL: o Pool ou um cliente dentro de uma transação.
 * Permite que a unidade de trabalho (ADR-005) reaproveite os mesmos repositórios.
 */
export interface Consultavel {
  query<R extends QueryResultRow = QueryResultRow>(texto: string, valores?: unknown[]): Promise<QueryResult<R>>;
}
