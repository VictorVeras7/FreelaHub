import { describe, expect, it } from 'vitest';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { ListarPropostasDoProjeto } from '../../src/application/casos-de-uso/ListarPropostasDoProjeto';
import { Proposta } from '../../src/domain/proposta/Proposta';
import { Usuario } from '../../src/domain/Usuario';
import { InMemoryProjetoConsulta } from '../fakes/InMemoryProjetoConsulta';

describe('ListarPropostasDoProjeto', () => {
  it('devolve ao cliente dono as propostas do projeto, da mais antiga para a mais recente', async () => {
    const projetos = new InMemoryProjetoConsulta();
    projetos.adicionar({ id: 'projeto-1', clienteId: 'cliente-1', titulo: 'Landing page', status: 'ABERTO' });
    const propostas = new InMemoryPropostaRepository();
    const base = { projetoId: 'projeto-1', valor: 1000, prazoDias: 5, mensagem: 'Olá!' };
    await propostas.salvar(
      Proposta.criar({ ...base, id: 'p-2', freelancerId: 'f-2' }, new Date('2026-11-20T10:00:00Z')),
    );
    await propostas.salvar(
      Proposta.criar({ ...base, id: 'p-1', freelancerId: 'f-1' }, new Date('2026-11-19T10:00:00Z')),
    );

    const resultado = await new ListarPropostasDoProjeto(projetos, propostas, { buscarPorId: async (id: string) => ({ id, nome: `Nome ${id}` }) as Usuario }).executar({
      projetoId: 'projeto-1',
      solicitante: { id: 'cliente-1', perfil: 'CLIENTE' },
    });

    expect(resultado.map((proposta) => proposta.id)).toEqual(['p-1', 'p-2']);
    expect(resultado[0].freelancerNome).toBe('Nome f-1');
  });
});
