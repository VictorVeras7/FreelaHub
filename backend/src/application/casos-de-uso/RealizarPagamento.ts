import { ContratoRepository } from '../ports/ContratoRepository';
import { PagamentoRepository } from '../ports/PagamentoRepository';
import { PaymentGateway } from '../ports/PaymentGateway';
import { UnidadeDeTrabalho } from '../ports/UnidadeDeTrabalho';
import { ErroConflito, ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { Pagamento } from '../../domain/pagamento/Pagamento';

export interface DependenciasRealizarPagamento {
  contratos: ContratoRepository;
  pagamentos: PagamentoRepository;
  gateway: PaymentGateway;
  unidadeDeTrabalho: UnidadeDeTrabalho;
  gerarId: () => string;
}

/** Cobra o cliente e mantém o valor retido até a confirmação da entrega. */
export class RealizarPagamento {
  constructor(private readonly deps: DependenciasRealizarPagamento) {}

  executar(contratoId: string, usuarioId: string): Promise<Pagamento> {
    return this.deps.unidadeDeTrabalho.executar(async () => {
      const contrato = await this.deps.contratos.buscarPorId(contratoId);
      if (!contrato) throw new ErroNaoEncontrado('Contrato não encontrado.');
      if (contrato.clienteId !== usuarioId) {
        throw new ErroSemPermissao('Somente o cliente do contrato pode realizar o pagamento.');
      }
      if (contrato.status !== 'ATIVO') throw new ErroConflito('O contrato não está ativo.');

      let pagamento = await this.deps.pagamentos.buscarPorContrato(contratoId);
      if (pagamento && pagamento.status !== 'PENDENTE') {
        throw new ErroConflito('O pagamento deste contrato já foi realizado.');
      }
      if (!pagamento) {
        pagamento = Pagamento.criar({
          id: this.deps.gerarId(),
          contratoId,
          valor: contrato.valor,
        });
        await this.deps.pagamentos.salvar(pagamento);
      }

      const transacaoId = await this.deps.gateway.cobrar(pagamento.id, pagamento.valor);
      pagamento.reter(transacaoId);
      await this.deps.pagamentos.salvar(pagamento);
      return pagamento;
    });
  }
}
