/** Porta de saída para executar várias escritas de forma atômica (ADR-005). */
export interface UnidadeDeTrabalho {
  /** Confirma tudo se o trabalho terminar e desfaz tudo se ele lançar erro. */
  executar<T>(trabalho: () => Promise<T>): Promise<T>;
}
