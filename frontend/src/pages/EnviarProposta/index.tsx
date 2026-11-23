import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { mensagemDoErro } from '@/api/ApiError';
import { Botao } from '@/components/Botao';
import { AreaTexto, Campo } from '@/components/Campo';
import { Cartao, Dado } from '@/components/Cartao';
import { AvisoErro, CabecalhoPagina, Carregando, ErroTela } from '@/components/Feedback';
import { useToast } from '@/components/Toast';
import { useProjeto } from '@/features/projetos/hooks';
import { useEnviarProposta } from '@/features/propostas/hooks';
import { formatarData, formatarMoeda } from '@/utils/formatar';

const esquema = z.object({
  valor: z.number({ invalid_type_error: 'Informe o valor.' }).positive('O valor deve ser maior que zero.'),
  prazoDias: z.number({ invalid_type_error: 'Informe o prazo.' }).int('O prazo deve ser um número inteiro.').positive('O prazo deve ser maior que zero.'),
  mensagem: z.string().trim().min(1, 'Escreva uma mensagem de apresentação.'),
});

type Dados = z.infer<typeof esquema>;

export function EnviarProposta() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const toast = useToast();
  const consulta = useProjeto(id);
  const enviarProposta = useEnviarProposta(id);
  const { register, handleSubmit, formState: { errors } } = useForm<Dados>({ resolver: zodResolver(esquema) });

  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) return <ErroTela erro={consulta.error} onTentar={() => consulta.refetch()} />;
  const projeto = consulta.data;

  const enviar = (dados: Dados) =>
    enviarProposta.mutate(dados, {
      onSuccess: () => {
        toast('Proposta enviada.');
        navegar(`/projetos/${id}`);
      },
    });

  return (
    <div className="mx-auto max-w-2xl">
      <CabecalhoPagina titulo="Enviar proposta" descricao={projeto.titulo} />
      <Cartao className="mb-4 p-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Dado rotulo="Cliente" valor={projeto.clienteNome} />
          <Dado rotulo="Orçamento" valor={formatarMoeda(projeto.orcamento)} />
          <Dado rotulo="Prazo desejado" valor={formatarData(projeto.prazoDesejado)} />
        </dl>
      </Cartao>
      <Cartao className="p-6">
        <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
          {enviarProposta.isError && <AvisoErro mensagem={mensagemDoErro(enviarProposta.error)} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Valor (R$)" type="number" min="0" step="0.01" erro={errors.valor?.message} {...register('valor', { valueAsNumber: true })} />
            <Campo rotulo="Prazo de entrega (dias)" type="number" min="1" step="1" erro={errors.prazoDias?.message} {...register('prazoDias', { valueAsNumber: true })} />
          </div>
          <AreaTexto rotulo="Mensagem de apresentação" erro={errors.mensagem?.message} {...register('mensagem')} />
          <Botao type="submit" className="w-full sm:w-auto" carregando={enviarProposta.isPending}>Enviar proposta</Botao>
        </form>
      </Cartao>
    </div>
  );
}
