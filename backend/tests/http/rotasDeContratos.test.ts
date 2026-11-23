import { RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../../src/adapters/in/http/app';
import { criarContratoController } from '../../src/adapters/in/http/ContratoController';
import { InMemoryNotificationService } from '../../src/adapters/out/memoria/InMemoryNotificationService';
import { InMemoryProjetoRepository } from '../../src/adapters/out/memoria/InMemoryProjetoRepository';
import { FakePaymentAdapter } from '../../src/adapters/out/payment/FakePaymentAdapter';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { AceitarProposta } from '../../src/application/casos-de-uso/AceitarProposta';
import { ConsultarPagamento } from '../../src/application/casos-de-uso/ConsultarPagamento';
import { ConsultarContratos } from '../../src/application/casos-de-uso/ConsultarContratos';
import { LiberarPagamento } from '../../src/application/casos-de-uso/LiberarPagamento';
import { RealizarPagamento } from '../../src/application/casos-de-uso/RealizarPagamento';
import { Autenticar } from '../../src/application/usecases/Autenticar';
import { Cadastrar } from '../../src/application/usecases/Cadastrar';
import { ErroNaoAutenticado } from '../../src/domain/erros';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';
import { Projeto } from '../../src/domain/projeto/Projeto';
import { Proposta } from '../../src/domain/proposta/Proposta';
import { InMemoryContratoRepository, InMemoryProjetoInicio, UnidadeDeTrabalhoFalsa } from '../fakes/InMemoryContratos';
import { InMemoryPagamentoRepository } from '../fakes/InMemoryPagamentoRepository';
import { InMemoryProjetoConsulta } from '../fakes/InMemoryProjetoConsulta';

const autenticacaoDeTeste: RequestHandler = (req, _res, next) => {
  const id = req.header('x-usuario-id');
  if (!id) {
    next(new ErroNaoAutenticado('Token de acesso ausente ou malformado.'));
    return;
  }
  req.usuario = { id, perfil: req.header('x-usuario-perfil') as PerfilUsuario };
  next();
};

async function montarApp() {
  const projetos = new InMemoryProjetoConsulta();
  projetos.adicionar({ id: 'p-1', clienteId: 'c-1', titulo: 'Landing page', status: 'ABERTO' });
  const propostas = new InMemoryPropostaRepository();
  await propostas.salvar(
    Proposta.criar({ id: 'pr-1', projetoId: 'p-1', freelancerId: 'f-1', valor: 1500, prazoDias: 10, mensagem: 'Olá' }),
  );
  const contratos = new InMemoryContratoRepository();
  const pagamentos = new InMemoryPagamentoRepository();
  const projetosPersistidos = new InMemoryProjetoRepository();
  const projeto = Projeto.criar({
    id: 'p-1',
    clienteId: 'c-1',
    titulo: 'Landing page',
    descricao: 'Página de captura',
    orcamento: 1500,
  });
  projeto.iniciar();
  await projetosPersistidos.salvar(projeto);
  const unidadeDeTrabalho = new UnidadeDeTrabalhoFalsa(contratos, pagamentos, projetosPersistidos);
  const gateway = new FakePaymentAdapter(() => 'transacao-teste');
  return criarApp({
    cadastrar: {} as Cadastrar,
    autenticar: {} as Autenticar,
    rotasAdicionais: [
      criarContratoController({
        aceitarProposta: new AceitarProposta({
          propostas,
          projetos,
          projetoInicio: new InMemoryProjetoInicio(projetos),
          contratos,
          unidadeDeTrabalho: new UnidadeDeTrabalhoFalsa(),
          notificacoes: new InMemoryNotificationService(),
          gerarId: () => 'ct-1',
        }),
        consultarContratos: new ConsultarContratos(contratos),
        consultarPagamento: new ConsultarPagamento(contratos, pagamentos),
        realizarPagamento: new RealizarPagamento({
          contratos,
          pagamentos,
          gateway,
          unidadeDeTrabalho,
          gerarId: () => 'pg-1',
        }),
        liberarPagamento: new LiberarPagamento({
          contratos,
          pagamentos,
          projetos: projetosPersistidos,
          gateway,
          unidadeDeTrabalho,
        }),
        autenticar: autenticacaoDeTeste,
      }),
    ],
  });
}

const como = (r: request.Test, id: string, perfil: PerfilUsuario) =>
  r.set('x-usuario-id', id).set('x-usuario-perfil', perfil);

describe('Rotas de contratos', () => {
  it('responde 401 sem autenticação', async () => {
    const app = await montarApp();
    expect((await request(app).post('/propostas/pr-1/aceite')).status).toBe(401);
    expect((await request(app).get('/contratos/ct-1')).status).toBe(401);
    expect((await request(app).post('/contratos/ct-1/pagamento')).status).toBe(401);
    expect((await request(app).post('/contratos/ct-1/confirmacao-entrega')).status).toBe(401);
  });

  it('impede freelancer de aceitar e cliente que não é dono', async () => {
    const app = await montarApp();
    expect((await como(request(app).post('/propostas/pr-1/aceite'), 'f-1', 'FREELANCER')).status).toBe(403);
    const outro = await como(request(app).post('/propostas/pr-1/aceite'), 'c-2', 'CLIENTE');
    expect(outro.status).toBe(403);
    expect(outro.body.erro.codigo).toBe('SEM_PERMISSAO');
  });

  it('aceita a proposta e expõe o contrato aos participantes', async () => {
    const app = await montarApp();
    const aceite = await como(request(app).post('/propostas/pr-1/aceite'), 'c-1', 'CLIENTE');
    expect(aceite.status).toBe(201);
    expect(aceite.body).toMatchObject({ id: 'ct-1', projetoTitulo: 'Landing page', valor: 1500, status: 'ATIVO' });

    const lista = await como(request(app).get('/contratos'), 'f-1', 'FREELANCER');
    expect(lista.body).toHaveLength(1);
    expect((await como(request(app).get('/contratos/ct-1'), 'f-1', 'FREELANCER')).status).toBe(200);
    expect((await como(request(app).get('/contratos/ct-1'), 'f-2', 'FREELANCER')).status).toBe(403);
    expect((await como(request(app).get('/contratos/x'), 'c-1', 'CLIENTE')).status).toBe(404);
    expect((await como(request(app).post('/propostas/pr-1/aceite'), 'c-1', 'CLIENTE')).status).toBe(409);
  });

  it('retém o pagamento do cliente e libera após confirmação da entrega', async () => {
    const app = await montarApp();
    await como(request(app).post('/propostas/pr-1/aceite'), 'c-1', 'CLIENTE');

    const pagamento = await como(request(app).post('/contratos/ct-1/pagamento'), 'c-1', 'CLIENTE');
    expect(pagamento.status).toBe(200);
    expect(pagamento.body).toMatchObject({ contratoId: 'ct-1', valor: 1500, status: 'RETIDO' });
    expect((await como(request(app).get('/contratos/ct-1/pagamento'), 'f-1', 'FREELANCER')).status).toBe(200);
    expect((await como(request(app).post('/contratos/ct-1/confirmacao-entrega'), 'f-1', 'FREELANCER')).status).toBe(
      403,
    );

    const liberado = await como(request(app).post('/contratos/ct-1/confirmacao-entrega'), 'c-1', 'CLIENTE');
    expect(liberado.status).toBe(200);
    expect(liberado.body.status).toBe('LIBERADO');
    expect((await como(request(app).get('/contratos/ct-1'), 'f-1', 'FREELANCER')).body.status).toBe('CONCLUIDO');
  });
});
