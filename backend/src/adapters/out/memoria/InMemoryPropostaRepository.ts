import { PropostaRepository } from '../../../application/ports/PropostaRepository';
import { DadosProposta, Proposta } from '../../../domain/proposta/Proposta';

/** Repositório em memória para testes dos casos de uso, sem banco de dados (RNF07). */
export class InMemoryPropostaRepository implements PropostaRepository {
  private readonly registros = new Map<string, DadosProposta>();

  async salvar(proposta: Proposta): Promise<void> {
    this.registros.set(proposta.id, proposta.paraDados());
  }

  async buscarPorId(id: string): Promise<Proposta | null> {
    const dados = this.registros.get(id);
    return dados ? Proposta.restaurar(dados) : null;
  }

  async listarPorProjeto(projetoId: string): Promise<Proposta[]> {
    return [...this.registros.values()]
      .filter((dados) => dados.projetoId === projetoId)
      .sort((a, b) => a.criadaEm.getTime() - b.criadaEm.getTime())
      .map((dados) => Proposta.restaurar(dados));
  }

  async existeDoFreelancerNoProjeto(projetoId: string, freelancerId: string): Promise<boolean> {
    return [...this.registros.values()].some(
      (dados) => dados.projetoId === projetoId && dados.freelancerId === freelancerId,
    );
  }
}
