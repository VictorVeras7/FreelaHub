import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variante = 'primaria' | 'secundaria' | 'perigo' | 'fantasma';

const BASE =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-campo px-4 py-2 text-corpo font-semibold transition duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55';

const VARIANTES: Record<Variante, string> = {
  primaria: 'gradiente-marca text-white shadow-cartao hover:shadow-elevado hover:brightness-110',
  secundaria: 'border border-borda bg-superficie text-texto hover:border-primaria/40 hover:bg-primaria-suave/40',
  perigo: 'border border-erro/30 bg-superficie text-erro hover:bg-erro-suave',
  fantasma: 'text-texto-suave hover:bg-neutro-suave hover:text-texto',
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
