import { describe, expect, it } from 'vitest';
import { InMemoryNotificationService } from '../../src/adapters/out/memoria/InMemoryNotificationService';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { EnviarProposta } from '../../src/application/casos-de-uso/EnviarProposta';
import { InMemoryProjetoConsulta } from '../fakes/InMemoryProjetoConsulta';

describe('EnviarProposta', () => {
  it('salva a proposta como PENDENTE e notifica o cliente dono do projeto', async () => {
    const projetos = new InMemoryProjetoConsulta();
    projetos.adicionar({ id: 'projeto-1', clienteId: 'cliente-1', titulo: 'Landing page', status: 'ABERTO' });
    const propostas = new InMemoryPropostaRepository();
    const notificacoes = new InMemoryNotificationService();
    const enviarProposta = new EnviarProposta(projetos, propostas, notificacoes, () => 'proposta-1');

    const resultado = await enviarProposta.executar({
      projetoId: 'projeto-1',
      solicitante: { id: 'freelancer-1', perfil: 'FREELANCER' },
      valor: 1500,
      prazoDias: 10,
      mensagem: 'Posso entregar em dez dias.',
    });

    expect(resultado).toMatchObject({
      id: 'proposta-1',
      projetoId: 'projeto-1',
      freelancerId: 'freelancer-1',
      status: 'PENDENTE',
    });
    expect(await propostas.buscarPorId('proposta-1')).not.toBeNull();
    expect(notificacoes.enviadas).toEqual([
      {
        tipo: 'NOVA_PROPOSTA',
        destinatarioId: 'cliente-1',
        projeto: { id: 'projeto-1', titulo: 'Landing page' },
        detalhes: { valor: 1500, prazoDias: 10 },
      },
    ]);
  });
});
