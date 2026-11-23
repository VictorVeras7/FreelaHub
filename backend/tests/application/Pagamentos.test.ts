import { describe, expect, it } from 'vitest';
import { InMemoryProjetoRepository } from '../../src/adapters/out/memoria/InMemoryProjetoRepository';
import { LiberarPagamento } from '../../src/application/casos-de-uso/LiberarPagamento';
import { RealizarPagamento } from '../../src/application/casos-de-uso/RealizarPagamento';
import { PaymentGateway } from '../../src/application/ports/PaymentGateway';
import { Contrato } from '../../src/domain/contrato/Contrato';
import { ErroConflito, ErroSemPermissao } from '../../src/domain/erros';
import { Pagamento } from '../../src/domain/pagamento/Pagamento';
import { Projeto } from '../../src/domain/projeto/Projeto';
import { Proposta } from '../../src/domain/proposta/Proposta';
import { InMemoryContratoRepository, UnidadeDeTrabalhoFalsa } from '../fakes/InMemoryContratos';
import { InMemoryPagamentoRepository } from '../fakes/InMemoryPagamentoRepository';

async function montar() {
  const projetos = new InMemoryProjetoRepository();
  const projeto = Projeto.criar({
    id: 'p-1',
    clienteId: 'c-1',
    titulo: 'Landing page',
    descricao: 'Página de captura',
    orcamento: 1500,
  });
  projeto.iniciar();
  await projetos.salvar(projeto);

  const proposta = Proposta.criar({
    id: 'pr-1',
    projetoId: projeto.id,
    freelancerId: 'f-1',
    valor: 1200,
    prazoDias: 10,
    mensagem: 'Olá',
  });
  proposta.aceitar();
  const contratos = new InMemoryContratoRepository();
  await contratos.salvar(Contrato.gerar('ct-1', proposta, projeto));
  const pagamentos = new InMemoryPagamentoRepository();
  const unidadeDeTrabalho = new UnidadeDeTrabalhoFalsa(projetos, contratos, pagamentos);
  const chamadasGateway: string[] = [];
  const gateway: PaymentGateway = {
    cobrar: async (id) => {
      chamadasGateway.push(`cobrar:${id}`);
      return 'sim-transacao-1';
    },
    liberar: async (id) => {
      chamadasGateway.push(`liberar:${id}`);
    },
  };
  const realizar = new RealizarPagamento({
    contratos,
    pagamentos,
    gateway,
    unidadeDeTrabalho,
    gerarId: () => 'pg-1',
  });
  const liberar = new LiberarPagamento({ contratos, pagamentos, projetos, gateway, unidadeDeTrabalho });
  return { projetos, contratos, pagamentos, unidadeDeTrabalho, chamadasGateway, realizar, liberar };
}

describe('Pagamento', () => {
  it('só permite a sequência PENDENTE -> RETIDO -> LIBERADO', () => {
    const pagamento = Pagamento.criar({ id: 'pg-1', contratoId: 'ct-1', valor: 1200 });
    expect(() => pagamento.liberar()).toThrow(ErroConflito);
    pagamento.reter('sim-transacao-1');
    expect(() => pagamento.reter('sim-transacao-2')).toThrow(ErroConflito);
    pagamento.liberar();
    expect(pagamento.status).toBe('LIBERADO');
  });

  it('retém o valor acordado e impede pagamento duplicado ou feito por outro usuário', async () => {
    const c = await montar();
    await expect(c.realizar.executar('ct-1', 'c-2')).rejects.toThrow(ErroSemPermissao);
    const pagamento = await c.realizar.executar('ct-1', 'c-1');

    expect(pagamento.paraDados()).toMatchObject({
      id: 'pg-1',
      contratoId: 'ct-1',
      valor: 1200,
      status: 'RETIDO',
      transacaoId: 'sim-transacao-1',
    });
    await expect(c.realizar.executar('ct-1', 'c-1')).rejects.toThrow(ErroConflito);
    expect(c.chamadasGateway).toHaveLength(1);
  });

  it('não persiste pagamento quando a cobrança falha', async () => {
    const c = await montar();
    const gatewayFalho: PaymentGateway = {
      cobrar: async () => {
        throw new Error('gateway indisponível');
      },
      liberar: async () => {},
    };
    const realizar = new RealizarPagamento({
      contratos: c.contratos,
      pagamentos: c.pagamentos,
      gateway: gatewayFalho,
      unidadeDeTrabalho: c.unidadeDeTrabalho,
      gerarId: () => 'pg-1',
    });

    await expect(realizar.executar('ct-1', 'c-1')).rejects.toThrow('gateway indisponível');
    expect(await c.pagamentos.buscarPorContrato('ct-1')).toBeNull();
    expect(c.unidadeDeTrabalho.confirmacoes).toBe(0);
  });

  it('libera somente após retenção e conclui pagamento, contrato e projeto', async () => {
    const c = await montar();
    await c.pagamentos.salvar(Pagamento.criar({ id: 'pg-1', contratoId: 'ct-1', valor: 1200 }));
    await expect(c.liberar.executar('ct-1', 'c-1')).rejects.toThrow(ErroConflito);
    await c.realizar.executar('ct-1', 'c-1');

    const pagamento = await c.liberar.executar('ct-1', 'c-1');
    expect(pagamento.status).toBe('LIBERADO');
    expect((await c.contratos.buscarPorId('ct-1'))?.status).toBe('CONCLUIDO');
    expect((await c.projetos.buscarPorId('p-1'))?.status).toBe('CONCLUIDO');
    expect(c.chamadasGateway).toEqual(['cobrar:pg-1', 'liberar:sim-transacao-1']);
    expect(c.unidadeDeTrabalho.confirmacoes).toBe(2);
  });

  it('reverte todas as gravações se o repasse falhar', async () => {
    const c = await montar();
    await c.realizar.executar('ct-1', 'c-1');
    const cenarioGatewayFalho: PaymentGateway = {
      cobrar: async () => 'sim-transacao-1',
      liberar: async () => {
        throw new Error('gateway indisponível');
      },
    };
    const liberar = new LiberarPagamento({
      contratos: c.contratos,
      pagamentos: c.pagamentos,
      projetos: c.projetos,
      gateway: cenarioGatewayFalho,
      unidadeDeTrabalho: c.unidadeDeTrabalho,
    });

    await expect(liberar.executar('ct-1', 'c-1')).rejects.toThrow('gateway indisponível');
    expect((await c.pagamentos.buscarPorContrato('ct-1'))?.status).toBe('RETIDO');
    expect((await c.contratos.buscarPorId('ct-1'))?.status).toBe('ATIVO');
    expect((await c.projetos.buscarPorId('p-1'))?.status).toBe('EM_ANDAMENTO');
  });
});
