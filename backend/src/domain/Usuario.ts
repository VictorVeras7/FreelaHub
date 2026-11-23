import { ErroValidacao } from './erros';
import { ehPerfilUsuario, PerfilUsuario } from './PerfilUsuario';

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MAXIMO_NOME = 120;
const TAMANHO_MAXIMO_EMAIL = 254;
const TAMANHO_MINIMO_SENHA = 8;
/** O bcrypt considera apenas os primeiros 72 bytes da senha. */
const BYTES_MAXIMOS_SENHA = 72;

export interface NovoUsuario {
  readonly nome: string;
  readonly email: string;
  readonly senhaHash: string;
  readonly perfil: PerfilUsuario;
}

export interface DadosUsuario extends NovoUsuario {
  readonly id: string;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function senhaDentroDoLimite(senha: string): boolean {
  return new TextEncoder().encode(senha).length <= BYTES_MAXIMOS_SENHA;
}

export function validarSenha(senha: string): void {
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    throw new ErroValidacao(`A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }
  if (!senhaDentroDoLimite(senha)) {
    throw new ErroValidacao(`A senha deve ter no máximo ${BYTES_MAXIMOS_SENHA} bytes.`);
  }
}

export function validarEmail(email: string): string {
  const normalizado = normalizarEmail(email);
  if (normalizado.length > TAMANHO_MAXIMO_EMAIL || !FORMATO_EMAIL.test(normalizado)) {
    throw new ErroValidacao('Informe um e-mail válido.');
  }
  return normalizado;
}

function validarNovoUsuario(dados: NovoUsuario): NovoUsuario {
  const nome = dados.nome.trim();
  if (nome.length === 0 || nome.length > TAMANHO_MAXIMO_NOME) {
    throw new ErroValidacao(`O nome é obrigatório e deve ter até ${TAMANHO_MAXIMO_NOME} caracteres.`);
  }
  if (dados.senhaHash.length === 0) {
    throw new ErroValidacao('O hash da senha é obrigatório.');
  }
  if (!ehPerfilUsuario(dados.perfil)) {
    throw new ErroValidacao('Perfil de usuário inválido.');
  }
  return { nome, email: validarEmail(dados.email), senhaHash: dados.senhaHash, perfil: dados.perfil };
}

export class Usuario {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly senhaHash: string;
  readonly perfil: PerfilUsuario;

  private constructor(dados: DadosUsuario) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.email = dados.email;
    this.senhaHash = dados.senhaHash;
    this.perfil = dados.perfil;
    Object.freeze(this);
  }

  /** Valida os dados de um usuário que ainda será persistido. */
  static preparar(dados: NovoUsuario): NovoUsuario {
    return validarNovoUsuario(dados);
  }

  static restaurar(dados: DadosUsuario): Usuario {
    if (dados.id.length === 0) {
      throw new ErroValidacao('O identificador do usuário é obrigatório.');
    }
    return new Usuario({ id: dados.id, ...validarNovoUsuario(dados) });
  }
}
