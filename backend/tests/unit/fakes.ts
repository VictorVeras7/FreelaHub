import { SenhaHasher } from '../../src/application/ports/SenhaHasher';
import { TokenService, UsuarioIdentificado } from '../../src/application/ports/TokenService';
import { UsuarioRepository } from '../../src/application/ports/UsuarioRepository';
import { ErroConflito, ErroNaoAutenticado } from '../../src/domain/erros';
import { NovoUsuario, Usuario } from '../../src/domain/Usuario';

export class UsuarioRepositoryEmMemoria implements UsuarioRepository {
  readonly usuarios: Usuario[] = [];

  async buscarPorEmail(email: string) {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }

  async buscarPorId(id: string) {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async incluir(novo: NovoUsuario) {
    if (this.usuarios.some((u) => u.email === novo.email)) {
      throw new ErroConflito('Já existe um usuário com este e-mail.');
    }
    const usuario = Usuario.restaurar({ id: `id-${this.usuarios.length + 1}`, ...novo });
    this.usuarios.push(usuario);
    return usuario;
  }
}

export class SenhaHasherFalso implements SenhaHasher {
  async gerar(senha: string) {
    return `hash:${senha}`;
  }

  async comparar(senha: string, hash: string) {
    return hash === `hash:${senha}`;
  }
}

export class TokenServiceFalso implements TokenService {
  emitir(usuario: UsuarioIdentificado) {
    return `${usuario.id}|${usuario.perfil}`;
  }

  verificar(token: string): UsuarioIdentificado {
    const [id, perfil] = token.split('|');
    if (!id || !perfil) throw new ErroNaoAutenticado('Token inválido ou expirado.');
    return { id, perfil: perfil as UsuarioIdentificado['perfil'] };
  }
}
