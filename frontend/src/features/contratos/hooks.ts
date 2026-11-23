import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { Contrato, Pagamento } from '@/api/ports';

const chavePagamento = (contratoId: string) => ['pagamentos', contratoId];

export const useContratos = () =>
  useQuery({ queryKey: ['contratos', 'lista'], queryFn: () => api.contratos.listar() });

export const useContrato = (id: string) =>
  useQuery({ queryKey: ['contratos', 'detalhe', id], queryFn: () => api.contratos.buscar(id) });

export const usePagamento = (contratoId: string) =>
  useQuery({ queryKey: chavePagamento(contratoId), queryFn: () => api.pagamentos.buscar(contratoId) });

/** Status de pagamento por contrato, para a listagem. */
export function usePagamentosDe(contratos: Contrato[]): Record<string, Pagamento | null | undefined> {
  const consultas = useQueries({
    queries: contratos.map((contrato) => ({
      queryKey: chavePagamento(contrato.id),
      queryFn: () => api.pagamentos.buscar(contrato.id),
    })),
  });
  return Object.fromEntries(contratos.map((contrato, i) => [contrato.id, consultas[i]?.data]));
}

function useAtualizarContrato(contratoId: string) {
  const cliente = useQueryClient();
  return () =>
    Promise.all([
      cliente.invalidateQueries({ queryKey: chavePagamento(contratoId) }),
      cliente.invalidateQueries({ queryKey: ['contratos'] }),
      cliente.invalidateQueries({ queryKey: ['projetos'] }),
    ]);
}

export function useRealizarPagamento(contratoId: string) {
  const atualizar = useAtualizarContrato(contratoId);
  return useMutation({ mutationFn: () => api.pagamentos.realizar(contratoId), onSuccess: atualizar });
}

export function useConfirmarEntrega(contratoId: string) {
  const atualizar = useAtualizarContrato(contratoId);
  return useMutation({ mutationFn: () => api.pagamentos.confirmarEntrega(contratoId), onSuccess: atualizar });
}
