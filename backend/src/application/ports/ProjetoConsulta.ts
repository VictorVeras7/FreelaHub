import { StatusProjeto } from '../../domain/projeto/Projeto';

export type { StatusProjeto };

/**
 * Porta de leitura dos dados de projeto de que a fatia de propostas precisa.
 * É deliberadamente estreita: a entidade Projeto e o ProjetoRepository completo
 * pertencem à fatia RF02/RF03, e os repositórios de projetos também implementam esta porta.
 */

export interface ProjetoResumo {
  id: string;
  clienteId: string;
  titulo: string;
  status: StatusProjeto;
}

export interface ProjetoConsulta {
  buscarResumo(projetoId: string): Promise<ProjetoResumo | null>;
}
