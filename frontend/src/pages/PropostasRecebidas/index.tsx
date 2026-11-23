import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { mensagemDoErro } from '@/api/ApiError';
import type { Proposta } from '@/api/ports';
import { Botao } from '@/components/Botao';
import { Cartao, Dado } from '@/components/Cartao';
import { AvisoErro, CabecalhoPagina, Carregando, ErroTela, EstadoVazio } from '@/components/Feedback';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { useProjeto } from '@/features/projetos/hooks';
import { useAceitarProposta, usePropostasDoProjeto } from '@/features/propostas/hooks';
import { formatarDias, formatarMoeda } from '@/utils/formatar';

export function PropostasRecebidas() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const toast = useToast();
  const projeto = useProjeto(id);
  const propostas = usePropostasDoProjeto(id);
  const aceitar = useAceitarProposta(id);
  const [escolhida, setEscolhida] = useState<Proposta | null>(null);

  if (projeto.isPending || propostas.isPending) return <Carregando />;
  if (projeto.isError) return <ErroTela erro={projeto.error} onTentar={() => projeto.refetch()} />;
  if (propostas.isError) return <ErroTela erro={propostas.error} onTentar={() => propostas.refetch()} />;

  const confirmar = () => {
    if (!escolhida) return;
    aceitar.mutate(escolhida.id, {
      onSuccess: (contrato) => {
        toast('Proposta aceita. Contrato gerado.');
        navegar(`/contratos/${contrato.id}`);
      },
      onSettled: () => setEscolhida(null),
    });
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Propostas recebidas"
        descricao={projeto.data.titulo}
        acao={<Link to={`/projetos/${id}`} className="font-semibold text-white underline-offset-4 hover:underline">Ver projeto</Link>}
      />
      {aceitar.isError && <div className="mb-4"><AvisoErro mensagem={mensagemDoErro(aceitar.error)} /></div>}
      {propostas.data.length === 0 ? (
        <EstadoVazio titulo="Nenhuma proposta recebida ainda." descricao="Quando um freelancer enviar uma proposta, ela aparece aqui." />
      ) : (
        <ul className="space-y-3">
          {propostas.data.map((proposta) => (
            <li key={proposta.id}>
              <Cartao className="animate-surgir p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight">{proposta.freelancerNome}</h2>
                  <StatusBadge status={proposta.status} />
                </div>
                <p className="mt-2 whitespace-pre-line text-texto-suave">{proposta.mensagem}</p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3 pt-1">
                  <dl className="flex gap-8">
                    <Dado rotulo="Valor" valor={formatarMoeda(proposta.valor)} />
                    <Dado rotulo="Prazo" valor={formatarDias(proposta.prazoDias)} />
                  </dl>
                  {proposta.status === 'PENDENTE' && projeto.data.status === 'ABERTO' && (
                    <Botao onClick={() => setEscolhida(proposta)} aria-label={`Aceitar proposta de ${proposta.freelancerNome}`}>Aceitar</Botao>
                  )}
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
      <ModalConfirmacao
        aberto={escolhida !== null}
        titulo="Aceitar esta proposta?"
        descricao={escolhida ? `Um contrato de ${formatarMoeda(escolhida.valor)} será gerado com ${escolhida.freelancerNome}, e as demais propostas serão recusadas.` : ''}
        rotuloConfirmar="Aceitar e gerar contrato"
        carregando={aceitar.isPending}
        onConfirmar={confirmar}
        onFechar={() => setEscolhida(null)}
      />
    </>
  );
}
