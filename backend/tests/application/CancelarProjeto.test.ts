import { describe, expect, it } from 'vitest';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { CancelarProjeto } from '../../src/application/casos-de-uso/CancelarProjeto';
import { ErroConflito, ErroNaoEncontrado, ErroSemPermissao } from '../../src/domain/erros';
import { StatusProjeto } from '../../src/domain/projeto/Projeto';
import { Proposta } from '../../src/domain/proposta/Proposta';
import { cenarioDeProjetos } from '../fakes/projetos';

describe('CancelarProjeto', () => {
  async function montar(status: StatusProjeto = 'ABERTO') {
    const cenario = await cenarioDeProjetos();
    const propostas = new InMemoryPropostaRepository();
    const projeto = await cenario.adicionarProjeto(cenario.ana.id, {}, status);
    const cancelar = new CancelarProjeto(cenario.projetos, propostas, cenario.usuarios);

    const novaProposta = async (id: string, freelancerId: string) => {
      const proposta = Proposta.criar({
        id,
        projetoId: projeto.id,
        freelancerId,
        valor: 1000,
        prazoDias: 10,
        mensagem: 'Posso fazer.',
      });
      await propostas.salvar(proposta);
      return proposta;
    };

    return { ...cenario, propostas, projeto, cancelar, novaProposta };
  }

  it('cancela o projeto ABERTO do dono e recusa as propostas pendentes', async () => {
    const { cancelar, projeto, projetos, propostas, ana, novaProposta } = await montar();
    await novaProposta('proposta-1', 'freelancer-1');
    await novaProposta('proposta-2', 'freelancer-2');

    const resultado = await cancelar.executar({ projetoId: projeto.id, solicitante: ana });

    expect(resultado).toMatchObject({ id: projeto.id, status: 'CANCELADO', clienteNome: 'Ana' });
    expect((await projetos.buscarPorId(projeto.id))?.status).toBe('CANCELADO');
    const statusDasPropostas = (await propostas.listarPorProjeto(projeto.id)).map((p) => p.status);
    expect(statusDasPropostas).toEqual(['RECUSADA', 'RECUSADA']);
  });

  it('cancela projeto sem propostas', async () => {
    const { cancelar, projeto, ana } = await montar();

    expect((await cancelar.executar({ projetoId: projeto.id, solicitante: ana })).status).toBe('CANCELADO');
  });

  it.each(['bruno', 'caio'] as const)('recusa o cancelamento por quem não é o dono (%s)', async (quem) => {
    const cenario = await montar();
    await cenario.novaProposta('proposta-1', 'freelancer-1');

    await expect(
      cenario.cancelar.executar({ projetoId: cenario.projeto.id, solicitante: cenario[quem] }),
    ).rejects.toThrow(ErroSemPermissao);
    expect((await cenario.projetos.buscarPorId(cenario.projeto.id))?.status).toBe('ABERTO');
    expect((await cenario.propostas.buscarPorId('proposta-1'))?.status).toBe('PENDENTE');
  });

  it.each(['EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'] as const)(
    'recusa o cancelamento de projeto %s sem alterar as propostas',
    async (status) => {
      const { cancelar, projeto, propostas, ana, novaProposta } = await montar(status);
      await novaProposta('proposta-1', 'freelancer-1');

      await expect(cancelar.executar({ projetoId: projeto.id, solicitante: ana })).rejects.toThrow(ErroConflito);
      expect((await propostas.buscarPorId('proposta-1'))?.status).toBe('PENDENTE');
    },
  );

  it('responde não encontrado para projeto inexistente', async () => {
    const { cancelar, ana } = await montar();

    await expect(cancelar.executar({ projetoId: 'nao-existe', solicitante: ana })).rejects.toThrow(
      ErroNaoEncontrado,
    );
  });
});
