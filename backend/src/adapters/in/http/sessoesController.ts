import { Router } from 'express';
import { Autenticar } from '../../../application/usecases/Autenticar';
import { texto } from './texto';

export function criarSessoesController(autenticar: Autenticar): Router {
  const rotas = Router();

  rotas.post('/sessoes', async (req, res) => {
    const corpo = req.body ?? {};
    const sessao = await autenticar.executar({
      email: texto(corpo.email),
      senha: texto(corpo.senha),
    });
    res.status(200).json(sessao);
  });

  return rotas;
}
