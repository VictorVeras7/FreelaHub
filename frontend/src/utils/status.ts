import type {
  Perfil,
  StatusContrato,
  StatusPagamento,
  StatusProjeto,
  StatusProposta,
} from '@/api/ports';

export type TomStatus = 'primaria' | 'sucesso' | 'alerta' | 'erro' | 'neutro';
export type Status = StatusProjeto | StatusProposta | StatusContrato | StatusPagamento;

export const ROTULO_STATUS: Record<Status, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  PENDENTE: 'Pendente',
  ACEITA: 'Aceita',
  RECUSADA: 'Recusada',
  ATIVO: 'Ativo',
  RETIDO: 'Retido',
  LIBERADO: 'Liberado',
};

export const TOM_STATUS: Record<Status, TomStatus> = {
  ABERTO: 'primaria',
  EM_ANDAMENTO: 'alerta',
  CONCLUIDO: 'sucesso',
  CANCELADO: 'neutro',
  PENDENTE: 'neutro',
  ACEITA: 'sucesso',
  RECUSADA: 'erro',
  ATIVO: 'primaria',
  RETIDO: 'alerta',
  LIBERADO: 'sucesso',
};

export const ROTULO_PERFIL: Record<Perfil, string> = {
  CLIENTE: 'Cliente',
  FREELANCER: 'Freelancer',
  ADMINISTRADOR: 'Administrador',
};
