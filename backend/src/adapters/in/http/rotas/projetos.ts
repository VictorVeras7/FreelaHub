import { RequestHandler, Router } from 'express';
import { CancelarProjeto } from '../../../../application/casos-de-uso/CancelarProjeto';
import { ProjetoDetalhado } from '../../../../application/casos-de-uso/detalharProjetos';
import { ListarMeusProjetos } from '../../../../application/casos-de-uso/ListarMeusProjetos';
import { ListarProjetos } from '../../../../application/casos-de-uso/ListarProjetos';
import { ObterProjeto } from '../../../../application/casos-de-uso/ObterProjeto';
import { PublicarProjeto } from '../../../../application/casos-de-uso/PublicarProjeto';
import { obterSolicitante } from '../autenticacao';

export interface DependenciasRotasDeProjetos {
  publicarProjeto: PublicarProjeto;
  listarProjetos: ListarProjetos;
  listarMeusProjetos: ListarMeusProjetos;
  obterProjeto: ObterProjeto;
  cancelarProjeto: CancelarProjeto;
  /** Middleware JWT da fatia RF01: grava o usuário em `req.usuario`. */
  autenticar: RequestHandler;
}

/** Representação JSON de um projeto nas respostas da API (docs/api/projetos.md). */
export function projetoParaJson(projeto: ProjetoDetalhado) {
  return {
    id: projeto.id,
    clienteId: projeto.clienteId,
    clienteNome: projeto.clienteNome,
    titulo: projeto.titulo,
    descricao: projeto.descricao,
    orcamento: projeto.orcamento,
    prazoDesejado: projeto.prazoDesejado,
    habilidades: projeto.habilidades,
    status: projeto.status,
    criadoEm: projeto.criadoEm.toISOString(),
  };
}

/** Converte um parâmetro de query string em número; texto que não é número vira NaN e é recusado pelo caso de uso. */
function numeroDaQuery(valor: unknown): unknown {
  if (valor === undefined || valor === '') return undefined;
  return typeof valor === 'string' ? Number(valor) : valor;
}

/**
 * Adaptador de entrada HTTP da fatia de projetos (RF02 e RF03).
 * Os controllers só traduzem HTTP para o caso de uso e de volta; nenhuma regra de negócio fica aqui.
 */
export function criarRotasDeProjetos(deps: DependenciasRotasDeProjetos): Router {
  const rotas = Router();

  rotas.post('/projetos', deps.autenticar, async (req, res) => {
    const corpo = (req.body ?? {}) as Record<string, unknown>;
    const projeto = await deps.publicarProjeto.executar({
      solicitante: obterSolicitante(req),
      titulo: corpo.titulo,
      descricao: corpo.descricao,
      orcamento: corpo.orcamento,
      prazoDesejado: corpo.prazoDesejado,
      habilidades: corpo.habilidades,
    });

    res.status(201).location(`/projetos/${projeto.id}`).json(projetoParaJson(projeto));
  });

  rotas.get('/projetos', deps.autenticar, async (req, res) => {
    const projetos = await deps.listarProjetos.executar({
      habilidade: req.query.habilidade,
      orcamentoMin: numeroDaQuery(req.query.orcamentoMin),
      orcamentoMax: numeroDaQuery(req.query.orcamentoMax),
    });

    res.status(200).json(projetos.map(projetoParaJson));
  });

  // Registrada antes de /projetos/:projetoId para que "meus" não seja lido como id.
  rotas.get('/projetos/meus', deps.autenticar, async (req, res) => {
    const projetos = await deps.listarMeusProjetos.executar({ solicitante: obterSolicitante(req) });

    res.status(200).json(projetos.map(projetoParaJson));
  });

  rotas.get('/projetos/:projetoId', deps.autenticar, async (req, res) => {
    const projeto = await deps.obterProjeto.executar({ projetoId: String(req.params.projetoId) });

    res.status(200).json(projetoParaJson(projeto));
  });

  rotas.post('/projetos/:projetoId/cancelamento', deps.autenticar, async (req, res) => {
    const projeto = await deps.cancelarProjeto.executar({
      projetoId: String(req.params.projetoId),
      solicitante: obterSolicitante(req),
    });

    res.status(200).json(projetoParaJson(projeto));
  });

  return rotas;
}
