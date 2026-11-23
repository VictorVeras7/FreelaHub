import { lerSessao, removerSessao } from './sessaoStorage';

const BASE_URL = '/api';

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroApi';
  }
}

let aoExpirarSessao: () => void = () => {};

export function definirAoExpirarSessao(callback: () => void): void {
  aoExpirarSessao = callback;
}

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function requisitar<T>(caminho: string, { method = 'GET', body }: Opcoes = {}): Promise<T> {
  const token = lerSessao()?.token;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor.');
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Sem token, o 401 é erro de credenciais do login e deve aparecer na própria tela.
    if (resposta.status === 401 && token) {
      removerSessao();
      aoExpirarSessao();
    }
    throw new ErroApi(resposta.status, dados?.erro?.mensagem ?? dados?.mensagem ?? 'Não foi possível concluir a operação.');
  }
  return dados as T;
}
