import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mensagemDoErro } from '@/api/ApiError';
import type { StatusPagamento } from '@/api/ports';
import { Botao } from '@/components/Botao';
import { Cartao, Dado } from '@/components/Cartao';
import { AvisoErro, Carregando, ErroTela } from '@/components/Feedback';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { useConfirmarEntrega, useContrato, usePagamento, useRealizarPagamento } from '@/features/contratos/hooks';
import { useSessao } from '@/features/sessao/SessaoContext';
import { formatarData, formatarDias, formatarMoeda } from '@/utils/formatar';
import { ROTULO_STATUS } from '@/utils/status';

const ETAPAS: StatusPagamento[] = ['PENDENTE', 'RETIDO', 'LIBERADO'];

function LinhaDoTempo({ status }: { status: StatusPagamento }) {
  const atual = ETAPAS.indexOf(status);
  return (
    <ol className="flex items-start" aria-label="Situação do pagamento">
      {ETAPAS.map((etapa, i) => {
        const feita = i < atual || status === 'LIBERADO';
        const ativa = i === atual;
        return (
          <li key={etapa} className="relative flex flex-1 flex-col items-center text-center" aria-current={ativa ? 'step' : undefined}>
            {i > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${i <= atual ? 'bg-primaria' : 'bg-borda'}`} aria-hidden />}
            <span className={`relative flex h-8 w-8 items-center justify-center rounded-full text-detalhe font-bold ${feita ? 'bg-black text-white' : ativa ? 'bg-primaria-suave text-primaria-forte ring-2 ring-black' : 'bg-neutro-suave text-texto-suave'}`}>
              {feita ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={`mt-2 text-detalhe ${ativa ? 'font-semibold text-texto' : 'text-texto-suave'}`}>{ROTULO_STATUS[etapa]}</span>
          </li>
        );
      })}
    </ol>
  );
}

const MENSAGEM_FREELANCER: Record<StatusPagamento, string> = {
  PENDENTE: 'Aguardando o pagamento do cliente.',
  RETIDO: 'Pagamento retido pela plataforma. Será liberado após a confirmação da entrega.',
  LIBERADO: 'Pagamento liberado. Contrato concluído.',
};

export function Contrato() {
  const { id = '' } = useParams();
  const { usuario } = useSessao();
  const toast = useToast();
  const contrato = useContrato(id);
  const pagamento = usePagamento(id);
  const pagar = useRealizarPagamento(id);
  const confirmar = useConfirmarEntrega(id);
  const [confirmando, setConfirmando] = useState(false);

  if (contrato.isPending || pagamento.isPending) return <Carregando />;
  if (contrato.isError) return <ErroTela erro={contrato.error} onTentar={() => contrato.refetch()} />;
  if (pagamento.isError) return <ErroTela erro={pagamento.error} onTentar={() => pagamento.refetch()} />;

  const dados = contrato.data;
  const status: StatusPagamento = pagamento.data?.status ?? 'PENDENTE';
  const ehCliente = dados.clienteId === usuario?.id;
  const falha = pagar.error ?? confirmar.error;

  const realizar = () => pagar.mutate(undefined, { onSuccess: () => toast('Pagamento realizado e retido.') });
  const liberar = () =>
    confirmar.mutate(undefined, {
      onSuccess: () => toast('Entrega confirmada. Pagamento liberado.'),
      onSettled: () => setConfirmando(false),
    });

  return (
    <div className="animate-surgir">
      <div className="mx-auto grid max-w-3xl gap-5">
      <Cartao className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-detalhe font-medium text-texto-suave">Contrato</p>
            <h1 className="text-titulo">{dados.projetoTitulo}</h1>
            <Link to={`/projetos/${dados.projetoId}`} className="font-semibold text-black underline underline-offset-4">Ver projeto</Link>
          </div>
          <StatusBadge status={dados.status} />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-campo bg-neutro-suave p-4 sm:grid-cols-4">
          <Dado rotulo="Cliente" valor={dados.clienteNome} />
          <Dado rotulo="Freelancer" valor={dados.freelancerNome} />
          <Dado rotulo="Valor" valor={formatarMoeda(dados.valor)} />
          <Dado rotulo="Prazo" valor={formatarDias(dados.prazoDias)} />
        </dl>
        <p className="mt-3 text-detalhe text-texto-suave">Gerado em {formatarData(dados.criadoEm)}</p>
      </Cartao>

      <Cartao className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-subtitulo">Pagamento</h2>
          <StatusBadge status={status} />
        </div>
        <LinhaDoTempo status={status} />
        {falha && <div className="mt-5"><AvisoErro mensagem={mensagemDoErro(falha)} /></div>}
        <div className="mt-6">
          {ehCliente && status === 'PENDENTE' && <Botao onClick={realizar} carregando={pagar.isPending}>Realizar pagamento</Botao>}
          {ehCliente && status === 'RETIDO' && <Botao onClick={() => setConfirmando(true)}>Confirmar entrega e liberar pagamento</Botao>}
          {ehCliente && status === 'LIBERADO' && <p className="rounded-campo bg-sucesso-suave px-3 py-2 font-medium text-sucesso">Contrato concluído. O pagamento foi liberado ao freelancer.</p>}
          {!ehCliente && <p className="rounded-campo bg-neutro-suave px-3 py-2 text-texto-suave">{MENSAGEM_FREELANCER[status]}</p>}
        </div>
        <p className="mt-4 text-detalhe text-texto-suave">O pagamento é simulado nesta versão.</p>
      </Cartao>

      <ModalConfirmacao
        aberto={confirmando}
        titulo="Confirmar a entrega?"
        descricao={`${formatarMoeda(dados.valor)} serão liberados a ${dados.freelancerNome} e o contrato será concluído. Essa ação não pode ser desfeita.`}
        rotuloConfirmar="Confirmar e liberar"
        carregando={confirmar.isPending}
        onConfirmar={liberar}
        onFechar={() => setConfirmando(false)}
      />
      </div>
    </div>
  );
}
