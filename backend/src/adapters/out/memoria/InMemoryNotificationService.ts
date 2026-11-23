import { Notificacao, NotificationService } from '../../../application/ports/NotificationService';

/**
 * Adaptador de notificação em memória (ADR-004). Guarda as notificações enviadas
 * para que os testes dos casos de uso possam verificá-las.
 */
export class InMemoryNotificationService implements NotificationService {
  readonly enviadas: Notificacao[] = [];

  async notificar(notificacao: Notificacao): Promise<void> {
    this.enviadas.push(notificacao);
  }
}
