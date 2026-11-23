import jwt from 'jsonwebtoken';
import { TokenService, UsuarioIdentificado } from '../../../application/ports/TokenService';
import { ErroNaoAutenticado } from '../../../domain/erros';
import { ehPerfilUsuario } from '../../../domain/PerfilUsuario';

const ALGORITMO = 'HS256';
const TAMANHO_MINIMO_SEGREDO = 32;

export class JwtTokenService implements TokenService {
  constructor(
    private readonly segredo: string,
    private readonly expiracaoSegundos: number,
  ) {
    if (segredo.length < TAMANHO_MINIMO_SEGREDO) {
      throw new Error(`JWT_SECRET deve ter pelo menos ${TAMANHO_MINIMO_SEGREDO} caracteres.`);
    }
    if (!Number.isInteger(expiracaoSegundos) || expiracaoSegundos <= 0) {
      throw new Error('O tempo de expiração do token deve ser um inteiro positivo.');
    }
  }

  emitir(usuario: UsuarioIdentificado): string {
    return jwt.sign({ perfil: usuario.perfil }, this.segredo, {
      algorithm: ALGORITMO,
      subject: usuario.id,
      expiresIn: this.expiracaoSegundos,
    });
  }

  verificar(token: string): UsuarioIdentificado {
    try {
      const conteudo = jwt.verify(token, this.segredo, { algorithms: [ALGORITMO] });
      if (typeof conteudo !== 'string' && conteudo.sub && ehPerfilUsuario(conteudo.perfil)) {
        return { id: conteudo.sub, perfil: conteudo.perfil };
      }
    } catch {
      // Token expirado, malformado ou com assinatura inválida recebe a mesma resposta.
    }
    throw new ErroNaoAutenticado('Token inválido ou expirado.');
  }
}
