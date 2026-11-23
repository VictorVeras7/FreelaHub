export const PerfilUsuario = {
  CLIENTE: 'CLIENTE',
  FREELANCER: 'FREELANCER',
  ADMINISTRADOR: 'ADMINISTRADOR',
} as const;

export type PerfilUsuario = (typeof PerfilUsuario)[keyof typeof PerfilUsuario];

export const PERFIS_USUARIO: readonly PerfilUsuario[] = Object.values(PerfilUsuario);

/** RN01: o perfil Administrador não pode ser escolhido no cadastro público. */
export const PERFIS_CADASTRO_PUBLICO: readonly PerfilUsuario[] = [
  PerfilUsuario.CLIENTE,
  PerfilUsuario.FREELANCER,
];

export function ehPerfilUsuario(valor: unknown): valor is PerfilUsuario {
  return typeof valor === 'string' && (PERFIS_USUARIO as readonly string[]).includes(valor);
}
