import { ErroConflito } from '../erros';
import { Proposta } from '../proposta/Proposta';

export type StatusContrato = 'ATIVO' | 'CONCLUIDO';

export interface DadosContrato {
  id: string;
  projetoId: string;
  propostaId: string;
  clienteId: string;
  freelancerId: string;
  valor: number;
  prazoDias: number;
  status: StatusContrato;
  criadoEm: Date;
}

/** Dados do projeto necessários para gerar o contrato. */
export interface ProjetoDoContrato {
  id: string;
  clienteId: string;
}

export class ContratoJaConcluidoError extends ErroConflito {
  constructor() {
    super('O contrato já está concluído.');
  }
}

/**
 * Contrato entre cliente e freelancer (RF05).
 * Ciclo de vida: ATIVO -> CONCLUIDO.
 */
export class Contrato {
  private constructor(private dados: DadosContrato) {}

  /** Gera o contrato a partir da proposta aceita, copiando valor e prazo (RN05). */
  static gerar(id: string, proposta: Proposta, projeto: ProjetoDoContrato, agora: Date = new Date()): Contrato {
    if (proposta.status !== 'ACEITA') {
      throw new ErroConflito('O contrato só pode ser gerado a partir de uma proposta aceita.');
    }
    if (proposta.projetoId !== projeto.id) {
      throw new ErroConflito('A proposta não pertence a este projeto.');
    }
    return new Contrato({
      id,
      projetoId: projeto.id,
      propostaId: proposta.id,
      clienteId: projeto.clienteId,
      freelancerId: proposta.freelancerId,
      valor: proposta.valor,
      prazoDias: proposta.prazoDias,
      status: 'ATIVO',
      criadoEm: agora,
    });
  }

  /** Reconstrói um contrato já persistido. */
  static restaurar(dados: DadosContrato): Contrato {
    return new Contrato({ ...dados });
  }

  get id(): string {
    return this.dados.id;
  }

  get status(): StatusContrato {
    return this.dados.status;
  }

  /** Usado pelo caso de uso LiberarPagamento (RF06). */
  concluir(): void {
    if (this.dados.status !== 'ATIVO') throw new ContratoJaConcluidoError();
    this.dados.status = 'CONCLUIDO';
  }

  paraDados(): DadosContrato {
    return { ...this.dados };
  }
}
