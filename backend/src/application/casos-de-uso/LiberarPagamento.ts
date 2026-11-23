import { Contrato } from '../../domain/contrato/Contrato';
import { ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { Pagamento } from '../../domain/pagamento/Pagamento';
import { ProjetoRepository } from '../ports/ProjetoRepository';
import { ContratoRepository } from '../ports/ContratoRepository';
import { PagamentoRepository } from '../ports/PagamentoRepository';
import { PaymentGateway } from '../ports/PaymentGateway';
import { UnidadeDeTrabalho } from '../ports/UnidadeDeTrabalho';

export interface DependenciasLiberarPagamento {
  contratos: ContratoRepository;
  pagamentos: PagamentoRepository;
  projetos: ProjetoRepository;
  gateway: PaymentGateway;
  unidadeDeTrabalho: UnidadeDeTrabalho;
}

/** Libera o valor retido e conclui contrato e projeto atomicamente. */
export class LiberarPagamento {
  constructor(private readonly deps: DependenciasLiberarPagamento) {}

  executar(contratoId: string, usuarioId: string): Promise<Pagamento> {
    return this.deps.unidadeDeTrabalho.executar(async () => {
      const contratoDetalhado = await this.deps.contratos.buscarPorId(contratoId);
      if (!contratoDetalhado) throw new ErroNaoEncontrado('Contrato não encontrado.');
      if (contratoDetalhado.clienteId !== usuarioId) {
        throw new ErroSemPermissao('Somente o cliente do contrato pode confirmar a entrega.');
      }

      const pagamento = await this.deps.pagamentos.buscarPorContrato(contratoId);
      if (!pagamento) throw new ErroNaoEncontrado('Pagamento não encontrado.');
      const projeto = await this.deps.projetos.buscarPorId(contratoDetalhado.projetoId);
      if (!projeto) throw new ErroNaoEncontrado('Projeto não encontrado.');

      const contrato = Contrato.restaurar(contratoDetalhado);
      contrato.concluir();
      projeto.concluir();
      pagamento.liberar();

      const transacaoId = pagamento.transacaoId;
      if (!transacaoId) throw new Error('Pagamento retido sem identificador de transação.');
      await this.deps.gateway.liberar(transacaoId, pagamento.valor);
      await this.deps.pagamentos.salvar(pagamento);
      await this.deps.contratos.salvar(contrato);
      await this.deps.projetos.salvar(projeto);
      return pagamento;
    });
  }
}
