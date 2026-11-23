import { NovoUsuario, Usuario } from '../../domain/Usuario';

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Lança ErroConflito quando o e-mail já estiver em uso. */
  incluir(usuario: NovoUsuario): Promise<Usuario>;
}
