import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { mensagemDoErro } from '@/api/ApiError';
import { Botao } from '@/components/Botao';
import { AreaTexto, Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { AvisoErro, CabecalhoPagina } from '@/components/Feedback';
import { useToast } from '@/components/Toast';
import { usePublicarProjeto } from '@/features/projetos/hooks';
import { hojeIso } from '@/utils/formatar';

const esquema = z.object({
  titulo: z.string().trim().min(1, 'Informe o título.'),
  descricao: z.string().trim().min(1, 'Informe a descrição.'),
  orcamento: z.number({ invalid_type_error: 'Informe o orçamento.' }).positive('O orçamento deve ser maior que zero.'),
  prazoDesejado: z
    .string()
    .min(1, 'Informe o prazo desejado.')
    .refine((data) => data > hojeIso(), 'O prazo deve ser uma data futura.'),
});

type Dados = z.infer<typeof esquema>;

export function NovoProjeto() {
  const navegar = useNavigate();
  const toast = useToast();
  const publicar = usePublicarProjeto();
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [rascunho, setRascunho] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<Dados>({ resolver: zodResolver(esquema) });

  const juntar = (lista: string[], texto: string): string[] => {
    const nova = texto.trim();
    return nova && !lista.some((h) => h.toLowerCase() === nova.toLowerCase()) ? [...lista, nova] : lista;
  };

  const adicionar = () => {
    setHabilidades((lista) => juntar(lista, rascunho));
    setRascunho('');
  };

  const aoTeclar = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'Enter' || evento.key === ',') {
      evento.preventDefault();
      adicionar();
    }
  };

  const enviar = (dados: Dados) =>
    publicar.mutate(
      { ...dados, habilidades: juntar(habilidades, rascunho) },
      {
        onSuccess: (projeto) => {
          toast('Projeto publicado.');
          navegar(`/projetos/${projeto.id}`);
        },
      },
    );

  return (
    <div className="mx-auto max-w-2xl">
      <CabecalhoPagina titulo="Novo projeto" descricao="Descreva o trabalho para receber propostas." />
      <Cartao className="p-6">
        <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
          {publicar.isError && <AvisoErro mensagem={mensagemDoErro(publicar.error)} />}
          <Campo rotulo="Título" erro={errors.titulo?.message} {...register('titulo')} />
          <AreaTexto rotulo="Descrição" erro={errors.descricao?.message} {...register('descricao')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Orçamento estimado (R$)" type="number" min="0" step="0.01" erro={errors.orcamento?.message} {...register('orcamento', { valueAsNumber: true })} />
            <Campo rotulo="Prazo desejado" type="date" erro={errors.prazoDesejado?.message} {...register('prazoDesejado')} />
          </div>
          <div>
            <Campo rotulo="Habilidades" ajuda="Digite e pressione Enter para adicionar." value={rascunho} onChange={(e) => setRascunho(e.target.value)} onKeyDown={aoTeclar} onBlur={adicionar} />
            {habilidades.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {habilidades.map((h) => (
                  <li key={h} className="inline-flex items-center gap-1 rounded-full bg-primaria-suave py-0.5 pl-2.5 pr-1 text-detalhe font-medium text-primaria-forte">
                    {h}
                    <button type="button" aria-label={`Remover ${h}`} className="rounded-full p-0.5 hover:bg-primaria/15" onClick={() => setHabilidades((lista) => lista.filter((x) => x !== h))}>
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Botao type="submit" className="w-full sm:w-auto" carregando={publicar.isPending}>Publicar projeto</Botao>
        </form>
      </Cartao>
    </div>
  );
}
