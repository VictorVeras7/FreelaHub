import { describe, expect, it } from 'vitest';
import { InMemoryNotificationService } from '../../src/adapters/out/memoria/InMemoryNotificationService';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { AceitarProposta } from '../../src/application/casos-de-uso/AceitarProposta';
import { ConsultarContratos } from '../../src/application/casos-de-uso/ConsultarContratos';
import { StatusProjeto } from '../../src/application/ports/ProjetoConsulta';
import { ErroConflito, ErroNaoEncontrado, ErroSemPermissao } from '../../src/domain/erros';
import { Proposta } from '../../src/domain/proposta/Proposta';
import { InMemoryContratoRepository, InMemoryProjetoInicio, UnidadeDeTrabalhoFalsa } from '../fakes/InMemoryContratos';
import { InMemoryProjetoConsulta } from '../fakes/InMemoryProjetoConsulta';

async function montar(statusProjeto: StatusProjeto = 'ABERTO') {
  const projetos = new InMemoryProjetoConsulta();
  projetos.adicionar({ id: 'p-1', clienteId: 'c-1', titulo: 'Landing page', status: statusProjeto });
  const propostas = new InMemoryPropostaRepository();
  const base = { projetoId: 'p-1', prazoDias: 10, mensagem: 'Olá' };
  await propostas.salvar(Proposta.criar({ ...base, id: 'pr-1', freelancerId: 'f-1', valor: 1500 }));
  await propostas.salvar(Proposta.criar({ ...base, id: 'pr-2', freelancerId: 'f-2', valor: 1200 }));
  const contratos = new InMemoryContratoRepository();
  const notificacoes = new InMemoryNotificationService();
  const unidadeDeTrabalho = new UnidadeDeTrabalhoFalsa(propostas, projetos, contratos);
  const casoDeUso = new AceitarProposta({
    propostas,
    projetos,
    projetoInicio: new InMemoryProjetoInicio(projetos),
    contratos,
    unidadeDeTrabalho,
    notificacoes,
    gerarId: () => 'ct-1',
  });
  return { casoDeUso, projetos, propostas, contratos, notificacoes, unidadeDeTrabalho };
}

describe('AceitarProposta', () => {
  it('aceita, recusa as demais, inicia o projeto, gera o contrato e notifica', async () => {
    const c = await montar();
    const contrato = await c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' });

    expect(contrato).toMatchObject({ id: 'ct-1', valor: 1500, prazoDias: 10, freelancerId: 'f-1', status: 'ATIVO' });
    expect((await c.propostas.buscarPorId('pr-1'))?.status).toBe('ACEITA');
    expect((await c.propostas.buscarPorId('pr-2'))?.status).toBe('RECUSADA');
    expect((await c.projetos.buscarResumo('p-1'))?.status).toBe('EM_ANDAMENTO');
    expect(c.unidadeDeTrabalho.execucoes).toBe(1);
    expect(c.notificacoes.enviadas.map((n) => [n.tipo, n.destinatarioId])).toEqual([
      ['PROPOSTA_ACEITA', 'f-1'],
      ['PROPOSTA_RECUSADA', 'f-2'],
    ]);
  });

  it('não persiste nada nem notifica quando uma etapa da transação falha', async () => {
    const c = await montar();
    c.contratos.salvar = async () => {
      throw new Error('falha ao salvar');
    };

    await expect(c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' })).rejects.toThrow('falha ao salvar');

    expect((await c.propostas.buscarPorId('pr-1'))?.status).toBe('PENDENTE');
    expect((await c.propostas.buscarPorId('pr-2'))?.status).toBe('PENDENTE');
    expect((await c.projetos.buscarResumo('p-1'))?.status).toBe('ABERTO');
    expect(c.contratos.registros.size).toBe(0);
    expect(c.unidadeDeTrabalho.confirmacoes).toBe(0);
    expect(c.notificacoes.enviadas).toHaveLength(0);
  });

  it('notifica somente depois de confirmar a transação', async () => {
    const c = await montar();
    const confirmacoesAoNotificar: number[] = [];
    c.notificacoes.notificar = async () => {
      confirmacoesAoNotificar.push(c.unidadeDeTrabalho.confirmacoes);
    };

    await c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' });

    expect(confirmacoesAoNotificar).toEqual([1, 1]);
  });

  it('não desfaz o aceite quando a notificação falha', async () => {
    const c = await montar();
    c.notificacoes.notificar = async () => {
      throw new Error('falha no envio');
    };
    await expect(c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' })).resolves.toMatchObject({ id: 'ct-1' });
  });

  it('responde não encontrado para proposta inexistente', async () => {
    const c = await montar();
    await expect(c.casoDeUso.executar({ propostaId: 'x', usuarioId: 'c-1' })).rejects.toThrow(ErroNaoEncontrado);
  });

  it('recusa quem não é o cliente dono do projeto', async () => {
    const c = await montar();
    await expect(c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-2' })).rejects.toThrow(ErroSemPermissao);
    expect((await c.propostas.buscarPorId('pr-1'))?.status).toBe('PENDENTE');
  });

  it('recusa projeto que não está aberto', async () => {
    const c = await montar('CANCELADO');
    await expect(c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' })).rejects.toThrow(ErroConflito);
  });

  it('recusa proposta que não está pendente', async () => {
    const c = await montar();
    const proposta = await c.propostas.buscarPorId('pr-1');
    proposta?.recusar();
    if (proposta) await c.propostas.salvar(proposta);
    await expect(c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' })).rejects.toThrow(ErroConflito);
  });

  it('recusa projeto que já tem proposta aceita (RN04)', async () => {
    const c = await montar();
    const aceita = await c.propostas.buscarPorId('pr-2');
    aceita?.aceitar();
    if (aceita) await c.propostas.salvar(aceita);
    await expect(c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' })).rejects.toThrow('já tem uma proposta aceita');
  });
});

describe('ConsultarContratos', () => {
  it('lista e detalha apenas para participantes', async () => {
    const c = await montar();
    await c.casoDeUso.executar({ propostaId: 'pr-1', usuarioId: 'c-1' });
    const consulta = new ConsultarContratos(c.contratos);

    expect(await consulta.listar('f-1')).toHaveLength(1);
    expect(await consulta.listar('f-2')).toHaveLength(0);
    await expect(consulta.buscar('ct-1', 'c-1')).resolves.toMatchObject({ id: 'ct-1' });
    await expect(consulta.buscar('ct-1', 'f-2')).rejects.toThrow(ErroSemPermissao);
    await expect(consulta.buscar('x', 'c-1')).rejects.toThrow(ErroNaoEncontrado);
  });
});
