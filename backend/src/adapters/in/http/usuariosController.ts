import { Router } from 'express';
import { Cadastrar } from '../../../application/usecases/Cadastrar';
import { texto } from './texto';

export function criarUsuariosController(cadastrar: Cadastrar): Router {
  const rotas = Router();

  rotas.post('/usuarios', async (req, res) => {
    const corpo = req.body ?? {};
    const usuario = await cadastrar.executar({
      nome: texto(corpo.nome),
      email: texto(corpo.email),
      senha: texto(corpo.senha),
      perfil: texto(corpo.perfil),
    });
    res.status(201).json(usuario);
  });

  return rotas;
}
