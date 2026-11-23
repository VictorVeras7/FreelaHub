import type { ReactNode } from 'react';
import { Marca } from '@/components/Marca';

export function LayoutAutenticacao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-oliva p-8 text-white lg:flex">
        <Marca claro />
        <p className="font-display text-[clamp(3rem,5.5vw,5.5rem)] uppercase leading-[1]">Do projeto ao pagamento.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md animate-surgir">
          <div className="mb-6 lg:hidden"><Marca /></div>
          <h1 className="text-titulo">{titulo}</h1>
          <p className="mb-7 mt-2 text-texto-suave">{descricao}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
