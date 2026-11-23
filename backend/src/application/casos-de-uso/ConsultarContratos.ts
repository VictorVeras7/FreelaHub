import { ErroNaoEncontrado, ErroSemPermissao } from '../../domain/erros';
import { ContratoDetalhado, ContratoRepository } from '../ports/ContratoRepository';

/** Lista e detalha os contratos de que o usuário participa. */
export class ConsultarContratos {
  constructor(private readonly contratos: ContratoRepository) {}

  listar(usuarioId: string): Promise<ContratoDetalhado[]> {
    return this.contratos.listarPorUsuario(usuarioId);
  }

  async buscar(contratoId: string, usuarioId: string): Promise<ContratoDetalhado> {
    const contrato = await this.contratos.buscarPorId(contratoId);
    if (!contrato) throw new ErroNaoEncontrado('Contrato não encontrado.');
    if (contrato.clienteId !== usuarioId && contrato.freelancerId !== usuarioId) {
      throw new ErroSemPermissao('Você não participa deste contrato.');
    }
    return contrato;
  }
}
