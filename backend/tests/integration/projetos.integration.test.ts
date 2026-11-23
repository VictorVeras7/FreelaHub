import { randomBytes, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProjetoRepository } from '../../src/adapters/out/memoria/InMemoryProjetoRepository';
import { PostgresProjetoRepository } from '../../src/adapters/out/persistence/PostgresProjetoRepository';
import { PostgresPropostaRepository } from '../../src/adapters/out/persistence/PostgresPropostaRepository';
import { PostgresUsuarioRepository } from '../../src/adapters/out/persistence/PostgresUsuarioRepository';
import { PostgresUnidadeDeTrabalho } from '../../src/adapters/out/persistence/PostgresUnidadeDeTrabalho';
import { aplicarMigrations } from '../../src/adapters/out/persistence/migrations/Migrador';
import { CancelarProjeto } from '../../src/application/casos-de-uso/CancelarProjeto';
import { FiltrosProjetos, ProjetoRepository } from '../../src/application/ports/ProjetoRepository';
import { ErroConflito } from '../../src/domain/erros';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';
import { NovoProjeto, Projeto, StatusProjeto } from '../../src/domain/projeto/Projeto';
import { Proposta } from '../../src/domain/proposta/Proposta';

const URL_BANCO = process.env.TEST_DATABASE_URL;
if (!URL_BANCO) {
  throw new Error('Defina TEST_DATABASE_URL para rodar os testes de integração.');
}

// Cada execução usa um schema próprio e descartável, sem tocar nos dados do ambiente.
const SCHEMA = `teste_rf02_${randomBytes(6).toString('hex')}`;

describe('PostgresProjetoRepository', () => {
  let controle: Pool;
  let pool: Pool;
  let repositorio: PostgresProjetoRepository;
  let usuarios: PostgresUsuarioRepository;
  let clienteId: string;
  let freelancerId: string;
  let minuto = 0;

  function novoProjeto(dados: Partial<Omit<NovoProjeto, 'id' | 'clienteId'>> = {}, status: StatusProjeto = 'ABERTO') {
    minuto += 1;
    const criado = Projeto.criar(
      {
        id: randomUUID(),
        clienteId,
        titulo: 'Landing page',
        descricao: 'Página de captura.',
        orcamento: 1500,
        prazoDesejado: '2026-12-20',
        habilidades: ['React', 'Tailwind'],
        ...dados,
      },
      new Date(Date.UTC(2026, 10, 1, 0, minuto)),
    );
    return Projeto.restaurar({ ...criado.paraDados(), status });
  }

  beforeAll(async () => {
    controle = new Pool({ connectionString: URL_BANCO });
    await controle.query(`CREATE SCHEMA ${SCHEMA}`);
    pool = new Pool({ connectionString: URL_BANCO, options: `-c search_path=${SCHEMA}` });
    await aplicarMigrations(pool);
    repositorio = new PostgresProjetoRepository(pool);
    usuarios = new PostgresUsuarioRepository(pool);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE pagamentos, contratos, propostas, projetos, usuarios');
    const senhaHash = 'hash';
    clienteId = (
      await usuarios.incluir({ nome: 'Ana', email: 'ana@exemplo.com', senhaHash, perfil: PerfilUsuario.CLIENTE })
    ).id;
    freelancerId = (
      await usuarios.incluir({ nome: 'Caio', email: 'caio@exemplo.com', senhaHash, perfil: PerfilUsuario.FREELANCER })
    ).id;
  });

  afterAll(async () => {
    await pool?.end();
    await controle.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await controle.end();
  });

  it('salva e lê de volta todos os campos do projeto', async () => {
    const projeto = novoProjeto({ orcamento: 1234.56 });
    await repositorio.salvar(projeto);

    expect((await repositorio.buscarPorId(projeto.id))?.paraDados()).toEqual(projeto.paraDados());
  });

  it('salva projeto sem prazo e sem habilidades', async () => {
    const projeto = novoProjeto({ prazoDesejado: undefined, habilidades: undefined });
    await repositorio.salvar(projeto);

    expect((await repositorio.buscarPorId(projeto.id))?.paraDados()).toMatchObject({
      prazoDesejado: null,
      habilidades: [],
    });
  });

  it('atualiza o status ao salvar de novo', async () => {
    const projeto = novoProjeto();
    await repositorio.salvar(projeto);

    projeto.cancelar();
    await repositorio.salvar(projeto);

    expect((await repositorio.buscarPorId(projeto.id))?.status).toBe('CANCELADO');
  });

  it('devolve null para id inexistente ou que não é UUID', async () => {
    expect(await repositorio.buscarPorId(randomUUID())).toBeNull();
    expect(await repositorio.buscarPorId('nao-e-uuid')).toBeNull();
    expect(await repositorio.buscarResumo('nao-e-uuid')).toBeNull();
  });

  it('o banco recusa status fora do ciclo de vida', async () => {
    const projeto = novoProjeto();
    await repositorio.salvar(projeto);

    await expect(pool.query(`UPDATE projetos SET status = 'PAUSADO' WHERE id = $1`, [projeto.id])).rejects.toMatchObject(
      { code: '23514' },
    );
  });

  it('lista por cliente em qualquer status e implementa ProjetoConsulta', async () => {
    const aberto = novoProjeto({ titulo: 'Aberto' });
    const cancelado = novoProjeto({ titulo: 'Cancelado' }, 'CANCELADO');
    await repositorio.salvar(aberto);
    await repositorio.salvar(cancelado);

    expect((await repositorio.listarPorCliente(clienteId)).map((p) => p.titulo)).toEqual(['Cancelado', 'Aberto']);
    expect(await repositorio.listarPorCliente(freelancerId)).toEqual([]);
    expect(await repositorio.buscarResumo(aberto.id)).toEqual({
      id: aberto.id,
      clienteId,
      titulo: 'Aberto',
      status: 'ABERTO',
    });
  });

  it.each<[string, FiltrosProjetos]>([
    ['sem filtros', {}],
    ['por habilidade', { habilidade: 'react' }],
    ['por habilidade que nenhum projeto exige', { habilidade: 'Rust' }],
    ['por orçamento mínimo', { orcamentoMin: 1000 }],
    ['por orçamento máximo', { orcamentoMax: 3000 }],
    ['por faixa de orçamento e habilidade', { habilidade: 'NODE', orcamentoMin: 1000, orcamentoMax: 3000 }],
  ])('a listagem %s devolve o mesmo que o adaptador em memória', async (_caso, filtros) => {
    const emMemoria: ProjetoRepository = new InMemoryProjetoRepository();
    const projetos = [
      novoProjeto({ titulo: 'Site', orcamento: 1000, habilidades: ['React'] }),
      novoProjeto({ titulo: 'API', orcamento: 3000, habilidades: ['Node', 'PostgreSQL'] }),
      novoProjeto({ titulo: 'Mobile', orcamento: 8000, habilidades: ['React Native'] }),
      novoProjeto({ titulo: 'Barato', orcamento: 500, habilidades: ['node'] }),
      novoProjeto({ titulo: 'Em andamento', habilidades: ['React', 'Node'] }, 'EM_ANDAMENTO'),
      novoProjeto({ titulo: 'Cancelado', habilidades: ['React', 'Node'] }, 'CANCELADO'),
    ];
    for (const projeto of projetos) {
      await repositorio.salvar(projeto);
      await emMemoria.salvar(projeto);
    }

    const doBanco = (await repositorio.listarAbertos(filtros)).map((p) => p.paraDados());
    const daMemoria = (await emMemoria.listarAbertos(filtros)).map((p) => p.paraDados());

    expect(doBanco).toEqual(daMemoria);
    expect(doBanco.every((p) => p.status === 'ABERTO')).toBe(true);
  });

  it('recusa gravar uma transição que o status atual do banco não permite', async () => {
    const projeto = novoProjeto();
    await repositorio.salvar(projeto);
    const lidoAntes = await repositorio.buscarPorId(projeto.id);
    // Outra operação (o aceite do RF05) inicia o projeto depois da leitura.
    await pool.query(`UPDATE projetos SET status = 'EM_ANDAMENTO' WHERE id = $1`, [projeto.id]);

    lidoAntes!.cancelar();
    await expect(repositorio.salvar(lidoAntes!)).rejects.toThrow(ErroConflito);
    expect((await repositorio.buscarPorId(projeto.id))?.status).toBe('EM_ANDAMENTO');
  });

  describe('CancelarProjeto com a unidade de trabalho do PostgreSQL', () => {
    async function montar() {
      const unidade = new PostgresUnidadeDeTrabalho(pool);
      const projetos = new PostgresProjetoRepository(unidade.conexao);
      const propostas = new PostgresPropostaRepository(unidade.conexao);
      const projeto = novoProjeto();
      await projetos.salvar(projeto);
      const proposta = Proposta.criar({
        id: randomUUID(),
        projetoId: projeto.id,
        freelancerId,
        valor: 1000,
        prazoDias: 10,
        mensagem: 'Posso fazer.',
      });
      await propostas.salvar(proposta);
      const cancelar = new CancelarProjeto(projetos, propostas, usuarios, unidade);
      const solicitante = { id: clienteId, perfil: PerfilUsuario.CLIENTE };
      return { projetos, propostas, projeto, proposta, cancelar, solicitante };
    }

    it('grava o projeto CANCELADO e as propostas RECUSADA', async () => {
      const { projetos, propostas, projeto, proposta, cancelar, solicitante } = await montar();

      await cancelar.executar({ projetoId: projeto.id, solicitante });

      expect((await projetos.buscarPorId(projeto.id))?.status).toBe('CANCELADO');
      expect((await propostas.buscarPorId(proposta.id))?.status).toBe('RECUSADA');
    });

    it('desfaz tudo se a gravação de uma proposta falhar', async () => {
      const { projetos, propostas, projeto, proposta, cancelar, solicitante } = await montar();
      const salvarOriginal = propostas.salvar.bind(propostas);
      propostas.salvar = async (p) => {
        await salvarOriginal(p);
        throw new Error('falha depois de gravar');
      };

      await expect(cancelar.executar({ projetoId: projeto.id, solicitante })).rejects.toThrow('falha depois de gravar');
      expect((await projetos.buscarPorId(projeto.id))?.status).toBe('ABERTO');
      expect((await propostas.buscarPorId(proposta.id))?.status).toBe('PENDENTE');
    });
  });
});
