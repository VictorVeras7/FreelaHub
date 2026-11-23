import { ErroSemPermissao } from '../../domain/erros';
import { PerfilUsuario } from '../../domain/PerfilUsuario';
import { ProjetoRepository } from '../ports/ProjetoRepository';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { Solicitante } from '../Solicitante';
import { detalharProjetos, ProjetoDetalhado } from './detalharProjetos';

export interface ListarMeusProjetosEntrada {
  solicitante: Solicitante;
}

/** Projetos publicados pelo cliente autenticado, em qualquer status (tela "Meus projetos"). */
export class ListarMeusProjetos {
  constructor(
    private readonly projetos: ProjetoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(entrada: ListarMeusProjetosEntrada): Promise<ProjetoDetalhado[]> {
    if (entrada.solicitante.perfil !== PerfilUsuario.CLIENTE) {
      throw new ErroSemPermissao('Somente clientes têm projetos publicados.');
    }
    const projetos = await this.projetos.listarPorCliente(entrada.solicitante.id);
    return detalharProjetos(projetos, this.usuarios);
  }
}
