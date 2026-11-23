import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mensagemDoErro } from '@/api/ApiError';
import { Botao, BotaoLink } from '@/components/Botao';
import { Cartao, Dado, Etiqueta } from '@/components/Cartao';
import { AvisoErro, Carregando, ErroTela } from '@/components/Feedback';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { useCancelarProjeto, useProjeto } from '@/features/projetos/hooks';
import { useSessao } from '@/features/sessao/SessaoContext';
import { formatarData, formatarMoeda } from '@/utils/formatar';

export function DetalheProjeto() {
  const { id = '' } = useParams();
  const { usuario } = useSessao();
  const toast = useToast();
  const consulta = useProjeto(id);
  const cancelar = useCancelarProjeto(id);
  const [confirmando, setConfirmando] = useState(false);

  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) return <ErroTela erro={consulta.error} onTentar={() => consulta.refetch()} />;

  const projeto = consulta.data;
  const aberto = projeto.status === 'ABERTO';
  const dono = usuario?.perfil === 'CLIENTE' && projeto.clienteId === usuario.id;

  const confirmarCancelamento = () =>
    cancelar.mutate(undefined, {
      onSuccess: () => toast('Projeto cancelado.'),
      onSettled: () => setConfirmando(false),
    });

  return (
    <Cartao className="mx-auto max-w-3xl animate-surgir p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-titulo">{projeto.titulo}</h1>
          <p className="mt-1 text-texto-suave">Publicado por {projeto.clienteNome}</p>
        </div>
        <StatusBadge status={projeto.status} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-campo bg-neutro-suave p-4 sm:grid-cols-3">
        <Dado rotulo="Orçamento" valor={formatarMoeda(projeto.orcamento)} />
        <Dado rotulo="Prazo desejado" valor={formatarData(projeto.prazoDesejado)} />
        <Dado rotulo="Publicado em" valor={formatarData(projeto.criadoEm)} />
      </dl>
      <h2 className="mt-6 font-semibold">Descrição</h2>
      <p className="mt-1 whitespace-pre-line text-texto-suave">{projeto.descricao}</p>
      {projeto.habilidades.length > 0 && (
        <>
          <h2 className="mt-6 font-semibold">Habilidades</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projeto.habilidades.map((h) => <Etiqueta key={h}>{h}</Etiqueta>)}
          </div>
        </>
      )}
      {cancelar.isError && <div className="mt-4"><AvisoErro mensagem={mensagemDoErro(cancelar.error)} /></div>}
      <div className="mt-8 flex flex-wrap gap-2">
        {usuario?.perfil === 'FREELANCER' && aberto && <BotaoLink to={`/projetos/${id}/proposta`}>Enviar proposta</BotaoLink>}
        {dono && <BotaoLink to={`/projetos/${id}/propostas`}>Ver propostas recebidas</BotaoLink>}
        {dono && aberto && <Botao variante="perigo" onClick={() => setConfirmando(true)}>Cancelar projeto</Botao>}
      </div>
      <ModalConfirmacao
        aberto={confirmando}
        titulo="Cancelar este projeto?"
        descricao="O projeto deixa de receber propostas e as propostas pendentes serão recusadas. Essa ação não pode ser desfeita."
        rotuloConfirmar="Cancelar projeto"
        perigo
        carregando={cancelar.isPending}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setConfirmando(false)}
      />
    </Cartao>
  );
}
