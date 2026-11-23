import type { HTMLAttributes } from 'react';

export const CLASSES_CARTAO = 'rounded-cartao bg-superficie shadow-cartao';

export function Cartao({ className = '', ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${CLASSES_CARTAO} ${className}`} {...resto} />;
}

export function Etiqueta({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-neutro-suave px-2.5 py-0.5 text-detalhe font-medium text-texto-suave">
      {children}
    </span>
  );
}

export function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-detalhe text-texto-suave">{rotulo}</dt>
      <dd className="numeros mt-0.5 font-semibold">{valor}</dd>
    </div>
  );
}
