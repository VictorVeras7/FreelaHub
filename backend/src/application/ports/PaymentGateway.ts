/** Porta de saída para cobrança e repasse do pagamento (ADR-006). */
export interface PaymentGateway {
  cobrar(pagamentoId: string, valor: number): Promise<string>;
  liberar(transacaoId: string, valor: number): Promise<void>;
}
