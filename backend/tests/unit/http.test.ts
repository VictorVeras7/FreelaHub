import { Router } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/adapters/in/http/app';
import { autenticar as exigirToken, autorizar } from '../../src/adapters/in/http/authMiddleware';
import { JwtTokenService } from '../../src/adapters/out/security/JwtTokenService';
import { Autenticar } from '../../src/application/usecases/Autenticar';
import { Cadastrar } from '../../src/application/usecases/Cadastrar';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';
import { SenhaHasherFalso, UsuarioRepositoryEmMemoria } from './fakes';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const corpo = { nome: 'Ana', email: 'ana@exemplo.com', senha: 'senha-segura', perfil: 'CLIENTE' };

function montarApp() {
  const repositorio = new UsuarioRepositoryEmMemoria();
  const hasher = new SenhaHasherFalso();
  const tokens = new JwtTokenService(SEGREDO, 60);
  const protegidas = Router();
  protegidas.get('/protegida', exigirToken(tokens), autorizar(PerfilUsuario.CLIENTE), (req, res) => {
    res.json(req.usuario);
  });
  const app = criarApp({
    cadastrar: new Cadastrar(repositorio, hasher),
    autenticar: new Autenticar(repositorio, hasher, tokens),
    rotasAdicionais: [protegidas],
  });
  return { app, tokens };
}

describe('POST /usuarios', () => {
  let app: ReturnType<typeof montarApp>['app'];
  beforeEach(() => {
    app = montarApp().app;
  });

  it('cria usuário e não retorna a senha', async () => {
    const res = await request(app).post('/usuarios').send(corpo);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'id-1', nome: 'Ana', email: 'ana@exemplo.com', perfil: 'CLIENTE' });
  });

  it('retorna 409 com mensagem para e-mail repetido', async () => {
    await request(app).post('/usuarios').send(corpo);
    const res = await request(app).post('/usuarios').send(corpo);
    expect(res.status).toBe(409);
    expect(res.body.erro.mensagem).toEqual(expect.any(String));
  });

  it('retorna 400 para perfil Administrador', async () => {
    const res = await request(app).post('/usuarios').send({ ...corpo, perfil: 'ADMINISTRADOR' });
    expect(res.status).toBe(400);
  });

  it.each([
    ['campos de tipo errado', { ...corpo, senha: 12345678 }],
    ['corpo vazio', {}],
  ])('retorna 400 para %s', async (_caso, dados) => {
    const res = await request(app).post('/usuarios').send(dados);
    expect(res.status).toBe(400);
  });

  it('retorna 400 para JSON inválido', async () => {
    const res = await request(app).post('/usuarios').set('Content-Type', 'application/json').send('{quebrado');
    expect(res.status).toBe(400);
    expect(res.body.erro.mensagem).toEqual(expect.any(String));
  });
});

describe('POST /sessoes', () => {
  it('retorna token para credenciais válidas', async () => {
    const { app, tokens } = montarApp();
    await request(app).post('/usuarios').send(corpo);
    const res = await request(app).post('/sessoes').send({ email: corpo.email, senha: corpo.senha });
    expect(res.status).toBe(200);
    expect(tokens.verificar(res.body.token)).toEqual({ id: 'id-1', perfil: 'CLIENTE' });
  });

  it('retorna 401 com mensagem para credenciais inválidas', async () => {
    const { app } = montarApp();
    const res = await request(app).post('/sessoes').send({ email: corpo.email, senha: 'errada-123' });
    expect(res.status).toBe(401);
    expect(res.body.erro.mensagem).toEqual(expect.any(String));
  });
});

describe('middleware de autenticação e autorização', () => {
  it('retorna 401 sem cabeçalho Authorization', async () => {
    const { app } = montarApp();
    expect((await request(app).get('/protegida')).status).toBe(401);
  });

  it.each(['Basic abc', 'Bearer', 'Bearer a b', 'Bearer invalido'])('retorna 401 para "%s"', async (cabecalho) => {
    const { app } = montarApp();
    const res = await request(app).get('/protegida').set('Authorization', cabecalho);
    expect(res.status).toBe(401);
  });

  it('retorna 401 para token expirado', async () => {
    const { app } = montarApp();
    const token = jwt.sign({ perfil: 'CLIENTE' }, SEGREDO, { subject: '1', expiresIn: -1 });
    const res = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('retorna 403 para perfil não permitido', async () => {
    const { app, tokens } = montarApp();
    const token = tokens.emitir({ id: '1', perfil: PerfilUsuario.FREELANCER });
    const res = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('segue para o controller com o usuário identificado', async () => {
    const { app, tokens } = montarApp();
    const token = tokens.emitir({ id: '1', perfil: PerfilUsuario.CLIENTE });
    const res = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: '1', perfil: 'CLIENTE' });
  });
});
