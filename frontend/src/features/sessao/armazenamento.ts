import type { SessaoAutenticada } from '@/api/ports';

const CHAVE = 'freelahub.sessao.v1';
export const EVENTO_SESSAO_EXPIRADA = 'freelahub:sessao-expirada';

export const lerSessao = (): SessaoAutenticada | null => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as SessaoAutenticada) : null;
  } catch {
    return null;
  }
};

export const gravarSessao = (sessao: SessaoAutenticada): void => {
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
};

export const limparSessao = (): void => {
  localStorage.removeItem(CHAVE);
};

export const avisarSessaoExpirada = (): void => {
  limparSessao();
  window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
};
