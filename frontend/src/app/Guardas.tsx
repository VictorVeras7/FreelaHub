import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Perfil } from '@/api/ports';
import { rotaInicial, useSessao } from '@/features/sessao/SessaoContext';

export function RotaProtegida({ perfis }: { perfis?: Perfil[] }) {
  const { usuario } = useSessao();
  const local = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to={rotaInicial(usuario.perfil)} replace />;
  return <Outlet />;
}

export function RotaPublica() {
  const { usuario } = useSessao();
  return usuario ? <Navigate to={rotaInicial(usuario.perfil)} replace /> : <Outlet />;
}

export function RedirecionarInicio() {
  const { usuario } = useSessao();
  return <Navigate to={usuario ? rotaInicial(usuario.perfil) : '/login'} replace />;
}
