import { describe, expect, it } from 'vitest';
import { Proposta } from '../../src/domain/proposta/Proposta';

describe('Proposta', () => {
  const nova = {
    id: 'proposta-1',
    projetoId: 'projeto-1',
    freelancerId: 'freelancer-1',
    valor: 1500,
    prazoDias: 10,
    mensagem: '  Tenho experiência com React e Node.  ',
  };

  it('é criada com status PENDENTE e mensagem sem espaços nas pontas', () => {
    const proposta = Proposta.criar(nova);

    expect(proposta.status).toBe('PENDENTE');
    expect(proposta.paraDados()).toMatchObject({
      valor: 1500,
      prazoDias: 10,
      mensagem: 'Tenho experiência com React e Node.',
    });
  });

  it('passa de PENDENTE para ACEITA ao ser aceita', () => {
    const proposta = Proposta.criar(nova);

    proposta.aceitar();

    expect(proposta.status).toBe('ACEITA');
  });

  it('passa de PENDENTE para RECUSADA ao ser recusada', () => {
    const proposta = Proposta.criar(nova);

    proposta.recusar();

    expect(proposta.status).toBe('RECUSADA');
  });
});
