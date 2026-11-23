import { Proposta } from '../../domain/proposta/Proposta';

/** Porta de saída para persistência de propostas (ADR-005). */
export interface PropostaRepository {
  /** Insere a proposta ou atualiza o status de uma proposta existente. */
  salvar(proposta: Proposta): Promise<void>;
  buscarPorId(id: string): Promise<Proposta | null>;
  /** Propostas de um projeto, da mais antiga para a mais recente. */
  listarPorProjeto(projetoId: string): Promise<Proposta[]>;
  /** Apoia a RN03: um freelancer envia no máximo uma proposta por projeto. */
  existeDoFreelancerNoProjeto(projetoId: string, freelancerId: string): Promise<boolean>;
}
