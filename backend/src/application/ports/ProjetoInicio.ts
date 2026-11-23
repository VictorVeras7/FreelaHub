/**
 * Porta estreita para a transição ABERTO -> EM_ANDAMENTO usada pelo aceite (RF05).
 * Quando o ProjetoRepository da fatia RF02/RF03 existir, ele pode implementá-la.
 */
export interface ProjetoInicio {
  /** Lança ErroConflito se o projeto não estiver mais ABERTO. */
  iniciar(projetoId: string): Promise<void>;
}
