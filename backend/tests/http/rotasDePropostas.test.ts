import { randomUUID } from 'node:crypto';
import { RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../../src/adapters/in/http/app';
import { criarRotasDePropostas } from '../../src/adapters/in/http/rotas/propostas';
import { InMemoryNotificationService } from '../../src/adapters/out/memoria/InMemoryNotificationService';
import { InMemoryPropostaRepository } from '../../src/adapters/out/memoria/InMemoryPropostaRepository';
import { EnviarProposta } from '../../src/application/casos-de-uso/EnviarProposta';
import { ListarPropostasDoProjeto } from '../../src/application/casos-de-uso/ListarPropostasDoProjeto';
import { PerfilUsuario } from '../../src/application/Solicitante';
import { Autenticar } from '../../src/application/usecases/Autenticar';
import { Cadastrar } from '../../src/application/usecases/Cadastrar';
import { Usuario } from '../../src/domain/Usuario';
import { InMemoryProjetoConsulta } from '../fakes/InMemoryProjetoConsulta';

/** Substitui o middleware JWT: identifica o usuário pelos cabeçalhos de teste. */
const autenticacaoDeTeste: RequestHandler = (req, _res, next) => {
  req.usuario = {
    id: String(req.header('x-usuario-id')),
    perfil: req.header('x-usuario-perfil') as PerfilUsuario,
  };
  next();
};

function montarApp() {
  const projetos = new InMemoryProjetoConsulta();
  projetos.adicionar({ id: 'projeto-1', clienteId: 'cliente-1', titulo: 'Landing page', status: 'ABERTO' });
  const propostas = new InMemoryPropostaRepository();
  const notificacoes = new InMemoryNotificationService();

  return criarApp({
    cadastrar: {} as Cadastrar,
    autenticar: {} as Autenticar,
    rotasAdicionais: [
      criarRotasDePropostas({
        enviarProposta: new EnviarProposta(projetos, propostas, notificacoes, randomUUID),
        listarPropostasDoProjeto: new ListarPropostasDoProjeto(projetos, propostas, { buscarPorId: async (id: string) => ({ id, nome: `Nome ${id}` }) as Usuario }),
        autenticar: autenticacaoDeTeste,
      }),
    ],
  });
}

describe('Rotas de propostas', () => {
  it('POST cria a proposta e GET a devolve para o cliente dono do projeto', async () => {
    const app = montarApp();

    const criacao = await request(app)
      .post('/projetos/projeto-1/propostas')
      .set('x-usuario-id', 'freelancer-1')
      .set('x-usuario-perfil', 'FREELANCER')
      .send({ valor: 1500, prazoDias: 10, mensagem: 'Posso entregar em dez dias.' });

    expect(criacao.status).toBe(201);
    expect(criacao.headers.location).toBe(`/projetos/projeto-1/propostas/${criacao.body.id}`);
    expect(criacao.body).toMatchObject({
      projetoId: 'projeto-1',
      freelancerId: 'freelancer-1',
      valor: 1500,
      prazoDias: 10,
      status: 'PENDENTE',
    });

    const listagem = await request(app)
      .get('/projetos/projeto-1/propostas')
      .set('x-usuario-id', 'cliente-1')
      .set('x-usuario-perfil', 'CLIENTE');

    expect(listagem.status).toBe(200);
    expect(listagem.body).toEqual([{ ...criacao.body, freelancerNome: 'Nome freelancer-1' }]);
  });
});
