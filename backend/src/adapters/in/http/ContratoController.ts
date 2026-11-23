import { RequestHandler, Router } from 'express';
import { AceitarProposta } from '../../../application/casos-de-uso/AceitarProposta';
import { ConsultarContratos } from '../../../application/casos-de-uso/ConsultarContratos';
import { ContratoDetalhado } from '../../../application/ports/ContratoRepository';
import { PerfilUsuario } from '../../../domain/PerfilUsuario';
import { obterSolicitante } from './autenticacao';
import { autorizar } from './authMiddleware';

export interface DependenciasContratoController {
  aceitarProposta: AceitarProposta;
  consultarContratos: ConsultarContratos;
  autenticar: RequestHandler;
}

export function contratoParaJson(contrato: ContratoDetalhado) {
  return { ...contrato, criadoEm: contrato.criadoEm.toISOString() };
}

/** Adaptador de entrada do RF05: só traduz HTTP para os casos de uso e de volta. */
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

  return rotas;
}
