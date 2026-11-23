/**
 * Porta de saída para notificações (RF07, ADR-004).
 * Recebe apenas dados de negócio; o formato da mensagem (e-mail, console etc.)
 * é responsabilidade do adaptador.
 */
export type TipoNotificacao =
  | 'NOVA_PROPOSTA' // para o cliente dono do projeto
  | 'PROPOSTA_ACEITA' // para o freelancer
  | 'PROPOSTA_RECUSADA' // para o freelancer
  | 'PAGAMENTO_LIBERADO'; // para o freelancer

export interface Notificacao {
  tipo: TipoNotificacao;
  destinatarioId: string;
  projeto: { id: string; titulo: string };
  /** Informações complementares exibidas na mensagem, como valor e prazo. */
  detalhes?: Record<string, string | number>;
}

export interface NotificationService {
  notificar(notificacao: Notificacao): Promise<void>;
}
