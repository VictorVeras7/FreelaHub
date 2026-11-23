export abstract class ErroDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class ErroValidacao extends ErroDominio {}
export class ErroNaoAutenticado extends ErroDominio {}
export class ErroSemPermissao extends ErroDominio {}
export class ErroNaoEncontrado extends ErroDominio {}
export class ErroConflito extends ErroDominio {}
