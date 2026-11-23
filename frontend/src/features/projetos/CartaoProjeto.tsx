import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Projeto } from '@/api/ports';
import { CLASSES_CARTAO, Etiqueta } from '@/components/Cartao';
import { StatusBadge } from '@/components/StatusBadge';
import { formatarData, formatarMoeda } from '@/utils/formatar';

const MAXIMO_HABILIDADES = 2;

export function CartaoProjeto({ projeto, rodape }: { projeto: Projeto; rodape?: ReactNode }) {
  const extras = projeto.habilidades.length - MAXIMO_HABILIDADES;

  return (
    <article className={`${CLASSES_CARTAO} relative flex min-h-[19rem] animate-surgir flex-col p-5 transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-elevado lg:aspect-square lg:min-h-0`}>
      <div>
        <StatusBadge status={projeto.status} />
      </div>

      <h2 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight tracking-tight">
        <Link to={`/projetos/${projeto.id}`} className="after:absolute after:inset-0 after:rounded-cartao">{projeto.titulo}</Link>
      </h2>
      <p className="mt-1.5 line-clamp-2 text-texto-suave">{projeto.descricao}</p>

      <div className="mt-auto pt-3">
        <div className="flex flex-wrap gap-1.5">
          {projeto.habilidades.slice(0, MAXIMO_HABILIDADES).map((habilidade) => <Etiqueta key={habilidade}>{habilidade}</Etiqueta>)}
          {extras > 0 && <Etiqueta>{`+${extras}`}</Etiqueta>}
        </div>
        <p className="numeros mt-3 text-lg font-semibold">{formatarMoeda(projeto.orcamento)}</p>
        <p className="numeros truncate text-detalhe text-texto-suave">{projeto.clienteNome} · até {formatarData(projeto.prazoDesejado)}</p>
        {rodape && <div className="relative z-10 mt-3">{rodape}</div>}
      </div>
    </article>
  );
}
