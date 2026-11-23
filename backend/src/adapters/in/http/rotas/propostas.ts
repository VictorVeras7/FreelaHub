import { RequestHandler, Router } from 'express';
import { EnviarProposta } from '../../../../application/casos-de-uso/EnviarProposta';
import { ListarPropostasDoProjeto } from '../../../../application/casos-de-uso/ListarPropostasDoProjeto';
import { DadosProposta } from '../../../../domain/proposta/Proposta';
import { obterSolicitante } from '../autenticacao';

export interface DependenciasRotasDePropostas {
  enviarProposta: EnviarProposta;
  listarPropostasDoProjeto: ListarPropostasDoProjeto;
  /** Middleware JWT da fatia RF01: grava o usuário em `req.usuario`. */
  autenticar: RequestHandler;
}

/** Representação JSON de uma proposta nas respostas da API (docs/api/propostas.md). */
export function propostaParaJson(proposta: DadosProposta) {
  return {
    id: proposta.id,
    projetoId: proposta.projetoId,
    freelancerId: proposta.freelancerId,
    valor: proposta.valor,
    prazoDias: proposta.prazoDias,
    mensagem: proposta.mensagem,
    status: proposta.status,
    criadaEm: proposta.criadaEm.toISOString(),
  };
}

/**
 * Adaptador de entrada HTTP da fatia de propostas (RF04).
 * Os controllers só traduzem HTTP para o caso de uso e de volta; nenhuma regra de negócio fica aqui.
 */
export function criarRotasDePropostas(deps: DependenciasRotasDePropostas): Router {
  const rotas = Router();

  rotas.post('/projetos/:projetoId/propostas', deps.autenticar, async (req, res) => {
    const corpo = (req.body ?? {}) as Record<string, unknown>;
    const proposta = await deps.enviarProposta.executar({
      projetoId: String(req.params.projetoId),
      solicitante: obterSolicitante(req),
      valor: corpo.valor,
      prazoDias: corpo.prazoDias,
      mensagem: corpo.mensagem,
    });

    res
      .status(201)
      .location(`/projetos/${proposta.projetoId}/propostas/${proposta.id}`)
      .json(propostaParaJson(proposta));
  });

  rotas.get('/projetos/:projetoId/propostas', deps.autenticar, async (req, res) => {
    const propostas = await deps.listarPropostasDoProjeto.executar({
      projetoId: String(req.params.projetoId),
      solicitante: obterSolicitante(req),
    });

    res.status(200).json(propostas.map(propostaParaJson));
  });

  return rotas;
}
