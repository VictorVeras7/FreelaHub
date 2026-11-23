import { describe, expect, it } from 'vitest';
import { ErroConflito, ErroValidacao } from '../../src/domain/erros';
import { Projeto, StatusProjeto } from '../../src/domain/projeto/Projeto';

const novo = {
  id: 'projeto-1',
  clienteId: 'cliente-1',
  titulo: '  Landing page  ',
  descricao: 'Página de captura para o lançamento.',
  orcamento: 1500,
  prazoDesejado: '2026-12-20',
  habilidades: [' React ', 'Tailwind', 'react', ''],
};

function projetoCom(status: StatusProjeto): Projeto {
  return Projeto.restaurar({ ...Projeto.criar(novo).paraDados(), status });
}

describe('Projeto', () => {
  it('é criado com status ABERTO, textos sem espaços nas pontas e habilidades sem repetição', () => {
    const projeto = Projeto.criar(novo);

    expect(projeto.status).toBe('ABERTO');
    expect(projeto.paraDados()).toMatchObject({
      titulo: 'Landing page',
      orcamento: 1500,
      prazoDesejado: '2026-12-20',
      habilidades: ['React', 'Tailwind'],
    });
  });

  it('aceita projeto sem prazo e sem habilidades', () => {
    const projeto = Projeto.criar({ ...novo, prazoDesejado: undefined, habilidades: undefined });

    expect(projeto.paraDados()).toMatchObject({ prazoDesejado: null, habilidades: [] });
  });

  it('arredonda o orçamento para duas casas decimais', () => {
    expect(Projeto.criar({ ...novo, orcamento: 99.999 }).orcamento).toBe(100);
  });

  it.each([
    ['sem título', { titulo: undefined }],
    ['com título em branco', { titulo: '   ' }],
    ['sem descrição', { descricao: undefined }],
    ['sem orçamento', { orcamento: undefined }],
    ['com orçamento zero', { orcamento: 0 }],
    ['com orçamento negativo', { orcamento: -10 }],
    ['com orçamento em texto', { orcamento: '1500' }],
    ['com título longo demais', { titulo: 'x'.repeat(161) }],
    ['com prazo em formato inválido', { prazoDesejado: '20/12/2026' }],
    ['com data inexistente', { prazoDesejado: '2026-02-30' }],
    ['com habilidades que não são lista', { habilidades: 'React' }],
    ['com habilidade que não é texto', { habilidades: [1] }],
  ])('rejeita projeto %s', (_caso, alteracao) => {
    expect(() => Projeto.criar({ ...novo, ...alteracao })).toThrow(ErroValidacao);
  });

  it('segue o ciclo ABERTO -> EM_ANDAMENTO -> CONCLUIDO', () => {
    const projeto = Projeto.criar(novo);

    projeto.iniciar();
    expect(projeto.status).toBe('EM_ANDAMENTO');

    projeto.concluir();
    expect(projeto.status).toBe('CONCLUIDO');
  });

  it('passa de ABERTO para CANCELADO ao ser cancelado', () => {
    const projeto = Projeto.criar(novo);

    projeto.cancelar();

    expect(projeto.status).toBe('CANCELADO');
  });

  it.each<[string, StatusProjeto, (projeto: Projeto) => void]>([
    ['cancelar projeto EM_ANDAMENTO', 'EM_ANDAMENTO', (p) => p.cancelar()],
    ['cancelar projeto CONCLUIDO', 'CONCLUIDO', (p) => p.cancelar()],
    ['cancelar projeto já CANCELADO', 'CANCELADO', (p) => p.cancelar()],
    ['concluir projeto ABERTO', 'ABERTO', (p) => p.concluir()],
    ['iniciar projeto CANCELADO', 'CANCELADO', (p) => p.iniciar()],
    ['iniciar projeto EM_ANDAMENTO', 'EM_ANDAMENTO', (p) => p.iniciar()],
  ])('rejeita %s', (_caso, status, transicao) => {
    const projeto = projetoCom(status);

    expect(() => transicao(projeto)).toThrow(ErroConflito);
    expect(projeto.status).toBe(status);
  });
});
