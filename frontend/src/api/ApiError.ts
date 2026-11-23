export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ApiError';
  }
}

export const mensagemDoErro = (erro: unknown): string =>
  erro instanceof ApiError ? erro.message : 'Não foi possível concluir a operação. Tente de novo.';
