import { describe, expect, it } from 'vitest';
import { ListarMeusProjetos } from '../../src/application/casos-de-uso/ListarMeusProjetos';
import { ListarProjetos } from '../../src/application/casos-de-uso/ListarProjetos';
import { ObterProjeto } from '../../src/application/casos-de-uso/ObterProjeto';
import { ErroNaoEncontrado, ErroSemPermissao, ErroValidacao } from '../../src/domain/erros';
import { cenarioDeProjetos } from '../fakes/projetos';

async function montar() {
  const cenario = await cenarioDeProjetos();
  const { ana, bruno, adicionarProjeto } = cenario;
  await adicionarProjeto(ana.id, { titulo: 'Site React', orcamento: 1000, habilidades: ['React'] });
  await adicionarProjeto(bruno.id, { titulo: 'API Node', orcamento: 3000, habilidades: ['Node', 'PostgreSQL'] });
  await adicionarProjeto(ana.id, { titulo: 'App mobile', orcamento: 8000, habilidades: ['React Native'] });
  await adicionarProjeto(ana.id, { titulo: 'Em andamento', habilidades: ['React'] }, 'EM_ANDAMENTO');
  await adicionarProjeto(bruno.id, { titulo: 'Concluído', habilidades: ['React'] }, 'CONCLUIDO');
  await adicionarProjeto(ana.id, { titulo: 'Cancelado', habilidades: ['React'] }, 'CANCELADO');
  return cenario;
}

const titulos = (projetos: { titulo: string }[]) => projetos.map((p) => p.titulo);

describe('ListarProjetos', () => {
  it('lista somente projetos ABERTO, do mais recente para o mais antigo, com o nome do cliente', async () => {
    const { projetos, usuarios } = await montar();

    const resultado = await new ListarProjetos(projetos, usuarios).executar();

    expect(titulos(resultado)).toEqual(['App mobile', 'API Node', 'Site React']);
    expect(resultado.map((p) => p.clienteNome)).toEqual(['Ana', 'Bruno', 'Ana']);
  });

  it('filtra pela habilidade exata, sem diferenciar maiúsculas, e nunca mostra projetos fora de ABERTO', async () => {
    const { projetos, usuarios } = await montar();

    const resultado = await new ListarProjetos(projetos, usuarios).executar({ habilidade: ' react ' });

    expect(titulos(resultado)).toEqual(['Site React']);
  });

  it('filtra pela faixa de orçamento, com limites inclusivos', async () => {
    const { projetos, usuarios } = await montar();
    const listar = new ListarProjetos(projetos, usuarios);

    expect(titulos(await listar.executar({ orcamentoMin: 1000, orcamentoMax: 3000 }))).toEqual([
      'API Node',
      'Site React',
    ]);
    expect(titulos(await listar.executar({ orcamentoMin: 3001 }))).toEqual(['App mobile']);
    expect(titulos(await listar.executar({ orcamentoMax: 999 }))).toEqual([]);
  });

  it.each([
    ['orçamento mínimo negativo', { orcamentoMin: -1 }],
    ['orçamento máximo que não é número', { orcamentoMax: Number.NaN }],
    ['mínimo maior que o máximo', { orcamentoMin: 5000, orcamentoMax: 1000 }],
    ['habilidade que não é texto', { habilidade: ['React'] }],
  ])('recusa filtro com %s', async (_caso, filtros) => {
    const { projetos, usuarios } = await montar();

    await expect(new ListarProjetos(projetos, usuarios).executar(filtros)).rejects.toThrow(ErroValidacao);
  });
});

describe('ObterProjeto', () => {
  it('devolve o projeto em qualquer status', async () => {
    const { projetos, usuarios } = await montar();

    const projeto = await new ObterProjeto(projetos, usuarios).executar({ projetoId: 'projeto-6' });

    expect(projeto).toMatchObject({ titulo: 'Cancelado', status: 'CANCELADO', clienteNome: 'Ana' });
  });

  it('responde não encontrado para id inexistente', async () => {
    const { projetos, usuarios } = await montar();

    await expect(new ObterProjeto(projetos, usuarios).executar({ projetoId: 'nao-existe' })).rejects.toThrow(
      ErroNaoEncontrado,
    );
  });
});

describe('ListarMeusProjetos', () => {
  it('lista todos os projetos do cliente, em qualquer status', async () => {
    const { projetos, usuarios, ana } = await montar();

    const resultado = await new ListarMeusProjetos(projetos, usuarios).executar({ solicitante: ana });

    expect(titulos(resultado)).toEqual(['Cancelado', 'Em andamento', 'App mobile', 'Site React']);
  });

  it('recusa freelancer', async () => {
    const { projetos, usuarios, caio } = await montar();

    await expect(new ListarMeusProjetos(projetos, usuarios).executar({ solicitante: caio })).rejects.toThrow(
      ErroSemPermissao,
    );
  });
});
