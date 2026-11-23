import { ErroNaoEncontrado } from '../../domain/erros';
import { ProjetoRepository } from '../ports/ProjetoRepository';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { detalharProjeto, ProjetoDetalhado } from './detalharProjetos';

export interface ObterProjetoEntrada {
  projetoId: string;
}

/** RF03: detalhe de um projeto pelo id. */
export class ObterProjeto {
  constructor(
    private readonly projetos: ProjetoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(entrada: ObterProjetoEntrada): Promise<ProjetoDetalhado> {
    const projeto = await this.projetos.buscarPorId(entrada.projetoId);
    if (!projeto) {
      throw new ErroNaoEncontrado('Projeto não encontrado.');
    }
    return detalharProjeto(projeto, this.usuarios);
  }
}
