import { ROTULO_STATUS, TOM_STATUS, type Status, type TomStatus } from '@/utils/status';

const TONS: Record<TomStatus, { fundo: string; ponto: string }> = {
  primaria: { fundo: 'bg-black text-white', ponto: 'bg-white' },
  sucesso: { fundo: 'bg-sucesso-suave text-sucesso', ponto: 'bg-sucesso' },
  alerta: { fundo: 'bg-alerta-suave text-alerta', ponto: 'bg-alerta' },
  erro: { fundo: 'bg-erro-suave text-erro', ponto: 'bg-erro' },
  neutro: { fundo: 'bg-neutro-suave text-neutro', ponto: 'bg-neutro' },
};

export function StatusBadge({ status }: { status: Status }) {
  const tom = TONS[TOM_STATUS[status]];
  return (
    <span className={`rotulo inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 ${tom.fundo}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tom.ponto}`} aria-hidden />
      {ROTULO_STATUS[status]}
    </span>
  );
}
