import { describe, expect, it } from 'vitest';
import { ConsoleNotificationAdapter } from '../../src/adapters/out/notification/ConsoleNotificationAdapter';

describe('ConsoleNotificationAdapter', () => {
  it('registra destinatário, assunto e corpo da notificação', async () => {
    const registros: string[] = [];
    const adaptador = new ConsoleNotificationAdapter((texto) => registros.push(texto));

    await adaptador.notificar({
      tipo: 'NOVA_PROPOSTA',
      destinatarioId: 'cliente-1',
      projeto: { id: 'projeto-1', titulo: 'Landing page' },
      detalhes: { valor: 1500, prazoDias: 10 },
    });

    expect(registros).toHaveLength(1);
    expect(registros[0]).toContain('Para: usuario:cliente-1');
    expect(registros[0]).toContain('Assunto: Nova proposta recebida para "Landing page"');
    expect(registros[0]).toContain('- valor: 1500');
  });
});
