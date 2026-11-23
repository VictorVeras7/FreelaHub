import { ApiError } from '@/api/ApiError';
import type { Api, FiltrosProjetos, Pagamento } from '@/api/ports';
import { avisarSessaoExpirada, lerSessao } from '@/features/sessao/armazenamento';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface CorpoErro {
  erro?: { codigo?: string; mensagem?: string };
}

interface Opcoes {
  metodo?: 'GET' | 'POST';
  corpo?: unknown;
  publica?: boolean;
}

async function requisitar<T>(caminho: string, { metodo = 'GET', corpo, publica }: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {};
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  const token = lerSessao()?.token;
  if (!publica && token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ApiError(0, 'SEM_CONEXAO', 'Não foi possível conectar ao servidor.');
  }

  if (resposta.ok) {
    return (resposta.status === 204 ? undefined : await resposta.json()) as T;
  }

  const detalhe = (await resposta.json().catch(() => ({}))) as CorpoErro;
  if (resposta.status === 401 && !publica) {
    avisarSessaoExpirada();
    throw new ApiError(401, 'SESSAO_EXPIRADA', 'Sua sessão expirou. Entre novamente.');
  }
  throw new ApiError(
    resposta.status,
    detalhe.erro?.codigo ?? 'ERRO_DESCONHECIDO',
    detalhe.erro?.mensagem ?? 'Não foi possível concluir a operação.',
  );
}

const consulta = (filtros: FiltrosProjetos): string => {
  const params = new URLSearchParams();
  if (filtros.habilidade) params.set('habilidade', filtros.habilidade);
  if (filtros.orcamentoMin !== undefined) params.set('orcamentoMin', String(filtros.orcamentoMin));
  if (filtros.orcamentoMax !== undefined) params.set('orcamentoMax', String(filtros.orcamentoMax));
  const texto = params.toString();
  return texto ? `?${texto}` : '';
};

export const httpApi: Api = {
  auth: {
    cadastrar: (dados) => requisitar('/usuarios', { metodo: 'POST', corpo: dados, publica: true }),
    entrar: (credenciais) =>
      requisitar('/sessoes', { metodo: 'POST', corpo: credenciais, publica: true }),
  },
  projetos: {
    publicar: (dados) => requisitar('/projetos', { metodo: 'POST', corpo: dados }),
    listarAbertos: (filtros) => requisitar(`/projetos${consulta(filtros)}`),
    listarMeus: () => requisitar('/projetos/meus'),
    buscar: (id) => requisitar(`/projetos/${id}`),
    cancelar: (id) => requisitar(`/projetos/${id}/cancelamento`, { metodo: 'POST' }),
  },
  propostas: {
    enviar: (projetoId, dados) =>
      requisitar(`/projetos/${projetoId}/propostas`, { metodo: 'POST', corpo: dados }),
    listarDoProjeto: (projetoId) => requisitar(`/projetos/${projetoId}/propostas`),
  },
  contratos: {
    aceitarProposta: (propostaId) => requisitar(`/propostas/${propostaId}/aceite`, { metodo: 'POST' }),
    listar: () => requisitar('/contratos'),
    buscar: (id) => requisitar(`/contratos/${id}`),
  },
  pagamentos: {
    realizar: (contratoId) => requisitar(`/contratos/${contratoId}/pagamento`, { metodo: 'POST' }),
    buscar: async (contratoId) => {
      try {
        return await requisitar<Pagamento>(`/contratos/${contratoId}/pagamento`);
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 404) return null;
        throw erro;
      }
    },
    confirmarEntrega: (contratoId) =>
      requisitar(`/contratos/${contratoId}/confirmacao-entrega`, { metodo: 'POST' }),
  },
};
