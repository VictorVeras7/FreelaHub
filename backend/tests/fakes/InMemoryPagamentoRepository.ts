import { PagamentoRepository } from '../../src/application/ports/PagamentoRepository';
import { DadosPagamento, Pagamento } from '../../src/domain/pagamento/Pagamento';

export class InMemoryPagamentoRepository implements PagamentoRepository {
  private readonly registros = new Map<string, DadosPagamento>();

  capturar(): () => void {
    const copia = new Map([...this.registros].map(([id, dados]) => [id, { ...dados }]));
    return () => {
      this.registros.clear();
      copia.forEach((dados, id) => this.registros.set(id, dados));
    };
  }

  async salvar(pagamento: Pagamento): Promise<void> {
    this.registros.set(pagamento.contratoId, pagamento.paraDados());
  }

  async buscarPorContrato(contratoId: string): Promise<Pagamento | null> {
    const dados = this.registros.get(contratoId);
    return dados ? Pagamento.restaurar(dados) : null;
  }
}
