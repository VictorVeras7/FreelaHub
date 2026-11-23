import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api';
import type { Credenciais, Perfil, Usuario } from '@/api/ports';
import { EVENTO_SESSAO_EXPIRADA, gravarSessao, lerSessao, limparSessao } from './armazenamento';

interface SessaoValor {
  usuario: Usuario | null;
  avisoExpirada: boolean;
  entrar: (credenciais: Credenciais) => Promise<Usuario>;
  sair: () => void;
}

const SessaoContext = createContext<SessaoValor | null>(null);

export function useSessao(): SessaoValor {
  const valor = useContext(SessaoContext);
  if (!valor) throw new Error('useSessao precisa estar dentro de SessaoProvider.');
  return valor;
}

export const rotaInicial = (perfil: Perfil): string =>
  perfil === 'CLIENTE' ? '/meus-projetos' : perfil === 'FREELANCER' ? '/projetos' : '/contratos';

export function SessaoProvider({ children }: { children: ReactNode }) {
  const clienteQuery = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(() => lerSessao()?.usuario ?? null);
  const [avisoExpirada, setAvisoExpirada] = useState(false);

  useEffect(() => {
    const expirou = () => {
      setUsuario(null);
      setAvisoExpirada(true);
      clienteQuery.clear();
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
  }, [clienteQuery]);

  const entrar = useCallback(
    async (credenciais: Credenciais) => {
      const sessao = await api.auth.entrar(credenciais);
      gravarSessao(sessao);
      clienteQuery.clear();
      setAvisoExpirada(false);
      setUsuario(sessao.usuario);
      return sessao.usuario;
    },
    [clienteQuery],
  );

  const sair = useCallback(() => {
    limparSessao();
    clienteQuery.clear();
    setAvisoExpirada(false);
    setUsuario(null);
  }, [clienteQuery]);

  const valor = useMemo(() => ({ usuario, avisoExpirada, entrar, sair }), [usuario, avisoExpirada, entrar, sair]);
  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}
