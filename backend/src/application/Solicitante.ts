import { PerfilUsuario } from '../domain/PerfilUsuario';

export type { PerfilUsuario };

/**
 * Usuário que dispara um caso de uso, já identificado pelo adaptador de entrada
 * (middleware JWT, ADR-002). A aplicação não conhece o formato do token.
 */
export interface Solicitante {
  readonly id: string;
  readonly perfil: PerfilUsuario;
}
