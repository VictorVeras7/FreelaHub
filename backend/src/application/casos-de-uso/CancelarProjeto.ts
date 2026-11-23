import { ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { ProjetoRepository } from '../ports/ProjetoRepository';
import { PropostaRepository } from '../ports/PropostaRepository';
import { UnidadeDeTrabalho } from '../ports/UnidadeDeTrabalho';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { Solicitante } from '../Solicitante';
import { detalharProjeto, ProjetoDetalhado } from './detalharProjetos';

export interface CancelarProjetoEntrada {
  projetoId: string;
  solicitante: Solicitante;
}

/**
 * RF02 e RN07: o cliente dono cancela um projeto ABERTO.
 * O projeto passa para CANCELADO e as propostas PENDENTES passam para RECUSADA, na mesma transação.
 */
export class CancelarProjeto {
  constructor(
    private readonly projetos: ProjetoRepository,
    private readonly propostas: PropostaRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly unidadeDeTrabalho: UnidadeDeTrabalho,
  ) {}

  async executar(entrada: CancelarProjetoEntrada): Promise<ProjetoDetalhado> {
    const projeto = await this.unidadeDeTrabalho.executar(() => this.cancelar(entrada));
    return detalharProjeto(projeto, this.usuarios);
  }

  private async cancelar({ projetoId, solicitante }: CancelarProjetoEntrada) {
    const projeto = await this.projetos.buscarPorId(projetoId);
    if (!projeto) {
      throw new ErroNaoEncontrado('Projeto não encontrado.');
    }
    if (!projeto.pertenceA(solicitante.id)) {
      throw new ErroSemPermissao('Somente o cliente que publicou o projeto pode cancelá-lo.');
    }

    // Lança ErroConflito se o projeto não estiver ABERTO.
    projeto.cancelar();
    // Gravado antes das propostas: se um aceite (RF05) tiver iniciado o projeto ao mesmo tempo,
    // o repositório recusa a transição com ErroConflito e a transação inteira é desfeita.
    await this.projetos.salvar(projeto);

    const propostas = await this.propostas.listarPorProjeto(projeto.id);
    for (const proposta of propostas.filter((p) => p.status === 'PENDENTE')) {
      proposta.recusar();
      await this.propostas.salvar(proposta);
    }

    return projeto;
  }
}
