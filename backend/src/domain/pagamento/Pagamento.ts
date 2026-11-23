import { ErroConflito, ErroValidacao } from '../erros';

export type StatusPagamento = 'PENDENTE' | 'RETIDO' | 'LIBERADO';

export interface DadosPagamento {
  id: string;
  contratoId: string;
  valor: number;
  status: StatusPagamento;
  transacaoId: string | null;
  atualizadoEm: Date;
}

export class Pagamento {
  private constructor(private dados: DadosPagamento) {}

  static criar(
    dados: Pick<DadosPagamento, 'id' | 'contratoId' | 'valor'>,
    agora: Date = new Date(),
  ): Pagamento {
    if (!Number.isFinite(dados.valor) || dados.valor <= 0) {
      throw new ErroValidacao('O valor do pagamento deve ser maior que zero.');
    }
    return new Pagamento({
      ...dados,
      status: 'PENDENTE',
      transacaoId: null,
      atualizadoEm: agora,
    });
  }

  static restaurar(dados: DadosPagamento): Pagamento {
    return new Pagamento({ ...dados });
  }

  get id(): string {
    return this.dados.id;
  }

  get contratoId(): string {
    return this.dados.contratoId;
  }

  get valor(): number {
    return this.dados.valor;
  }

  get status(): StatusPagamento {
    return this.dados.status;
  }

  get transacaoId(): string | null {
    return this.dados.transacaoId;
  }

  reter(transacaoId: string, agora: Date = new Date()): void {
    if (this.dados.status !== 'PENDENTE') {
      throw new ErroConflito('Somente um pagamento pendente pode ser retido.');
    }
    if (transacaoId.trim() === '') {
      throw new ErroValidacao('O identificador da transação é obrigatório.');
    }
    this.dados.status = 'RETIDO';
    this.dados.transacaoId = transacaoId;
    this.dados.atualizadoEm = agora;
  }

  liberar(agora: Date = new Date()): void {
    if (this.dados.status !== 'RETIDO' || !this.dados.transacaoId) {
      throw new ErroConflito('O pagamento precisa estar retido para ser liberado.');
    }
    this.dados.status = 'LIBERADO';
    this.dados.atualizadoEm = agora;
  }

  paraDados(): DadosPagamento {
    return { ...this.dados };
  }
}
