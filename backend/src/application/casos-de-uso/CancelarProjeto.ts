import { ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { ProjetoRepository } from '../ports/ProjetoRepository';
import { PropostaRepository } from '../ports/PropostaRepository';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { Solicitante } from '../Solicitante';
import { detalharProjeto, ProjetoDetalhado } from './detalharProjetos';

export interface CancelarProjetoEntrada {
  projetoId: string;
  solicitante: Solicitante;
}

/**
 * RF02 e RN07: o cliente dono cancela um projeto ABERTO.
 * O projeto passa para CANCELADO e as propostas PENDENTES passam para RECUSADA.
 */
export class CancelarProjeto {
  constructor(
    private readonly projetos: ProjetoRepository,
    private readonly propostas: PropostaRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(entrada: CancelarProjetoEntrada): Promise<ProjetoDetalhado> {
    const projeto = await this.projetos.buscarPorId(entrada.projetoId);
    if (!projeto) {
      throw new ErroNaoEncontrado('Projeto não encontrado.');
    }
    if (!projeto.pertenceA(entrada.solicitante.id)) {
      throw new ErroSemPermissao('Somente o cliente que publicou o projeto pode cancelá-lo.');
    }

    // Lança ErroConflito se o projeto não estiver ABERTO, antes de qualquer gravação.
    projeto.cancelar();

    const pendentes = (await this.propostas.listarPorProjeto(projeto.id)).filter(
      (proposta) => proposta.status === 'PENDENTE',
    );
    pendentes.forEach((proposta) => proposta.recusar());

    // Enquanto não existe a unidade de trabalho (#34), as propostas são gravadas antes do projeto:
    // se a gravação do projeto falhar, ele continua ABERTO e o cancelamento pode ser repetido.
    for (const proposta of pendentes) {
      await this.propostas.salvar(proposta);
    }
    await this.projetos.salvar(projeto);

    return detalharProjeto(projeto, this.usuarios);
  }
}
