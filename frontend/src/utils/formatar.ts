const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

export const formatarMoeda = (valor: number): string => moeda.format(valor);

/** Datas ISO são exibidas pelo dia informado, sem deslocamento de fuso. */
export const formatarData = (iso: string): string => data.format(new Date(iso));

export const hojeIso = (): string => {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
};

export const formatarDias = (dias: number): string => `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
