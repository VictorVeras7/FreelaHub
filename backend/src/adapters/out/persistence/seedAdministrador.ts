import { Pool } from 'pg';
import { SenhaHasher } from '../../../application/ports/SenhaHasher';
import { PerfilUsuario } from '../../../domain/PerfilUsuario';
import { Usuario, validarEmail, validarSenha } from '../../../domain/Usuario';

export interface CredenciaisAdministrador {
  email: string;
  senha: string;
}

/** Carga idempotente: só insere quando ainda não houver Administrador. */
export async function carregarAdministrador(
  pool: Pool,
  hasher: SenhaHasher,
  credenciais: CredenciaisAdministrador,
): Promise<void> {
  const email = validarEmail(credenciais.email);
  validarSenha(credenciais.senha);

  const existente = await pool.query(`SELECT 1 FROM usuarios WHERE perfil = $1 LIMIT 1`, [
    PerfilUsuario.ADMINISTRADOR,
  ]);
  if (existente.rowCount) {
    return;
  }

  const admin = Usuario.preparar({
    nome: 'Administrador',
    email,
    senhaHash: await hasher.gerar(credenciais.senha),
    perfil: PerfilUsuario.ADMINISTRADOR,
  });

  const inserido = await pool.query(
    `INSERT INTO usuarios (nome, email, senha, perfil)
     SELECT $1, $2, $3, $4
     WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE perfil = $5)
     ON CONFLICT (email) DO NOTHING`,
    [admin.nome, admin.email, admin.senhaHash, admin.perfil, PerfilUsuario.ADMINISTRADOR],
  );

  if (!inserido.rowCount) {
    const confirmado = await pool.query(`SELECT 1 FROM usuarios WHERE perfil = $1 LIMIT 1`, [
      PerfilUsuario.ADMINISTRADOR,
    ]);
    if (!confirmado.rowCount) {
      throw new Error('ADMIN_EMAIL já pertence a um usuário que não é Administrador.');
    }
  }
}
