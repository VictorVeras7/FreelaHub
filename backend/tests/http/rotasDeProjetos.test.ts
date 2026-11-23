import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../../src/adapters/in/http/app';
import { autenticar } from '../../src/adapters/in/http/authMiddleware';
import { criarRotasDeProjetos } from '../../src/adapters/in/http/rotas/projetos';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { JwtTokenService } from '../../src/adapters/out/security/JwtTokenService';
import { CancelarProjeto } from '../../src/application/casos-de-uso/CancelarProjeto';
import { ListarMeusProjetos } from '../../src/application/casos-de-uso/ListarMeusProjetos';
import { ListarProjetos } from '../../src/application/casos-de-uso/ListarProjetos';
import { ObterProjeto } from '../../src/application/casos-de-uso/ObterProjeto';
import { PublicarProjeto } from '../../src/application/casos-de-uso/PublicarProjeto';
import { Solicitante } from '../../src/application/Solicitante';
import { Autenticar } from '../../src/application/usecases/Autenticar';
import { Cadastrar } from '../../src/application/usecases/Cadastrar';
import { cenarioDeProjetos, dadosDoProjeto } from '../fakes/projetos';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

async function montarApp() {
  const cenario = await cenarioDeProjetos();
  const { projetos, usuarios } = cenario;
  const tokens = new JwtTokenService(SEGREDO, 60);
  let sequencia = 0;

  const app = criarApp({
    cadastrar: {} as Cadastrar,
    autenticar: {} as Autenticar,
    rotasAdicionais: [
      criarRotasDeProjetos({
        publicarProjeto: new PublicarProjeto(projetos, usuarios, () => `novo-${++sequencia}`),
        listarProjetos: new ListarProjetos(projetos, usuarios),
        listarMeusProjetos: new ListarMeusProjetos(projetos, usuarios),
        obterProjeto: new ObterProjeto(projetos, usuarios),
        cancelarProjeto: new CancelarProjeto(projetos, new InMemoryPropostaRepository(), usuarios),
        autenticar: autenticar(tokens),
      }),
    ],
  });

  const bearer = (usuario: Solicitante) => `Bearer ${tokens.emitir(usuario)}`;
  return { ...cenario, app, bearer };
}

describe('Rotas de projetos', () => {
  it('POST /projetos publica o projeto do cliente e responde 201 com Location', async () => {
    const { app, bearer, ana } = await montarApp();

    const res = await request(app)
      .post('/projetos')
      .set('Authorization', bearer(ana))
      .send({ ...dadosDoProjeto, status: 'CONCLUIDO' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/projetos/novo-1');
    expect(res.body).toEqual({
      id: 'novo-1',
      clienteId: ana.id,
      clienteNome: 'Ana',
      titulo: 'Landing page',
      descricao: 'Página de captura para o lançamento.',
      orcamento: 1500,
      prazoDesejado: '2026-12-20',
      habilidades: ['React', 'Tailwind'],
      status: 'ABERTO',
      criadoEm: expect.any(String),
    });
  });

  it('POST /projetos feito por freelancer recebe 403', async () => {
    const { app, bearer, caio } = await montarApp();

    const res = await request(app).post('/projetos').set('Authorization', bearer(caio)).send(dadosDoProjeto);

    expect(res.status).toBe(403);
    expect(res.body.erro).toEqual({ codigo: 'SEM_PERMISSAO', mensagem: expect.any(String) });
  });

  it.each([
    ['sem título', { titulo: undefined }],
    ['sem descrição', { descricao: undefined }],
    ['com orçamento zero', { orcamento: 0 }],
    ['com orçamento negativo', { orcamento: -5 }],
  ])('POST /projetos %s recebe 400 com mensagem legível', async (_caso, alteracao) => {
    const { app, bearer, ana } = await montarApp();

    const res = await request(app)
      .post('/projetos')
      .set('Authorization', bearer(ana))
      .send({ ...dadosDoProjeto, ...alteracao });

    expect(res.status).toBe(400);
    expect(res.body.erro).toEqual({ codigo: 'DADOS_INVALIDOS', mensagem: expect.any(String) });
  });

  it.each([
    ['post', '/projetos'],
    ['get', '/projetos'],
    ['get', '/projetos/meus'],
    ['get', '/projetos/projeto-1'],
    ['post', '/projetos/projeto-1/cancelamento'],
  ] as const)('%s %s sem token recebe 401', async (metodo, caminho) => {
    const { app } = await montarApp();

    const res = await request(app)[metodo](caminho);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });

  it('GET /projetos devolve somente projetos ABERTO e aplica os filtros da query string', async () => {
    const { app, bearer, ana, caio, adicionarProjeto } = await montarApp();
    await adicionarProjeto(ana.id, { titulo: 'Barato', orcamento: 500, habilidades: ['React'] });
    await adicionarProjeto(ana.id, { titulo: 'Caro', orcamento: 9000, habilidades: ['React'] });
    await adicionarProjeto(ana.id, { titulo: 'Node', orcamento: 2000, habilidades: ['Node'] });
    await adicionarProjeto(ana.id, { titulo: 'Cancelado', orcamento: 2000, habilidades: ['React'] }, 'CANCELADO');

    const todos = await request(app).get('/projetos').set('Authorization', bearer(caio));
    const filtrados = await request(app)
      .get('/projetos')
      .query({ habilidade: 'react', orcamentoMin: '100', orcamentoMax: '5000' })
      .set('Authorization', bearer(caio));

    expect(todos.status).toBe(200);
    expect(todos.body.map((p: { titulo: string }) => p.titulo)).toEqual(['Node', 'Caro', 'Barato']);
    expect(filtrados.body.map((p: { titulo: string }) => p.titulo)).toEqual(['Barato']);
  });

  it('GET /projetos com orçamento que não é número recebe 400', async () => {
    const { app, bearer, caio } = await montarApp();

    const res = await request(app).get('/projetos?orcamentoMin=abc').set('Authorization', bearer(caio));

    expect(res.status).toBe(400);
  });

  it('GET /projetos/meus devolve os projetos do cliente em qualquer status', async () => {
    const { app, bearer, ana, bruno, adicionarProjeto } = await montarApp();
    await adicionarProjeto(ana.id, { titulo: 'Da Ana' });
    await adicionarProjeto(bruno.id, { titulo: 'Do Bruno' });
    await adicionarProjeto(ana.id, { titulo: 'Da Ana cancelado' }, 'CANCELADO');

    const res = await request(app).get('/projetos/meus').set('Authorization', bearer(ana));

    expect(res.status).toBe(200);
    expect(res.body.map((p: { titulo: string }) => p.titulo)).toEqual(['Da Ana cancelado', 'Da Ana']);
  });

  it('GET /projetos/{id} devolve o projeto e responde 404 para id inexistente', async () => {
    const { app, bearer, ana, caio, adicionarProjeto } = await montarApp();
    const projeto = await adicionarProjeto(ana.id);

    const encontrado = await request(app).get(`/projetos/${projeto.id}`).set('Authorization', bearer(caio));
    const inexistente = await request(app).get('/projetos/nao-existe').set('Authorization', bearer(caio));

    expect(encontrado.status).toBe(200);
    expect(encontrado.body).toMatchObject({ id: projeto.id, clienteNome: 'Ana', status: 'ABERTO' });
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('POST /projetos/{id}/cancelamento cancela o projeto do dono', async () => {
    const { app, bearer, ana, adicionarProjeto } = await montarApp();
    const projeto = await adicionarProjeto(ana.id);

    const res = await request(app).post(`/projetos/${projeto.id}/cancelamento`).set('Authorization', bearer(ana));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: projeto.id, status: 'CANCELADO' });
  });

  it('POST /projetos/{id}/cancelamento por quem não é o dono recebe 403', async () => {
    const { app, bearer, ana, bruno, adicionarProjeto } = await montarApp();
    const projeto = await adicionarProjeto(ana.id);

    const res = await request(app).post(`/projetos/${projeto.id}/cancelamento`).set('Authorization', bearer(bruno));

    expect(res.status).toBe(403);
  });

  it('POST /projetos/{id}/cancelamento em projeto que não está ABERTO recebe 409', async () => {
    const { app, bearer, ana, adicionarProjeto } = await montarApp();
    const projeto = await adicionarProjeto(ana.id, {}, 'EM_ANDAMENTO');

    const res = await request(app).post(`/projetos/${projeto.id}/cancelamento`).set('Authorization', bearer(ana));

    expect(res.status).toBe(409);
    expect(res.body.erro).toEqual({ codigo: 'CONFLITO', mensagem: expect.any(String) });
  });
});
