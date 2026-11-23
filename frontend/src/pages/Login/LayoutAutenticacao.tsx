import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Marca } from '@/components/Marca';

const ETAPAS = ['Publique um projeto', 'Compare propostas', 'Pague com retenção segura'];

export function LayoutAutenticacao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="gradiente-marca hidden flex-col justify-center p-14 text-white lg:flex">
        <p className="max-w-md text-[2.25rem] font-semibold leading-[2.75rem] tracking-tight">
          Do projeto ao pagamento, em um só lugar.
        </p>
        <ul className="mt-8 space-y-3">
          {ETAPAS.map((etapa) => (
            <li key={etapa} className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {etapa}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-surgir">
          <Marca />
          <h1 className="mt-6 text-titulo">{titulo}</h1>
          <p className="mb-6 mt-1 text-texto-suave">{descricao}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
