import { ErroValidacao, ErroConflito } from '../erros';

export type StatusProposta = 'PENDENTE' | 'ACEITA' | 'RECUSADA';

export interface DadosProposta {
  id: string;
  projetoId: string;
  freelancerId: string;
  valor: number;
  prazoDias: number;
  mensagem: string;
  status: StatusProposta;
  criadaEm: Date;
}

export interface NovaProposta {
  id: string;
  projetoId: string;
  freelancerId: string;
  valor: unknown;
  prazoDias: unknown;
  mensagem: unknown;
}

const TAMANHO_MAXIMO_MENSAGEM = 2000;

/**
 * Proposta enviada por um freelancer para um projeto (RF04).
 * Ciclo de vida: PENDENTE -> ACEITA ou RECUSADA.
 */
export class Proposta {
  private constructor(private dados: DadosProposta) {}

  /** Cria uma nova proposta, sempre com status PENDENTE. */
  static criar(nova: NovaProposta, agora: Date = new Date()): Proposta {
    const { valor, prazoDias, mensagem } = nova;

    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
      throw new ErroValidacao('O valor da proposta deve ser um número maior que zero.');
    }
    if (typeof prazoDias !== 'number' || !Number.isInteger(prazoDias) || prazoDias <= 0) {
      throw new ErroValidacao('O prazo de entrega deve ser um número inteiro de dias maior que zero.');
    }
    if (typeof mensagem !== 'string' || mensagem.trim() === '') {
      throw new ErroValidacao('A mensagem de apresentação é obrigatória.');
    }
    if (mensagem.length > TAMANHO_MAXIMO_MENSAGEM) {
      throw new ErroValidacao(
        `A mensagem de apresentação deve ter no máximo ${TAMANHO_MAXIMO_MENSAGEM} caracteres.`,
      );
    }

    return new Proposta({
      id: nova.id,
      projetoId: nova.projetoId,
      freelancerId: nova.freelancerId,
      valor: Math.round(valor * 100) / 100,
      prazoDias,
      mensagem: mensagem.trim(),
      status: 'PENDENTE',
      criadaEm: agora,
    });
  }

  /** Reconstrói uma proposta já persistida, sem aplicar as regras de criação. */
  static restaurar(dados: DadosProposta): Proposta {
    return new Proposta({ ...dados });
  }

  get id(): string {
    return this.dados.id;
  }

  get projetoId(): string {
    return this.dados.projetoId;
  }

  get freelancerId(): string {
    return this.dados.freelancerId;
  }

  get valor(): number {
    return this.dados.valor;
  }

  get prazoDias(): number {
    return this.dados.prazoDias;
  }

  get status(): StatusProposta {
    return this.dados.status;
  }

  /** Usado pelo caso de uso AceitarProposta (RF05). */
  aceitar(): void {
    this.garantirPendente();
    this.dados.status = 'ACEITA';
  }

  /** Usado pelos casos de uso AceitarProposta (RF05) e CancelarProjeto (RF02). */
  recusar(): void {
    this.garantirPendente();
    this.dados.status = 'RECUSADA';
  }

  paraDados(): DadosProposta {
    return { ...this.dados };
  }

  private garantirPendente(): void {
    if (this.dados.status !== 'PENDENTE') {
      throw new ErroConflito(
        `A proposta já está com status ${this.dados.status} e não pode mudar de status.`,
      );
    }
  }
}
