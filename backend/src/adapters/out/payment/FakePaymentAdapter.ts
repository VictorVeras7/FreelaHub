import { randomUUID } from 'node:crypto';
import { PaymentGateway } from '../../../application/ports/PaymentGateway';

/** Gateway síncrono simulado para execução local (ADR-006). */
export class FakePaymentAdapter implements PaymentGateway {
  constructor(private readonly gerarId: () => string = randomUUID) {}

  async cobrar(_pagamentoId: string, _valor: number): Promise<string> {
    return `sim-${this.gerarId()}`;
  }

  async liberar(_transacaoId: string, _valor: number): Promise<void> {}
}
