import { LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { Perfil } from '@/api/ports';
import { Botao } from '@/components/Botao';
import { Marca } from '@/components/Marca';
import { useSessao } from '@/features/sessao/SessaoContext';
import { ROTULO_PERFIL } from '@/utils/status';

const NAVEGACAO: Record<Perfil, { para: string; rotulo: string }[]> = {
  CLIENTE: [
    { para: '/meus-projetos', rotulo: 'Meus projetos' },
    { para: '/projetos/novo', rotulo: 'Novo projeto' },
    { para: '/contratos', rotulo: 'Contratos' },
  ],
  FREELANCER: [
    { para: '/projetos', rotulo: 'Projetos abertos' },
    { para: '/contratos', rotulo: 'Contratos' },
  ],
  ADMINISTRADOR: [{ para: '/contratos', rotulo: 'Contratos' }],
};

export function Layout() {
  const { usuario, sair } = useSessao();
  const navegar = useNavigate();
  if (!usuario) return null;

  const encerrar = () => {
    sair();
    navegar('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-borda/80 bg-superficie/75 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Marca />
          <nav aria-label="Navegação principal" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto px-1 md:order-none md:w-auto">
            {NAVEGACAO[usuario.perfil].map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${isActive ? 'bg-primaria-suave text-primaria-forte' : 'text-texto-suave hover:bg-neutro-suave hover:text-texto'}`
                }
              >
                {item.rotulo}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-right leading-tight">
              <p className="max-w-40 truncate font-semibold">{usuario.nome}</p>
              <p className="text-detalhe text-texto-suave">{ROTULO_PERFIL[usuario.perfil]}</p>
            </div>
            <Botao variante="fantasma" onClick={encerrar} className="px-3">
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </Botao>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
