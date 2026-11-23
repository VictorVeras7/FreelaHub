import { ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { Pagamento } from '../../domain/pagamento/Pagamento';
import { ContratoRepository } from '../ports/ContratoRepository';
import { PagamentoRepository } from '../ports/PagamentoRepository';

/** Consulta o pagamento somente para os participantes do contrato. */
export class ConsultarPagamento {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly pagamentos: PagamentoRepository,
  ) {}

  async executar(contratoId: string, usuarioId: string): Promise<Pagamento> {
    const contrato = await this.contratos.buscarPorId(contratoId);
    if (!contrato) throw new ErroNaoEncontrado('Contrato não encontrado.');
    if (contrato.clienteId !== usuarioId && contrato.freelancerId !== usuarioId) {
      throw new ErroSemPermissao('Você não participa deste contrato.');
    }
    const pagamento = await this.pagamentos.buscarPorContrato(contratoId);
    if (!pagamento) throw new ErroNaoEncontrado('Pagamento não encontrado.');
    return pagamento;
  }
}
