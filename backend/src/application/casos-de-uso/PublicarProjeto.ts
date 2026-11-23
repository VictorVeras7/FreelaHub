import { ErroSemPermissao } from '../../domain/erros';
import { PerfilUsuario } from '../../domain/PerfilUsuario';
import { Projeto } from '../../domain/projeto/Projeto';
import { ProjetoRepository } from '../ports/ProjetoRepository';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { Solicitante } from '../Solicitante';
import { detalharProjeto, ProjetoDetalhado } from './detalharProjetos';

export interface PublicarProjetoEntrada {
  solicitante: Solicitante;
  titulo: unknown;
  descricao: unknown;
  orcamento: unknown;
  prazoDesejado?: unknown;
  habilidades?: unknown;
}

/** RF02: o cliente publica um projeto, que nasce com status ABERTO. */
export class PublicarProjeto {
  constructor(
    private readonly projetos: ProjetoRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly gerarId: () => string,
  ) {}

  async executar(entrada: PublicarProjetoEntrada): Promise<ProjetoDetalhado> {
    const { solicitante } = entrada;
    if (solicitante.perfil !== PerfilUsuario.CLIENTE) {
      throw new ErroSemPermissao('Somente clientes podem publicar projetos.');
    }

    // O status nunca vem da entrada: Projeto.criar sempre gera um projeto ABERTO.
    const projeto = Projeto.criar({
      id: this.gerarId(),
      clienteId: solicitante.id,
      titulo: entrada.titulo,
      descricao: entrada.descricao,
      orcamento: entrada.orcamento,
      prazoDesejado: entrada.prazoDesejado,
      habilidades: entrada.habilidades,
    });

    await this.projetos.salvar(projeto);
    return detalharProjeto(projeto, this.usuarios);
  }
}
