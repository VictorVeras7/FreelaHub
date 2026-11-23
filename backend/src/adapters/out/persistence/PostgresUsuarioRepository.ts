import { Pool } from 'pg';
import { UsuarioRepository } from '../../../application/ports/UsuarioRepository';
import { ErroConflito } from '../../../domain/erros';
import { PerfilUsuario } from '../../../domain/PerfilUsuario';
import { NovoUsuario, Usuario } from '../../../domain/Usuario';

const VIOLACAO_UNICIDADE = '23505';
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUNAS = 'id, nome, email, senha, perfil';

interface LinhaUsuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
}

function paraEntidade(linha: LinhaUsuario): Usuario {
  return Usuario.restaurar({
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha,
    perfil: linha.perfil,
  });
}

export class PostgresUsuarioRepository implements UsuarioRepository {
  constructor(private readonly pool: Pool) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<LinhaUsuario>(
      `SELECT ${COLUNAS} FROM usuarios WHERE email = $1`,
      [email],
    );
    return rows[0] ? paraEntidade(rows[0]) : null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    if (!FORMATO_UUID.test(id)) {
      return null;
    }
    const { rows } = await this.pool.query<LinhaUsuario>(
      `SELECT ${COLUNAS} FROM usuarios WHERE id = $1`,
      [id],
    );
    return rows[0] ? paraEntidade(rows[0]) : null;
  }

  async incluir(usuario: NovoUsuario): Promise<Usuario> {
    try {
      const { rows } = await this.pool.query<LinhaUsuario>(
        `INSERT INTO usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}`,
        [usuario.nome, usuario.email, usuario.senhaHash, usuario.perfil],
      );
      return paraEntidade(rows[0]);
    } catch (erro) {
      if ((erro as { code?: string }).code === VIOLACAO_UNICIDADE) {
        throw new ErroConflito('Já existe um usuário com este e-mail.');
      }
      throw erro;
    }
  }
}
