import { Pagamento } from '../../domain/pagamento/Pagamento';

/** Porta de saída para persistência de pagamentos (ADR-006). */
export interface PagamentoRepository {
  salvar(pagamento: Pagamento): Promise<void>;
  buscarPorContrato(contratoId: string): Promise<Pagamento | null>;
}
