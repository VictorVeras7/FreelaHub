import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { FiltrosProjetos } from '@/api/ports';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { CabecalhoPagina, Carregando, ErroTela, EstadoVazio } from '@/components/Feedback';
import { CartaoProjeto } from '@/features/projetos/CartaoProjeto';
import { useProjetosAbertos } from '@/features/projetos/hooks';

const numero = (texto: string): number | undefined => (texto.trim() === '' ? undefined : Number(texto));

export function ProjetosAbertos() {
  const [habilidade, setHabilidade] = useState('');
  const [minimo, setMinimo] = useState('');
  const [maximo, setMaximo] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProjetos>({});
  const consulta = useProjetosAbertos(filtros);

  const aplicar = (evento: FormEvent) => {
    evento.preventDefault();
    setFiltros({ habilidade: habilidade.trim() || undefined, orcamentoMin: numero(minimo), orcamentoMax: numero(maximo) });
  };

  const limpar = () => {
    setHabilidade('');
    setMinimo('');
    setMaximo('');
    setFiltros({});
  };

  return (
    <>
      <CabecalhoPagina titulo="Projetos abertos" descricao="Encontre um projeto e envie sua proposta." />
      <Cartao className="mb-6 p-4">
        <form onSubmit={aplicar} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Campo rotulo="Habilidade" placeholder="Ex.: React" value={habilidade} onChange={(e) => setHabilidade(e.target.value)} />
          <Campo rotulo="Orçamento mínimo" type="number" min="0" step="0.01" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
          <Campo rotulo="Orçamento máximo" type="number" min="0" step="0.01" value={maximo} onChange={(e) => setMaximo(e.target.value)} />
          <div className="flex gap-2">
            <Botao type="submit" className="flex-1"><Search className="h-4 w-4" aria-hidden />Filtrar</Botao>
            <Botao variante="fantasma" onClick={limpar}>Limpar</Botao>
          </div>
        </form>
      </Cartao>
      {consulta.isPending ? <Carregando /> : consulta.isError ? (
        <ErroTela erro={consulta.error} onTentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EstadoVazio titulo="Nenhum projeto aberto com esses filtros." descricao="Ajuste a habilidade ou a faixa de orçamento." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {consulta.data.map((projeto) => <CartaoProjeto key={projeto.id} projeto={projeto} />)}
        </div>
      )}
    </>
  );
}
