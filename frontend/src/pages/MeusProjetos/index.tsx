import { Plus } from 'lucide-react';
import { BotaoLink } from '@/components/Botao';
import { CabecalhoPagina, Carregando, ErroTela, EstadoVazio } from '@/components/Feedback';
import { CartaoProjeto } from '@/features/projetos/CartaoProjeto';
import { useMeusProjetos } from '@/features/projetos/hooks';

export function MeusProjetos() {
  const consulta = useMeusProjetos();
  return (
    <>
      <CabecalhoPagina
        titulo="Meus projetos"
        descricao="Acompanhe seus projetos e as propostas recebidas."
        acao={<BotaoLink to="/projetos/novo" variante="secundaria"><Plus className="h-4 w-4" aria-hidden />Novo projeto</BotaoLink>}
      />
      {consulta.isPending ? <Carregando /> : consulta.isError ? (
        <ErroTela erro={consulta.error} onTentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EstadoVazio titulo="Você ainda não publicou projetos." descricao="Publique um projeto para receber propostas." acao={<BotaoLink to="/projetos/novo">Publicar primeiro projeto</BotaoLink>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {consulta.data.map((projeto) => (
            <CartaoProjeto
              key={projeto.id}
              projeto={projeto}
              rodape={projeto.status === 'ABERTO' ? <BotaoLink variante="secundaria" className="w-full" to={`/projetos/${projeto.id}/propostas`}>Ver propostas</BotaoLink> : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
