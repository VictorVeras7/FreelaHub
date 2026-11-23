import { DadosProjeto, Projeto } from '../../domain/projeto/Projeto';
import { UsuarioRepository } from '../ports/UsuarioRepository';

/** Projeto como é devolvido pelos casos de uso da fatia: os dados da entidade e o nome do cliente. */
export interface ProjetoDetalhado extends DadosProjeto {
  clienteNome: string;
}

/** Completa os projetos com o nome do cliente, consultando cada cliente uma única vez. */
export async function detalharProjetos(
  projetos: Projeto[],
  usuarios: UsuarioRepository,
): Promise<ProjetoDetalhado[]> {
  const ids = [...new Set(projetos.map((projeto) => projeto.clienteId))];
  const clientes = await Promise.all(ids.map((id) => usuarios.buscarPorId(id)));
  const nomes = new Map(ids.map((id, i) => [id, clientes[i]?.nome ?? '']));
  return projetos.map((projeto) => ({ ...projeto.paraDados(), clienteNome: nomes.get(projeto.clienteId) ?? '' }));
}

export async function detalharProjeto(projeto: Projeto, usuarios: UsuarioRepository): Promise<ProjetoDetalhado> {
  const [detalhado] = await detalharProjetos([projeto], usuarios);
  return detalhado;
}
