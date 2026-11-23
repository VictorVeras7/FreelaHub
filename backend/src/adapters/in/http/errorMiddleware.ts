import { NextFunction, Request, Response } from 'express';
import {
  ErroConflito,
  ErroNaoAutenticado,
  ErroNaoEncontrado,
  ErroSemPermissao,
  ErroValidacao,
} from '../../../domain/erros';

interface ErroHttp {
  status: number;
  codigo: string;
}

function erroHttp(erro: unknown): ErroHttp | null {
  if (erro instanceof ErroValidacao) return { status: 400, codigo: 'DADOS_INVALIDOS' };
  if (erro instanceof ErroNaoAutenticado) return { status: 401, codigo: 'NAO_AUTENTICADO' };
  if (erro instanceof ErroSemPermissao) return { status: 403, codigo: 'SEM_PERMISSAO' };
  if (erro instanceof ErroNaoEncontrado) return { status: 404, codigo: 'NAO_ENCONTRADO' };
  if (erro instanceof ErroConflito) return { status: 409, codigo: 'CONFLITO' };
  return null;
}

function responder(res: Response, status: number, codigo: string, mensagem: string): void {
  res.status(status).json({ erro: { codigo, mensagem } });
}

export function tratarErros(erro: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(erro);
    return;
  }
  const http = erroHttp(erro);
  if (http) {
    responder(res, http.status, http.codigo, (erro as Error).message);
    return;
  }
  const tipo = (erro as { type?: string }).type;
  if (tipo === 'entity.parse.failed') {
    responder(res, 400, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.');
    return;
  }
  if (tipo === 'entity.too.large') {
    responder(res, 413, 'CORPO_MUITO_GRANDE', 'O corpo da requisição é grande demais.');
    return;
  }
  console.error(erro);
  responder(res, 500, 'ERRO_INTERNO', 'Erro interno do servidor.');
}
