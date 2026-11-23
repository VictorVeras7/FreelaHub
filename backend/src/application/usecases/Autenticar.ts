import { ErroNaoAutenticado } from '../../domain/erros';
import { normalizarEmail, senhaDentroDoLimite } from '../../domain/Usuario';
import { SenhaHasher } from '../ports/SenhaHasher';
import { TokenService } from '../ports/TokenService';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { paraUsuarioPublico, UsuarioPublico } from './Cadastrar';

export interface EntradaAutenticar {
  email: string;
  senha: string;
}

export interface SessaoAutenticada {
  token: string;
  usuario: UsuarioPublico;
}

const MENSAGEM_CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

export class Autenticar {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: SenhaHasher,
    private readonly tokens: TokenService,
  ) {}

  async executar(entrada: EntradaAutenticar): Promise<SessaoAutenticada> {
    if (entrada.email.length === 0 || entrada.senha.length === 0 || !senhaDentroDoLimite(entrada.senha)) {
      throw new ErroNaoAutenticado(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    const usuario = await this.usuarios.buscarPorEmail(normalizarEmail(entrada.email));
    if (!usuario) {
      // Mantém custo de hash semelhante para não revelar pelo tempo se o e-mail existe.
      await this.hasher.gerar(entrada.senha);
      throw new ErroNaoAutenticado(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    if (!(await this.hasher.comparar(entrada.senha, usuario.senhaHash))) {
      throw new ErroNaoAutenticado(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    const token = this.tokens.emitir({ id: usuario.id, perfil: usuario.perfil });
    return { token, usuario: paraUsuarioPublico(usuario) };
  }
}
