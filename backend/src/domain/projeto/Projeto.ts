import { ErroConflito, ErroValidacao } from '../erros';

/** Ciclo de vida do projeto (seção 7 dos requisitos). */
export const StatusProjeto = {
  ABERTO: 'ABERTO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
} as const;

export type StatusProjeto = (typeof StatusProjeto)[keyof typeof StatusProjeto];

/** Transições permitidas do ciclo de vida, no formato [de, para]. */
export const TRANSICOES_PROJETO: readonly (readonly [StatusProjeto, StatusProjeto])[] = [
  [StatusProjeto.ABERTO, StatusProjeto.EM_ANDAMENTO],
  [StatusProjeto.EM_ANDAMENTO, StatusProjeto.CONCLUIDO],
  [StatusProjeto.ABERTO, StatusProjeto.CANCELADO],
];

export function transicaoPermitida(de: StatusProjeto, para: StatusProjeto): boolean {
  return TRANSICOES_PROJETO.some(([origem, destino]) => origem === de && destino === para);
}

export interface DadosProjeto {
  id: string;
  clienteId: string;
  titulo: string;
  descricao: string;
  orcamento: number;
  /** Data no formato AAAA-MM-DD, ou null quando o cliente não informou. */
  prazoDesejado: string | null;
  habilidades: string[];
  status: StatusProjeto;
  criadoEm: Date;
}

export interface NovoProjeto {
  id: string;
  clienteId: string;
  titulo: unknown;
  descricao: unknown;
  orcamento: unknown;
  prazoDesejado?: unknown;
  habilidades?: unknown;
}

const TAMANHO_MAXIMO_TITULO = 160;
const TAMANHO_MAXIMO_DESCRICAO = 5000;
/** Limite da coluna NUMERIC(12, 2). */
const ORCAMENTO_MAXIMO = 9_999_999_999.99;
const QUANTIDADE_MAXIMA_HABILIDADES = 20;
const TAMANHO_MAXIMO_HABILIDADE = 50;
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

function textoObrigatorio(valor: unknown, campo: string, tamanhoMaximo: number): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErroValidacao(`${campo} é obrigatório.`);
  }
  const texto = valor.trim();
  if (texto.length > tamanhoMaximo) {
    throw new ErroValidacao(`${campo} deve ter no máximo ${tamanhoMaximo} caracteres.`);
  }
  return texto;
}

function validarOrcamento(orcamento: unknown): number {
  if (typeof orcamento !== 'number' || !Number.isFinite(orcamento) || orcamento <= 0) {
    throw new ErroValidacao('O orçamento é obrigatório e deve ser um número maior que zero.');
  }
  const arredondado = Math.round(orcamento * 100) / 100;
  if (arredondado <= 0 || arredondado > ORCAMENTO_MAXIMO) {
    throw new ErroValidacao('O orçamento deve ser maior que zero e menor que 10 bilhões.');
  }
  return arredondado;
}

function validarPrazo(prazo: unknown): string | null {
  if (prazo === undefined || prazo === null || prazo === '') return null;
  const partes = typeof prazo === 'string' ? FORMATO_DATA.exec(prazo) : null;
  if (partes) {
    const [ano, mes, dia] = partes.slice(1).map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia) {
      return prazo as string;
    }
  }
  throw new ErroValidacao('O prazo desejado deve ser uma data válida no formato AAAA-MM-DD.');
}

function validarHabilidades(habilidades: unknown): string[] {
  if (habilidades === undefined || habilidades === null) return [];
  if (!Array.isArray(habilidades) || habilidades.some((h) => typeof h !== 'string')) {
    throw new ErroValidacao('As habilidades devem ser uma lista de textos.');
  }
  const unicas = new Map<string, string>();
  for (const habilidade of habilidades as string[]) {
    const texto = habilidade.trim();
    if (texto === '') continue;
    if (texto.length > TAMANHO_MAXIMO_HABILIDADE) {
      throw new ErroValidacao(`Cada habilidade deve ter no máximo ${TAMANHO_MAXIMO_HABILIDADE} caracteres.`);
    }
    if (!unicas.has(texto.toLowerCase())) unicas.set(texto.toLowerCase(), texto);
  }
  if (unicas.size > QUANTIDADE_MAXIMA_HABILIDADES) {
    throw new ErroValidacao(`Informe no máximo ${QUANTIDADE_MAXIMA_HABILIDADES} habilidades.`);
  }
  return [...unicas.values()];
}

/**
 * Projeto publicado por um cliente (RF02).
 * Ciclo de vida: ABERTO -> EM_ANDAMENTO -> CONCLUIDO, ou ABERTO -> CANCELADO.
 */
export class Projeto {
  private constructor(private dados: DadosProjeto) {}

  /** Cria um novo projeto, sempre com status ABERTO. */
  static criar(novo: NovoProjeto, agora: Date = new Date()): Projeto {
    return new Projeto({
      id: novo.id,
      clienteId: novo.clienteId,
      titulo: textoObrigatorio(novo.titulo, 'O título', TAMANHO_MAXIMO_TITULO),
      descricao: textoObrigatorio(novo.descricao, 'A descrição', TAMANHO_MAXIMO_DESCRICAO),
      orcamento: validarOrcamento(novo.orcamento),
      prazoDesejado: validarPrazo(novo.prazoDesejado),
      habilidades: validarHabilidades(novo.habilidades),
      status: StatusProjeto.ABERTO,
      criadoEm: agora,
    });
  }

  /** Reconstrói um projeto já persistido, sem aplicar as regras de criação. */
  static restaurar(dados: DadosProjeto): Projeto {
    return new Projeto({ ...dados, habilidades: [...dados.habilidades] });
  }

  get id(): string {
    return this.dados.id;
  }

  get clienteId(): string {
    return this.dados.clienteId;
  }

  get titulo(): string {
    return this.dados.titulo;
  }

  get orcamento(): number {
    return this.dados.orcamento;
  }

  get habilidades(): readonly string[] {
    return this.dados.habilidades;
  }

  get status(): StatusProjeto {
    return this.dados.status;
  }

  get criadoEm(): Date {
    return this.dados.criadoEm;
  }

  pertenceA(clienteId: string): boolean {
    return this.dados.clienteId === clienteId;
  }

  /** ABERTO -> EM_ANDAMENTO, quando uma proposta é aceita (RF05). */
  iniciar(): void {
    this.transicionar(StatusProjeto.EM_ANDAMENTO);
  }

  /** EM_ANDAMENTO -> CONCLUIDO, quando o pagamento é liberado (RF06). */
  concluir(): void {
    this.transicionar(StatusProjeto.CONCLUIDO);
  }

  /** ABERTO -> CANCELADO (RF02, RN07). */
  cancelar(): void {
    this.transicionar(StatusProjeto.CANCELADO);
  }

  paraDados(): DadosProjeto {
    return { ...this.dados, habilidades: [...this.dados.habilidades] };
  }

  private transicionar(para: StatusProjeto): void {
    if (!transicaoPermitida(this.dados.status, para)) {
      throw new ErroConflito(
        `O projeto está com status ${this.dados.status} e não pode passar para ${para}.`,
      );
    }
    this.dados.status = para;
  }
}
