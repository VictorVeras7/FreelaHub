import { beforeEach, describe, expect, it } from 'vitest';
import { BcryptSenhaHasher } from '../../src/adapters/out/security/BcryptSenhaHasher';
import { Autenticar } from '../../src/application/usecases/Autenticar';
import { Cadastrar } from '../../src/application/usecases/Cadastrar';
import { ErroConflito, ErroNaoAutenticado, ErroValidacao } from '../../src/domain/erros';
import { SenhaHasherFalso, TokenServiceFalso, UsuarioRepositoryEmMemoria } from './fakes';

const entrada = { nome: 'Ana', email: 'ana@exemplo.com', senha: 'senha-segura', perfil: 'CLIENTE' };

describe('Cadastrar', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let cadastrar: Cadastrar;

  beforeEach(() => {
    repositorio = new UsuarioRepositoryEmMemoria();
    cadastrar = new Cadastrar(repositorio, new SenhaHasherFalso());
  });

  it.each(['CLIENTE', 'FREELANCER'])('aceita o perfil %s e não retorna a senha', async (perfil) => {
    const usuario = await cadastrar.executar({ ...entrada, perfil });
    expect(usuario).toEqual({ id: 'id-1', nome: 'Ana', email: 'ana@exemplo.com', perfil });
  });

  it('recusa e-mail repetido, mesmo com caixa diferente, sem gravar', async () => {
    await cadastrar.executar(entrada);
    await expect(cadastrar.executar({ ...entrada, email: 'ANA@exemplo.com' })).rejects.toThrow(ErroConflito);
    expect(repositorio.usuarios).toHaveLength(1);
  });

  it.each(['ADMINISTRADOR', 'GERENTE', ''])('recusa o perfil "%s"', async (perfil) => {
    await expect(cadastrar.executar({ ...entrada, perfil })).rejects.toThrow(ErroValidacao);
    expect(repositorio.usuarios).toHaveLength(0);
  });

  it('persiste hash bcrypt diferente da senha', async () => {
    const comBcrypt = new Cadastrar(repositorio, new BcryptSenhaHasher(4));
    await comBcrypt.executar(entrada);
    const { senhaHash } = repositorio.usuarios[0];
    expect(senhaHash).not.toBe(entrada.senha);
    expect(senhaHash).toMatch(/^\$2[aby]\$/);
  });
});

describe('Autenticar', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let autenticar: Autenticar;

  beforeEach(async () => {
    repositorio = new UsuarioRepositoryEmMemoria();
    const hasher = new SenhaHasherFalso();
    await new Cadastrar(repositorio, hasher).executar(entrada);
    autenticar = new Autenticar(repositorio, hasher, new TokenServiceFalso());
  });

  it('emite token com identificador e perfil', async () => {
    const sessao = await autenticar.executar({ email: 'ANA@exemplo.com', senha: entrada.senha });
    expect(sessao.token).toBe('id-1|CLIENTE');
    expect(sessao.usuario).not.toHaveProperty('senhaHash');
  });

  it('usa o mesmo erro para senha incorreta e e-mail inexistente', async () => {
    const senhaErrada = await autenticar.executar({ email: entrada.email, senha: 'outra-senha' }).catch((e) => e);
    const semUsuario = await autenticar.executar({ email: 'x@exemplo.com', senha: entrada.senha }).catch((e) => e);
    expect(senhaErrada).toBeInstanceOf(ErroNaoAutenticado);
    expect(semUsuario).toBeInstanceOf(ErroNaoAutenticado);
    expect(senhaErrada.message).toBe(semUsuario.message);
  });

  it('recusa credenciais vazias e senha acima do limite do bcrypt', async () => {
    await expect(autenticar.executar({ email: '', senha: '' })).rejects.toThrow(ErroNaoAutenticado);
    await expect(autenticar.executar({ email: entrada.email, senha: 'a'.repeat(73) })).rejects.toThrow(
      ErroNaoAutenticado,
    );
  });
});
