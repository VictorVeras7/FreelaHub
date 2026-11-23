import { Link } from 'react-router-dom';
import type { Contrato } from '@/api/ports';
import { Cartao } from '@/components/Cartao';
import { CabecalhoPagina, Carregando, ErroTela, EstadoVazio } from '@/components/Feedback';
import { StatusBadge } from '@/components/StatusBadge';
import { useContratos, usePagamentosDe } from '@/features/contratos/hooks';
import { useSessao } from '@/features/sessao/SessaoContext';
import { formatarMoeda } from '@/utils/formatar';

function ListaContratos({ contratos }: { contratos: Contrato[] }) {
  const { usuario } = useSessao();
  const pagamentos = usePagamentosDe(contratos);
  return (
    <ul className="space-y-3">
      {contratos.map((contrato) => {
        const cliente = contrato.clienteId === usuario?.id;
        return (
          <li key={contrato.id}>
            <Cartao className="relative grid animate-surgir gap-3 p-5 transition hover:border-primaria/40 hover:shadow-elevado sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  <Link to={`/contratos/${contrato.id}`} className="rounded after:absolute after:inset-0 after:rounded-cartao">{contrato.projetoTitulo}</Link>
                </h2>
                <p className="text-texto-suave">{cliente ? `Freelancer: ${contrato.freelancerNome}` : `Cliente: ${contrato.clienteNome}`}</p>
              </div>
              <p className="numeros font-semibold">{formatarMoeda(contrato.valor)}</p>
              <div className="flex flex-wrap gap-3 text-detalhe text-texto-suave">
                <span className="flex items-center gap-1.5">Contrato <StatusBadge status={contrato.status} /></span>
                <span className="flex items-center gap-1.5">Pagamento <StatusBadge status={pagamentos[contrato.id]?.status ?? 'PENDENTE'} /></span>
              </div>
            </Cartao>
          </li>
        );
      })}
    </ul>
  );
}

export function Contratos() {
  const consulta = useContratos();
  return (
    <>
      <CabecalhoPagina titulo="Meus contratos" descricao="Acompanhe contratos e pagamentos." />
      {consulta.isPending ? <Carregando /> : consulta.isError ? (
        <ErroTela erro={consulta.error} onTentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EstadoVazio titulo="Você ainda não tem contratos." descricao="Os contratos aparecem aqui quando uma proposta é aceita." />
      ) : (
        <ListaContratos contratos={consulta.data} />
      )}
    </>
  );
}
