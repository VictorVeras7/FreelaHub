import { describe, expect, it } from 'vitest';
import { ErroValidacao } from '../../src/domain/erros';
import { PERFIS_CADASTRO_PUBLICO, PERFIS_USUARIO, PerfilUsuario } from '../../src/domain/PerfilUsuario';
import { Usuario, validarSenha } from '../../src/domain/Usuario';

const dados = { id: '1', nome: ' Ana ', email: ' ANA@Exemplo.com ', senhaHash: 'hash', perfil: PerfilUsuario.CLIENTE };

describe('Usuario e perfis', () => {
  it('possui exatamente os três perfis da RN01', () => {
    expect([...PERFIS_USUARIO].sort()).toEqual(['ADMINISTRADOR', 'CLIENTE', 'FREELANCER']);
  });

  it('não oferece Administrador no cadastro público', () => {
    expect(PERFIS_CADASTRO_PUBLICO).not.toContain(PerfilUsuario.ADMINISTRADOR);
  });

  it('cria usuário com um único perfil e dados normalizados', () => {
    const usuario = Usuario.restaurar(dados);
    expect(usuario).toMatchObject({ nome: 'Ana', email: 'ana@exemplo.com', perfil: 'CLIENTE' });
  });

  it('é imutável depois de criado', () => {
    const usuario = Usuario.restaurar(dados);
    expect(() => {
      (usuario as { perfil: string }).perfil = 'ADMINISTRADOR';
    }).toThrow(TypeError);
  });

  it.each([
    ['perfil inexistente', { perfil: 'GERENTE' as PerfilUsuario }],
    ['nome vazio', { nome: '   ' }],
    ['e-mail inválido', { email: 'sem-arroba' }],
    ['hash vazio', { senhaHash: '' }],
  ])('recusa %s', (_caso, alteracao) => {
    expect(() => Usuario.restaurar({ ...dados, ...alteracao })).toThrow(ErroValidacao);
  });

  it('recusa senha curta e senha acima de 72 bytes', () => {
    expect(() => validarSenha('1234567')).toThrow(ErroValidacao);
    expect(() => validarSenha('a'.repeat(73))).toThrow(ErroValidacao);
    expect(() => validarSenha('é'.repeat(37))).toThrow(ErroValidacao);
    expect(() => validarSenha('a'.repeat(72))).not.toThrow();
  });
});
