/**
 * Porta de leitura dos dados de projeto de que a fatia de propostas precisa.
 * É deliberadamente estreita: a entidade Projeto e o ProjetoRepository completo
 * pertencem à fatia RF02/RF03, cujo adaptador pode passar a implementar esta porta.
 */
export type StatusProjeto = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface ProjetoResumo {
  id: string;
  clienteId: string;
  titulo: string;
  status: StatusProjeto;
}

export interface ProjetoConsulta {
  buscarResumo(projetoId: string): Promise<ProjetoResumo | null>;
}
