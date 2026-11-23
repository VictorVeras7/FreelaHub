import { describe, expect, it } from 'vitest';
import { Contrato, ContratoJaConcluidoError } from '../../src/domain/contrato/Contrato';
import { ErroConflito } from '../../src/domain/erros';
import { Proposta } from '../../src/domain/proposta/Proposta';

const novaProposta = () =>
  Proposta.criar({ id: 'pr-1', projetoId: 'p-1', freelancerId: 'f-1', valor: 1500, prazoDias: 10, mensagem: 'Olá' });
const projeto = { id: 'p-1', clienteId: 'c-1' };

describe('Contrato', () => {
  it('copia valor, prazo e participantes da proposta aceita e começa ATIVO', () => {
    const proposta = novaProposta();
    proposta.aceitar();
    expect(Contrato.gerar('ct-1', proposta, projeto).paraDados()).toMatchObject({
      id: 'ct-1',
      projetoId: 'p-1',
      propostaId: 'pr-1',
      clienteId: 'c-1',
      freelancerId: 'f-1',
      valor: 1500,
      prazoDias: 10,
      status: 'ATIVO',
    });
  });

  it('não é gerado a partir de proposta que não foi aceita', () => {
    expect(() => Contrato.gerar('ct-1', novaProposta(), projeto)).toThrow(ErroConflito);
  });

  it('não é gerado com proposta de outro projeto', () => {
    const proposta = novaProposta();
    proposta.aceitar();
    expect(() => Contrato.gerar('ct-1', proposta, { id: 'p-2', clienteId: 'c-1' })).toThrow(ErroConflito);
  });

  it('só pode ser concluído uma vez', () => {
    const proposta = novaProposta();
    proposta.aceitar();
    const contrato = Contrato.gerar('ct-1', proposta, projeto);
    contrato.concluir();
    expect(contrato.status).toBe('CONCLUIDO');
    expect(() => contrato.concluir()).toThrow(ContratoJaConcluidoError);
  });
});
