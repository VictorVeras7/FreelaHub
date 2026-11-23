import { RequestHandler, Router } from 'express';
import { AceitarProposta } from '../../../application/casos-de-uso/AceitarProposta';
import { ConsultarPagamento } from '../../../application/casos-de-uso/ConsultarPagamento';
import { ConsultarContratos } from '../../../application/casos-de-uso/ConsultarContratos';
import { LiberarPagamento } from '../../../application/casos-de-uso/LiberarPagamento';
import { RealizarPagamento } from '../../../application/casos-de-uso/RealizarPagamento';
import { ContratoDetalhado } from '../../../application/ports/ContratoRepository';
import { PerfilUsuario } from '../../../domain/PerfilUsuario';
import { Pagamento } from '../../../domain/pagamento/Pagamento';
import { obterSolicitante } from './autenticacao';
import { autorizar } from './authMiddleware';

export interface DependenciasContratoController {
  aceitarProposta: AceitarProposta;
  consultarContratos: ConsultarContratos;
  consultarPagamento: ConsultarPagamento;
  realizarPagamento: RealizarPagamento;
  liberarPagamento: LiberarPagamento;
  autenticar: RequestHandler;
}

export function contratoParaJson(contrato: ContratoDetalhado) {
  return { ...contrato, criadoEm: contrato.criadoEm.toISOString() };
}

export function pagamentoParaJson(pagamento: Pagamento) {
  const dados = pagamento.paraDados();
  return { ...dados, atualizadoEm: dados.atualizadoEm.toISOString() };
}

/** Adaptador de entrada dos RF05 e RF06: só traduz HTTP para os casos de uso e de volta. */
export function criarContratoController(deps: DependenciasContratoController): Router {
  const rotas = Router();

  rotas.post('/propostas/:id/aceite', deps.autenticar, autorizar(PerfilUsuario.CLIENTE), async (req, res) => {
    const contrato = await deps.aceitarProposta.executar({
      propostaId: String(req.params.id),
      usuarioId: obterSolicitante(req).id,
    });
    res.status(201).location(`/contratos/${contrato.id}`).json(contratoParaJson(contrato));
  });

  rotas.get('/contratos', deps.autenticar, async (req, res) => {
    const contratos = await deps.consultarContratos.listar(obterSolicitante(req).id);
    res.status(200).json(contratos.map(contratoParaJson));
  });

  rotas.get('/contratos/:id', deps.autenticar, async (req, res) => {
    const contrato = await deps.consultarContratos.buscar(String(req.params.id), obterSolicitante(req).id);
    res.status(200).json(contratoParaJson(contrato));
  });

  rotas.post(
    '/contratos/:id/pagamento',
    deps.autenticar,
    autorizar(PerfilUsuario.CLIENTE),
    async (req, res) => {
      const pagamento = await deps.realizarPagamento.executar(String(req.params.id), obterSolicitante(req).id);
      res.status(200).json(pagamentoParaJson(pagamento));
    },
  );

  rotas.get('/contratos/:id/pagamento', deps.autenticar, async (req, res) => {
    const pagamento = await deps.consultarPagamento.executar(String(req.params.id), obterSolicitante(req).id);
    res.status(200).json(pagamentoParaJson(pagamento));
  });

  rotas.post(
    '/contratos/:id/confirmacao-entrega',
    deps.autenticar,
    autorizar(PerfilUsuario.CLIENTE),
    async (req, res) => {
      const pagamento = await deps.liberarPagamento.executar(String(req.params.id), obterSolicitante(req).id);
      res.status(200).json(pagamentoParaJson(pagamento));
    },
  );

  return rotas;
}
