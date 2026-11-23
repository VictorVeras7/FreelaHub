import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/api/ApiError';
import { ToastProvider } from '@/components/Toast';
import { SessaoProvider } from '@/features/sessao/SessaoContext';

const novoCliente = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        refetchOnWindowFocus: false,
        retry: (falhas, erro) => !(erro instanceof ApiError && erro.status >= 400 && erro.status < 500) && falhas < 1,
      },
    },
  });

export function Providers({ children }: { children: ReactNode }) {
  const [cliente] = useState(novoCliente);
  return (
    <QueryClientProvider client={cliente}>
      <SessaoProvider>
        <ToastProvider>{children}</ToastProvider>
      </SessaoProvider>
    </QueryClientProvider>
  );
}
