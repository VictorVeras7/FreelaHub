import { PerfilUsuario } from '../../domain/PerfilUsuario';

export interface UsuarioIdentificado {
  readonly id: string;
  readonly perfil: PerfilUsuario;
}

export interface TokenService {
  emitir(usuario: UsuarioIdentificado): string;
  /** Lança ErroNaoAutenticado quando o token não for válido. */
  verificar(token: string): UsuarioIdentificado;
}
