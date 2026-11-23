import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { mensagemDoErro } from '@/api/ApiError';
import { Botao } from './Botao';

export function Carregando() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-texto-suave">
      <Loader2 className="h-5 w-5 animate-spin text-primaria" aria-hidden />
      Carregando...
    </div>
  );
}

export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="rounded-cartao border border-dashed border-borda bg-superficie/70 px-6 py-14 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-none bg-primaria-suave text-primaria">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 font-semibold">{titulo}</p>
      {descricao && <p className="mt-1 text-texto-suave">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function ErroTela({ erro, onTentar }: { erro: unknown; onTentar?: () => void }) {
  return (
    <div role="alert" className="rounded-cartao border border-erro/25 bg-erro-suave/50 px-6 py-10 text-center">
      <AlertCircle className="mx-auto h-6 w-6 text-erro" aria-hidden />
      <p className="mt-2 font-semibold text-erro">{mensagemDoErro(erro)}</p>
      {onTentar && (
        <Botao variante="secundaria" className="mt-4" onClick={onTentar}>
          Tentar de novo
        </Botao>
      )}
    </div>
  );
}

export function AvisoErro({ mensagem }: { mensagem: string }) {
  return (
    <p role="alert" className="rounded-campo border border-erro/25 bg-erro-suave/60 px-3 py-2 font-medium text-erro">
      {mensagem}
    </p>
  );
}

interface CabecalhoProps {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acao }: CabecalhoProps) {
  return (
    <header className="mb-7 flex animate-surgir flex-col gap-4 rounded-cartao bg-oliva px-6 py-7 text-white sm:px-8 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-titulo">{titulo}</h1>
        {descricao && <p className="mt-1.5 text-white/80">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}
