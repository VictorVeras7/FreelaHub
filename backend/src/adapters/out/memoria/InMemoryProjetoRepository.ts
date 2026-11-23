import { ProjetoConsulta, ProjetoResumo } from '../../../application/ports/ProjetoConsulta';
import { FiltrosProjetos, ProjetoRepository } from '../../../application/ports/ProjetoRepository';
import { DadosProjeto, Projeto, StatusProjeto } from '../../../domain/projeto/Projeto';

const maisRecentePrimeiro = (a: DadosProjeto, b: DadosProjeto) => b.criadoEm.getTime() - a.criadoEm.getTime();

/**
 * Repositório em memória para testes dos casos de uso, sem banco de dados (RNF07).
 * Implementa também a porta ProjetoConsulta usada pela fatia de propostas.
 */
export class InMemoryProjetoRepository implements ProjetoRepository, ProjetoConsulta {
  private readonly registros = new Map<string, DadosProjeto>();

  async salvar(projeto: Projeto): Promise<void> {
    this.registros.set(projeto.id, projeto.paraDados());
  }

  async buscarPorId(id: string): Promise<Projeto | null> {
    const dados = this.registros.get(id);
    return dados ? Projeto.restaurar(dados) : null;
  }

  async listarAbertos(filtros: FiltrosProjetos): Promise<Projeto[]> {
    const habilidade = filtros.habilidade?.toLowerCase();
    return [...this.registros.values()]
      .filter(
        (dados) =>
          dados.status === StatusProjeto.ABERTO &&
          (habilidade === undefined || dados.habilidades.some((h) => h.toLowerCase() === habilidade)) &&
          (filtros.orcamentoMin === undefined || dados.orcamento >= filtros.orcamentoMin) &&
          (filtros.orcamentoMax === undefined || dados.orcamento <= filtros.orcamentoMax),
      )
      .sort(maisRecentePrimeiro)
      .map((dados) => Projeto.restaurar(dados));
  }

  async listarPorCliente(clienteId: string): Promise<Projeto[]> {
    return [...this.registros.values()]
      .filter((dados) => dados.clienteId === clienteId)
      .sort(maisRecentePrimeiro)
      .map((dados) => Projeto.restaurar(dados));
  }

  async buscarResumo(projetoId: string): Promise<ProjetoResumo | null> {
    const dados = this.registros.get(projetoId);
    return dados ? { id: dados.id, clienteId: dados.clienteId, titulo: dados.titulo, status: dados.status } : null;
  }
}
