import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { Perfil } from '@/api/ports';
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
    <div className="min-h-screen bg-neutro-suave">
      <header className="sticky top-0 z-30 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <Marca />
          <nav aria-label="Navegação principal" className="order-3 flex w-full gap-1 overflow-x-auto rounded-full bg-neutro-suave p-1 md:order-none md:ml-auto md:w-auto">
            {NAVEGACAO[usuario.perfil].map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold uppercase transition-colors ${isActive ? 'bg-white text-black' : 'text-texto-suave hover:text-black'}`
                }
              >
                {item.rotulo}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="max-w-40 truncate text-[0.8125rem] font-semibold uppercase">{usuario.nome}</p>
              <p className="text-detalhe text-texto-suave">{ROTULO_PERFIL[usuario.perfil]}</p>
            </div>
            <button type="button" onClick={encerrar} className="text-[0.8125rem] font-semibold uppercase underline-offset-4 hover:underline">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
