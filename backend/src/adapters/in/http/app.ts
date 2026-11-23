import express, { Express, Router } from 'express';
import { Autenticar } from '../../../application/usecases/Autenticar';
import { Cadastrar } from '../../../application/usecases/Cadastrar';
import { tratarErros } from './errorMiddleware';
import { criarSessoesController } from './sessoesController';
import { criarUsuariosController } from './usuariosController';

export interface DependenciasApp {
  cadastrar: Cadastrar;
  autenticar: Autenticar;
  rotasAdicionais?: Router[];
}

export function criarApp({ cadastrar, autenticar, rotasAdicionais = [] }: DependenciasApp): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.get('/saude', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(criarUsuariosController(cadastrar));
  app.use(criarSessoesController(autenticar));
  rotasAdicionais.forEach((rotas) => app.use(rotas));
  app.use((_req, res) => {
    res.status(404).json({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada.' } });
  });
  app.use(tratarErros);
  return app;
}
