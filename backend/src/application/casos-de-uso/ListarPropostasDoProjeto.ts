import { ErroSemPermissao, ErroNaoEncontrado } from '../../domain/erros';
import { DadosProposta } from '../../domain/proposta/Proposta';
import { ProjetoConsulta } from '../ports/ProjetoConsulta';
import { PropostaRepository } from '../ports/PropostaRepository';
import { Solicitante } from '../Solicitante';

export interface ListarPropostasDoProjetoEntrada {
  projetoId: string;
  solicitante: Solicitante;
}

/** Lista as propostas recebidas por um projeto. Só o cliente dono do projeto pode consultá-las. */
export class ListarPropostasDoProjeto {
  constructor(
    private readonly projetos: ProjetoConsulta,
    private readonly propostas: PropostaRepository,
  ) {}

  async executar(entrada: ListarPropostasDoProjetoEntrada): Promise<DadosProposta[]> {
    const projeto = await this.projetos.buscarResumo(entrada.projetoId);
    if (!projeto) {
      throw new ErroNaoEncontrado('Projeto não encontrado.');
    }
    if (projeto.clienteId !== entrada.solicitante.id) {
      throw new ErroSemPermissao('Somente o cliente dono do projeto pode ver as propostas recebidas.');
    }

    const propostas = await this.propostas.listarPorProjeto(projeto.id);
    return propostas.map((proposta) => proposta.paraDados());
  }
}
