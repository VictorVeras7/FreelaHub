import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variante = 'primaria' | 'secundaria' | 'perigo' | 'fantasma';

const BASE =
  'inline-flex min-h-11 items-center rounded-campo justify-center gap-2.5 border px-5 py-2 text-corpo font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTES: Record<Variante, string> = {
  primaria: 'border-black bg-black text-white hover:bg-white hover:text-black',
  secundaria: 'border-black bg-white text-black hover:bg-black hover:text-white',
  perigo: 'border-erro bg-white text-erro hover:bg-erro hover:text-white',
  fantasma: 'border-transparent text-texto-suave hover:text-black',
};

export const classesBotao = (variante: Variante = 'primaria', extra = ''): string =>
  `${BASE} ${VARIANTES[variante]} ${extra}`;

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  carregando?: boolean;
}

export function Botao({ variante, carregando, className = '', children, disabled, type = 'button', ...resto }: BotaoProps) {
  return (
    <button type={type} className={classesBotao(variante, className)} disabled={disabled || carregando} aria-busy={carregando} {...resto}>
      {carregando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

interface BotaoLinkProps extends LinkProps {
  variante?: Variante;
}

export function BotaoLink({ variante, className = '', ...resto }: BotaoLinkProps) {
  return <Link className={classesBotao(variante, className)} {...resto} />;
}
