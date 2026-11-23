import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { JwtTokenService } from '../../src/adapters/out/security/JwtTokenService';
import { ErroNaoAutenticado } from '../../src/domain/erros';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const usuario = { id: 'abc', perfil: PerfilUsuario.FREELANCER };

describe('JwtTokenService', () => {
  const servico = new JwtTokenService(SEGREDO, 60);

  it('emite e verifica token com identificador e perfil', () => {
    expect(servico.verificar(servico.emitir(usuario))).toEqual(usuario);
  });

  it('aplica o tempo de expiração configurado', () => {
    const { exp, iat } = jwt.decode(servico.emitir(usuario)) as jwt.JwtPayload;
    expect(exp! - iat!).toBe(60);
  });

  it('recusa token expirado', () => {
    const token = jwt.sign({ perfil: usuario.perfil }, SEGREDO, { subject: 'abc', expiresIn: -1 });
    expect(() => servico.verificar(token)).toThrow(ErroNaoAutenticado);
  });

  it('recusa assinatura inválida e token malformado', () => {
    const outro = new JwtTokenService('outro-segredo-com-mais-de-32-caracteres', 60);
    expect(() => servico.verificar(outro.emitir(usuario))).toThrow(ErroNaoAutenticado);
    expect(() => servico.verificar('nao-e-jwt')).toThrow(ErroNaoAutenticado);
  });

  it('recusa algoritmo none e algoritmo diferente de HS256', () => {
    const none = jwt.sign({ perfil: usuario.perfil }, '', { subject: 'abc', algorithm: 'none' });
    const hs512 = jwt.sign({ perfil: usuario.perfil }, SEGREDO, { subject: 'abc', algorithm: 'HS512' });
    expect(() => servico.verificar(none)).toThrow(ErroNaoAutenticado);
    expect(() => servico.verificar(hs512)).toThrow(ErroNaoAutenticado);
  });

  it('recusa token sem perfil válido ou sem subject', () => {
    const semPerfil = jwt.sign({ perfil: 'GERENTE' }, SEGREDO, { subject: 'abc' });
    const semSubject = jwt.sign({ perfil: usuario.perfil }, SEGREDO);
    expect(() => servico.verificar(semPerfil)).toThrow(ErroNaoAutenticado);
    expect(() => servico.verificar(semSubject)).toThrow(ErroNaoAutenticado);
  });

  it('não inicia com segredo curto', () => {
    expect(() => new JwtTokenService('curto', 60)).toThrow();
  });
});
