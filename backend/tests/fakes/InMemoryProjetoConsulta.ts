import { ProjetoConsulta, ProjetoResumo } from '../../src/application/ports/ProjetoConsulta';

export class InMemoryProjetoConsulta implements ProjetoConsulta {
  private readonly projetos = new Map<string, ProjetoResumo>();

  adicionar(projeto: ProjetoResumo): void {
    this.projetos.set(projeto.id, projeto);
  }

  async buscarResumo(projetoId: string): Promise<ProjetoResumo | null> {
    return this.projetos.get(projetoId) ?? null;
  }
}
