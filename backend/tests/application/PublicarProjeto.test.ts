import { describe, expect, it } from 'vitest';
import { PublicarProjeto } from '../../src/application/casos-de-uso/PublicarProjeto';
import { ErroSemPermissao, ErroValidacao } from '../../src/domain/erros';
import { cenarioDeProjetos, dadosDoProjeto } from '../fakes/projetos';

describe('PublicarProjeto', () => {
  async function montar() {
    const cenario = await cenarioDeProjetos();
    const publicar = new PublicarProjeto(cenario.projetos, cenario.usuarios, () => 'projeto-novo');
    return { ...cenario, publicar };
  }

  it('salva o projeto do cliente com status ABERTO e devolve o nome do cliente', async () => {
    const { publicar, projetos, ana } = await montar();

    const projeto = await publicar.executar({ solicitante: ana, ...dadosDoProjeto });

    expect(projeto).toMatchObject({
      id: 'projeto-novo',
      clienteId: ana.id,
      clienteNome: 'Ana',
      status: 'ABERTO',
      orcamento: 1500,
      habilidades: ['React', 'Tailwind'],
    });
    expect((await projetos.buscarPorId('projeto-novo'))?.status).toBe('ABERTO');
  });

  it('ignora um status enviado na entrada', async () => {
    const { publicar, ana } = await montar();

    const entrada = { solicitante: ana, ...dadosDoProjeto, status: 'CONCLUIDO' };
    const projeto = await publicar.executar(entrada);

    expect(projeto.status).toBe('ABERTO');
  });

  it.each(['FREELANCER', 'ADMINISTRADOR'] as const)('recusa o perfil %s', async (perfil) => {
    const { publicar, projetos } = await montar();

    await expect(
      publicar.executar({ solicitante: { id: 'outro', perfil }, ...dadosDoProjeto }),
    ).rejects.toThrow(ErroSemPermissao);
    expect(await projetos.listarAbertos({})).toEqual([]);
  });

  it('recusa projeto com orçamento menor ou igual a zero', async () => {
    const { publicar, ana } = await montar();

    await expect(publicar.executar({ solicitante: ana, ...dadosDoProjeto, orcamento: 0 })).rejects.toThrow(
      ErroValidacao,
    );
  });
});
