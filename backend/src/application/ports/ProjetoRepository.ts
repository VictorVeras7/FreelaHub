import { Projeto } from '../../domain/projeto/Projeto';

/** Filtros opcionais da listagem de projetos abertos (RF03). */
export interface FiltrosProjetos {
  /** Habilidade exigida pelo projeto, comparada sem diferenciar maiúsculas de minúsculas. */
  habilidade?: string;
  orcamentoMin?: number;
  orcamentoMax?: number;
}

/** Porta de saída para persistência de projetos (ADR-001, ADR-005). */
export interface ProjetoRepository {
  /** Insere o projeto ou atualiza o status de um projeto existente. */
  salvar(projeto: Projeto): Promise<void>;
  buscarPorId(id: string): Promise<Projeto | null>;
  /** Somente projetos com status ABERTO, do mais recente para o mais antigo. */
  listarAbertos(filtros: FiltrosProjetos): Promise<Projeto[]>;
  /** Todos os projetos de um cliente, em qualquer status, do mais recente para o mais antigo. */
  listarPorCliente(clienteId: string): Promise<Projeto[]>;
}
