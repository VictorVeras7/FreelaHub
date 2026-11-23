import {
  Notificacao,
  NotificationService,
  TipoNotificacao,
} from '../../../application/ports/NotificationService';

export interface MensagemFormatada {
  destinatario: string;
  assunto: string;
  corpo: string;
}

type Registrador = (texto: string) => void;

const ASSUNTOS: Record<TipoNotificacao, (titulo: string) => string> = {
  NOVA_PROPOSTA: (titulo) => `Nova proposta recebida para "${titulo}"`,
  PROPOSTA_ACEITA: (titulo) => `Sua proposta para "${titulo}" foi aceita`,
  PROPOSTA_RECUSADA: (titulo) => `Sua proposta para "${titulo}" foi recusada`,
  PAGAMENTO_LIBERADO: (titulo) => `Pagamento liberado para "${titulo}"`,
};

const INTRODUCOES: Record<TipoNotificacao, string> = {
  NOVA_PROPOSTA: 'Um freelancer enviou uma proposta para o seu projeto.',
  PROPOSTA_ACEITA: 'O cliente aceitou a sua proposta e o contrato foi gerado.',
  PROPOSTA_RECUSADA: 'O cliente não seguiu com a sua proposta desta vez.',
  PAGAMENTO_LIBERADO: 'O cliente confirmou a entrega e o pagamento foi liberado para você.',
};

/**
 * Adaptador simulado da porta NotificationService (RF07, ADR-004).
 * Em vez de enviar e-mail, registra no console o destinatário, o assunto e o corpo.
 */
export class ConsoleNotificationAdapter implements NotificationService {
  constructor(private readonly registrar: Registrador = console.log) {}

  async notificar(notificacao: Notificacao): Promise<void> {
    const mensagem = ConsoleNotificationAdapter.formatar(notificacao);
    this.registrar(
      [
        '[notificação simulada]',
        `Para: ${mensagem.destinatario}`,
        `Assunto: ${mensagem.assunto}`,
        mensagem.corpo,
      ].join('\n'),
    );
  }

  static formatar(notificacao: Notificacao): MensagemFormatada {
    const linhasDetalhes = Object.entries(notificacao.detalhes ?? {}).map(
      ([chave, valor]) => `- ${chave}: ${valor}`,
    );

    return {
      destinatario: `usuario:${notificacao.destinatarioId}`,
      assunto: ASSUNTOS[notificacao.tipo](notificacao.projeto.titulo),
      corpo: [INTRODUCOES[notificacao.tipo], `Projeto: ${notificacao.projeto.titulo}`, ...linhasDetalhes].join(
        '\n',
      ),
    };
  }
}
