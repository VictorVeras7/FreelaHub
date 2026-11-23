import {
  ErroSemPermissao,
  ErroNaoEncontrado,
  ErroConflito,
} from '../../domain/erros';
import { DadosProposta, Proposta } from '../../domain/proposta/Proposta';
import { NotificationService } from '../ports/NotificationService';
import { ProjetoConsulta } from '../ports/ProjetoConsulta';
import { PropostaRepository } from '../ports/PropostaRepository';
import { Solicitante } from '../Solicitante';

export interface EnviarPropostaEntrada {
  projetoId: string;
  solicitante: Solicitante;
  valor: unknown;
  prazoDias: unknown;
  mensagem: unknown;
}

/**
 * RF04: o freelancer envia uma proposta para um projeto aberto.
 * RF07: o cliente dono do projeto é notificado da nova proposta.
 */
export class EnviarProposta {
  constructor(
    private readonly projetos: ProjetoConsulta,
    private readonly propostas: PropostaRepository,
    private readonly notificacoes: NotificationService,
    private readonly gerarId: () => string,
  ) {}

  async executar(entrada: EnviarPropostaEntrada): Promise<DadosProposta> {
    const { solicitante } = entrada;

    if (solicitante.perfil !== 'FREELANCER') {
      throw new ErroSemPermissao('Somente freelancers podem enviar propostas.');
    }

    const projeto = await this.projetos.buscarResumo(entrada.projetoId);
    if (!projeto) {
      throw new ErroNaoEncontrado('Projeto não encontrado.');
    }

    // RN02
    if (projeto.status !== 'ABERTO') {
      throw new ErroConflito('Só é possível enviar proposta para projetos com status ABERTO.');
    }

    // RN03 (também garantida no banco por UNIQUE (projeto_id, freelancer_id))
    if (await this.propostas.existeDoFreelancerNoProjeto(projeto.id, solicitante.id)) {
      throw new ErroConflito('Você já enviou uma proposta para este projeto.');
    }

    const proposta = Proposta.criar({
      id: this.gerarId(),
      projetoId: projeto.id,
      freelancerId: solicitante.id,
      valor: entrada.valor,
      prazoDias: entrada.prazoDias,
      mensagem: entrada.mensagem,
    });

    await this.propostas.salvar(proposta);

    await this.notificacoes.notificar({
      tipo: 'NOVA_PROPOSTA',
      destinatarioId: projeto.clienteId,
      projeto: { id: projeto.id, titulo: projeto.titulo },
      detalhes: { valor: proposta.valor, prazoDias: proposta.prazoDias },
    });

    return proposta.paraDados();
  }
}
