import { CalendarDays, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Projeto } from '@/api/ports';
import { CLASSES_CARTAO, Etiqueta } from '@/components/Cartao';
import { StatusBadge } from '@/components/StatusBadge';
import { formatarData, formatarMoeda } from '@/utils/formatar';

export function CartaoProjeto({ projeto, rodape }: { projeto: Projeto; rodape?: ReactNode }) {
  return (
    <article className={`${CLASSES_CARTAO} group relative flex animate-surgir flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primaria/40 hover:shadow-elevado`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          <Link to={`/projetos/${projeto.id}`} className="rounded after:absolute after:inset-0 after:rounded-cartao group-hover:text-primaria">
            {projeto.titulo}
          </Link>
        </h2>
        <StatusBadge status={projeto.status} />
      </div>
      <p className="mt-2 line-clamp-2 text-texto-suave">{projeto.descricao}</p>
      <div className="numeros mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-borda pt-3">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Wallet className="h-4 w-4 text-primaria" aria-hidden />
          {formatarMoeda(projeto.orcamento)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-texto-suave">
          <CalendarDays className="h-4 w-4" aria-hidden />
          até {formatarData(projeto.prazoDesejado)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {projeto.habilidades.map((habilidade) => (
            <Etiqueta key={habilidade}>{habilidade}</Etiqueta>
          ))}
        </div>
        <span className="text-detalhe text-texto-suave">{projeto.clienteNome}</span>
      </div>
      {rodape && <div className="relative z-10 mt-4">{rodape}</div>}
    </article>
  );
}
