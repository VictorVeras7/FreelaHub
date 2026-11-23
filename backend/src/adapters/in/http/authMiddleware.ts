import { NextFunction, Request, RequestHandler, Response } from 'express';
import { TokenService, UsuarioIdentificado } from '../../../application/ports/TokenService';
import { ErroNaoAutenticado, ErroSemPermissao } from '../../../domain/erros';
import { PerfilUsuario } from '../../../domain/PerfilUsuario';

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: UsuarioIdentificado;
  }
}

export function autenticar(tokens: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const [esquema, token, ...resto] = (req.headers.authorization ?? '').trim().split(/\s+/);
    if (esquema?.toLowerCase() !== 'bearer' || !token || resto.length > 0) {
      next(new ErroNaoAutenticado('Token de acesso ausente ou malformado.'));
      return;
    }
    try {
      req.usuario = tokens.verificar(token);
      next();
    } catch (erro) {
      next(erro);
    }
  };
}

export function autorizar(...perfis: PerfilUsuario[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      next(new ErroNaoAutenticado('Usuário não autenticado.'));
    } else if (!perfis.includes(req.usuario.perfil)) {
      next(new ErroSemPermissao('Seu perfil não tem permissão para esta operação.'));
    } else {
      next();
    }
  };
}
