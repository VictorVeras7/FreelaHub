import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { NovaProposta } from '@/api/ports';

export const usePropostasDoProjeto = (projetoId: string) =>
  useQuery({ queryKey: ['propostas', projetoId], queryFn: () => api.propostas.listarDoProjeto(projetoId) });

export function useEnviarProposta(projetoId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovaProposta) => api.propostas.enviar(projetoId, dados),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['propostas', projetoId] }),
  });
}

export function useAceitarProposta(projetoId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (propostaId: string) => api.contratos.aceitarProposta(propostaId),
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: ['propostas', projetoId] }),
        cliente.invalidateQueries({ queryKey: ['projetos'] }),
        cliente.invalidateQueries({ queryKey: ['contratos'] }),
      ]),
  });
}
