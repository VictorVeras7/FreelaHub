import { Contrato, DadosContrato } from '../../domain/contrato/Contrato';

/** Contrato com os nomes exibidos nas respostas da API. */
export interface ContratoDetalhado extends DadosContrato {
  projetoTitulo: string;
  clienteNome: string;
  freelancerNome: string;
}

/** Porta de saída para persistência de contratos (ADR-005). */
export interface ContratoRepository {
  /** Insere o contrato ou atualiza o status de um contrato existente. */
  salvar(contrato: Contrato): Promise<void>;
  buscarPorId(id: string): Promise<ContratoDetalhado | null>;
  /** Contratos em que o usuário é cliente ou freelancer, do mais recente para o mais antigo. */
  listarPorUsuario(usuarioId: string): Promise<ContratoDetalhado[]>;
}
