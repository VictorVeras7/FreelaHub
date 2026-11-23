import { ErroSemPermissao, ErroNaoEncontrado } from '../../domain/erros';
import { DadosProposta } from '../../domain/proposta/Proposta';
import { ProjetoConsulta } from '../ports/ProjetoConsulta';
import { PropostaRepository } from '../ports/PropostaRepository';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { Solicitante } from '../Solicitante';

export interface ListarPropostasDoProjetoEntrada {
  projetoId: string;
  solicitante: Solicitante;
}

export interface PropostaComFreelancer extends DadosProposta {
  freelancerNome: string;
}

/** Lista as propostas recebidas por um projeto. Só o cliente dono do projeto pode consultá-las. */
export class ListarPropostasDoProjeto {
  constructor(
    private readonly projetos: ProjetoConsulta,
    private readonly propostas: PropostaRepository,
    private readonly usuarios: Pick<UsuarioRepository, 'buscarPorId'>,
  ) {}

  async executar(entrada: ListarPropostasDoProjetoEntrada): Promise<PropostaComFreelancer[]> {
    const projeto = await this.projetos.buscarResumo(entrada.projetoId);
    if (!projeto) {
      throw new ErroNaoEncontrado('Projeto não encontrado.');
    }
    if (projeto.clienteId !== entrada.solicitante.id) {
      throw new ErroSemPermissao('Somente o cliente dono do projeto pode ver as propostas recebidas.');
    }

    const propostas = await this.propostas.listarPorProjeto(projeto.id);
    const ids = [...new Set(propostas.map((proposta) => proposta.freelancerId))];
    const freelancers = await Promise.all(ids.map((id) => this.usuarios.buscarPorId(id)));
    const nomes = new Map(ids.map((id, i) => [id, freelancers[i]?.nome ?? '']));
    return propostas.map((proposta) => ({
      ...proposta.paraDados(),
      freelancerNome: nomes.get(proposta.freelancerId) ?? '',
    }));
  }
}
