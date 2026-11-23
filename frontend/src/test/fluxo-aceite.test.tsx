import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { api } from '@/api';
import { CLIENTE, FREELANCER, logarComo, renderizarEm } from './util';

describe('fluxo de aceite com o adaptador simulado', () => {
  it('aceita uma proposta, recusa as demais e conclui o pagamento', async () => {
    logarComo(FREELANCER);
    await api.propostas.enviar('p-1', { valor: 1300, prazoDias: 10, mensagem: 'Posso começar amanhã.' });

    logarComo(CLIENTE);
    renderizarEm('/projetos/p-1/propostas');
    await userEvent.click(await screen.findByRole('button', { name: 'Aceitar proposta de Rafael Lima' }));
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText(/demais propostas serão recusadas/)).toBeInTheDocument();
    await userEvent.click(within(modal).getByRole('button', { name: 'Aceitar e gerar contrato' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Realizar pagamento' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar entrega e liberar pagamento' }));
    const confirmacao = await screen.findByRole('dialog');
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Confirmar e liberar' }));
    expect(await screen.findByText(/Contrato concluído\. O pagamento/)).toBeInTheDocument();

    const propostas = await api.propostas.listarDoProjeto('p-1');
    expect(propostas.find((p) => p.freelancerId === FREELANCER.id)?.status).toBe('ACEITA');
    expect(propostas.find((p) => p.freelancerId !== FREELANCER.id)?.status).toBe('RECUSADA');
    expect((await api.projetos.buscar('p-1')).status).toBe('CONCLUIDO');
  }, 15000);
});
