import { Contrato } from '../../domain/contrato/Contrato';
import { ErroConflito, ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { Proposta } from '../../domain/proposta/Proposta';
import { ContratoDetalhado, ContratoRepository } from '../ports/ContratoRepository';
import { Notificacao, NotificationService } from '../ports/NotificationService';
import { ProjetoConsulta } from '../ports/ProjetoConsulta';
import { ProjetoInicio } from '../ports/ProjetoInicio';
import { PropostaRepository } from '../ports/PropostaRepository';
import { UnidadeDeTrabalho } from '../ports/UnidadeDeTrabalho';

export interface AceitarPropostaEntrada {
  propostaId: string;
  usuarioId: string;
}

export interface DependenciasAceitarProposta {
  propostas: PropostaRepository;
  projetos: ProjetoConsulta;
  projetoInicio: ProjetoInicio;
  contratos: ContratoRepository;
  unidadeDeTrabalho: UnidadeDeTrabalho;
  notificacoes: NotificationService;
  gerarId: () => string;
}

/**
 * RF05: aceita a proposta, recusa as demais, inicia o projeto e gera o contrato
 * em uma única transação. As notificações saem depois do commit.
 */
export class AceitarProposta {
  constructor(private readonly deps: DependenciasAceitarProposta) {}

  async executar(entrada: AceitarPropostaEntrada): Promise<ContratoDetalhado> {
    const { contrato, notificacoes } = await this.deps.unidadeDeTrabalho.executar(() => this.aceitar(entrada));
    // O aceite já foi confirmado: uma falha no envio não pode desfazê-lo.
    await Promise.allSettled(notificacoes.map((n) => this.deps.notificacoes.notificar(n)));
    return contrato;
  }

  private async aceitar({ propostaId, usuarioId }: AceitarPropostaEntrada) {
    const { propostas, projetos, projetoInicio, contratos, gerarId } = this.deps;

    const proposta = await propostas.buscarPorId(propostaId);
    if (!proposta) throw new ErroNaoEncontrado('Proposta não encontrada.');

    const projeto = await projetos.buscarResumo(proposta.projetoId);
    if (!projeto) throw new ErroNaoEncontrado('Projeto não encontrado.');
    if (projeto.clienteId !== usuarioId) {
      throw new ErroSemPermissao('Somente o cliente dono do projeto pode aceitar propostas.');
    }
    if (projeto.status !== 'ABERTO') throw new ErroConflito('O projeto não está aberto.');
    if (proposta.status !== 'PENDENTE') throw new ErroConflito('Esta proposta não está pendente.');

    const doProjeto = await propostas.listarPorProjeto(projeto.id);
    if (doProjeto.some((p) => p.status === 'ACEITA')) {
      throw new ErroConflito('Este projeto já tem uma proposta aceita.'); // RN04
    }

    // Vem antes das escritas para que dois aceites simultâneos não passem juntos.
    await projetoInicio.iniciar(projeto.id);

    proposta.aceitar();
    await propostas.salvar(proposta);

    const recusadas: Proposta[] = [];
    for (const outra of doProjeto) {
      if (outra.id === proposta.id || outra.status !== 'PENDENTE') continue;
      outra.recusar();
      await propostas.salvar(outra);
      recusadas.push(outra);
    }

    const novo = Contrato.gerar(gerarId(), proposta, projeto);
    await contratos.salvar(novo);
    const contrato = await contratos.buscarPorId(novo.id);
    if (!contrato) throw new Error('O contrato gerado não foi encontrado.');

    const dadosProjeto = { id: projeto.id, titulo: projeto.titulo };
    const notificacoes: Notificacao[] = [
      {
        tipo: 'PROPOSTA_ACEITA',
        destinatarioId: proposta.freelancerId,
        projeto: dadosProjeto,
        detalhes: { valor: proposta.valor, prazoDias: proposta.prazoDias },
      },
      ...recusadas.map(
        (p): Notificacao => ({ tipo: 'PROPOSTA_RECUSADA', destinatarioId: p.freelancerId, projeto: dadosProjeto }),
      ),
    ];
    return { contrato, notificacoes };
  }
}
