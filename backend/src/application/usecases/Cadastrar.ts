import { ErroConflito, ErroValidacao } from '../../domain/erros';
import { ehPerfilUsuario, PERFIS_CADASTRO_PUBLICO, PerfilUsuario } from '../../domain/PerfilUsuario';
import { Usuario, validarEmail, validarSenha } from '../../domain/Usuario';
import { SenhaHasher } from '../ports/SenhaHasher';
import { UsuarioRepository } from '../ports/UsuarioRepository';

export interface EntradaCadastrar {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
}

export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export function paraUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
}

export class Cadastrar {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: SenhaHasher,
  ) {}

  async executar(entrada: EntradaCadastrar): Promise<UsuarioPublico> {
    if (!ehPerfilUsuario(entrada.perfil) || !PERFIS_CADASTRO_PUBLICO.includes(entrada.perfil)) {
      throw new ErroValidacao('O tipo de conta deve ser Cliente ou Freelancer.');
    }
    const email = validarEmail(entrada.email);
    validarSenha(entrada.senha);

    if (await this.usuarios.buscarPorEmail(email)) {
      throw new ErroConflito('Já existe um usuário com este e-mail.');
    }

    const senhaHash = await this.hasher.gerar(entrada.senha);
    const novoUsuario = Usuario.preparar({ nome: entrada.nome, email, senhaHash, perfil: entrada.perfil });
    return paraUsuarioPublico(await this.usuarios.incluir(novoUsuario));
  }
}
