import { RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../../src/adapters/in/http/app';
import { criarContratoController } from '../../src/adapters/in/http/ContratoController';
import { InMemoryNotificationService } from '../../src/adapters/out/memoria/InMemoryNotificationService';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { AceitarProposta } from '../../src/application/casos-de-uso/AceitarProposta';
import { ConsultarContratos } from '../../src/application/casos-de-uso/ConsultarContratos';
import { Autenticar } from '../../src/application/usecases/Autenticar';
import { Cadastrar } from '../../src/application/usecases/Cadastrar';
import { ErroNaoAutenticado } from '../../src/domain/erros';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';
import { Proposta } from '../../src/domain/proposta/Proposta';
import { InMemoryContratoRepository, InMemoryProjetoInicio, UnidadeDeTrabalhoFalsa } from '../fakes/InMemoryContratos';
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
});
