import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NovoUsuario } from '@/api/ports';
import { BotaoLink } from '@/components/Botao';
import { Marca } from '@/components/Marca';
import { rotaInicial, useSessao } from '@/features/sessao/SessaoContext';

type PerfilPublico = NovoUsuario['perfil'];

export function Inicio() {
  const { usuario, sair } = useSessao();

  /** Quem escolhe um perfil na página inicial sempre passa pelo login. */
  const paraLogin = (perfil?: PerfilPublico) => ({
    to: '/login',
    state: perfil ? { perfil } : undefined,
    onClick: () => {
      if (usuario) sair();
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-[var(--altura-cabecalho)] items-center justify-between px-4 sm:px-8">
        <Marca />
        {usuario ? (
          <Link to={rotaInicial(usuario.perfil)} className="text-[0.8125rem] font-semibold uppercase underline-offset-4 hover:underline">
            Meu painel
          </Link>
        ) : (
          <Link to="/login" className="text-[0.8125rem] font-semibold uppercase underline-offset-4 hover:underline">
            Entrar
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col justify-between gap-10 px-4 pb-8 sm:px-8">
        <div>
          <h1 className="animate-surgir overflow-hidden">
            <span className="letreiro">FreelaHub</span>
          </h1>
          <div className="mt-4 flex justify-end gap-6 text-[0.8125rem] font-semibold uppercase">
            <Link {...paraLogin('CLIENTE')} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
              Sou cliente <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link {...paraLogin('FREELANCER')} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
              Sou freelancer <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="grid animate-surgir items-end gap-6 lg:grid-cols-2">
          <p className="max-w-2xl text-[clamp(1.75rem,2.8vw,2.75rem)] font-medium leading-[1.12] tracking-tight">
            O lugar onde bons projetos encontram os profissionais certos.
          </p>
          <div>
            <p className="max-w-xl text-base">
              Publique um trabalho, receba propostas e contrate com o pagamento protegido do início à entrega.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <BotaoLink {...paraLogin('CLIENTE')}>
                Publicar um projeto <ArrowRight className="h-4 w-4" aria-hidden />
              </BotaoLink>
              <BotaoLink {...paraLogin('FREELANCER')} variante="secundaria">
                Buscar trabalhos
              </BotaoLink>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
