import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { FiltrosProjetos, NovoProjeto } from '@/api/ports';

export const useProjetosAbertos = (filtros: FiltrosProjetos) =>
  useQuery({ queryKey: ['projetos', 'abertos', filtros], queryFn: () => api.projetos.listarAbertos(filtros) });

export const useMeusProjetos = () =>
  useQuery({ queryKey: ['projetos', 'meus'], queryFn: () => api.projetos.listarMeus() });

export const useProjeto = (id: string) =>
  useQuery({ queryKey: ['projetos', 'detalhe', id], queryFn: () => api.projetos.buscar(id) });

export function usePublicarProjeto() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovoProjeto) => api.projetos.publicar(dados),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['projetos'] }),
  });
}

export function useCancelarProjeto(id: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: () => api.projetos.cancelar(id),
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: ['projetos'] }),
        cliente.invalidateQueries({ queryKey: ['propostas', id] }),
      ]),
  });
}
