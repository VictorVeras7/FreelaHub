import { Request } from 'express';
import { Solicitante } from '../../../application/Solicitante';
import { ErroNaoAutenticado } from '../../../domain/erros';

/** Lê o usuário gravado em `req.usuario` pelo middleware autenticar (RF01, ADR-002). */
export function obterSolicitante(req: Request): Solicitante {
  if (!req.usuario) throw new ErroNaoAutenticado('Autenticação necessária.');
  return req.usuario;
}
