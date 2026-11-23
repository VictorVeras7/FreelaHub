import { PropostaRepository } from '../../../application/ports/PropostaRepository';
import { ErroConflito } from '../../../domain/erros';
import { Proposta, StatusProposta } from '../../../domain/proposta/Proposta';
import { Consultavel } from './Consultavel';

interface LinhaProposta {
  id: string;
  projeto_id: string;
  freelancer_id: string;
  valor: string; // NUMERIC chega como string no driver pg
  prazo_dias: number;
  mensagem: string;
  status: StatusProposta;
  criada_em: Date;
}

const COLUNAS = 'id, projeto_id, freelancer_id, valor, prazo_dias, mensagem, status, criada_em';
const VIOLACAO_DE_UNICIDADE = '23505';
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adaptador PostgreSQL da porta PropostaRepository (tabela `propostas`, ADR-005). */
export class PostgresPropostaRepository implements PropostaRepository {
  constructor(private readonly db: Consultavel) {}

  async salvar(proposta: Proposta): Promise<void> {
    const dados = proposta.paraDados();
    try {
      await this.db.query(
        `INSERT INTO propostas (${COLUNAS})
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [
          dados.id,
          dados.projetoId,
          dados.freelancerId,
          dados.valor,
          dados.prazoDias,
          dados.mensagem,
          dados.status,
          dados.criadaEm,
        ],
      );
    } catch (erro) {
      // UNIQUE (projeto_id, freelancer_id): duas requisições simultâneas do mesmo freelancer (RN03)
      if ((erro as { code?: string }).code === VIOLACAO_DE_UNICIDADE) {
        throw new ErroConflito('Você já enviou uma proposta para este projeto.');
      }
      throw erro;
    }
  }

  async buscarPorId(id: string): Promise<Proposta | null> {
    if (!FORMATO_UUID.test(id)) return null;
    const resultado = await this.db.query<LinhaProposta>(`SELECT ${COLUNAS} FROM propostas WHERE id = $1`, [id]);
    return resultado.rows[0] ? paraEntidade(resultado.rows[0]) : null;
  }

  async listarPorProjeto(projetoId: string): Promise<Proposta[]> {
    const resultado = await this.db.query<LinhaProposta>(
      `SELECT ${COLUNAS} FROM propostas WHERE projeto_id = $1 ORDER BY criada_em ASC`,
      [projetoId],
    );
    return resultado.rows.map(paraEntidade);
  }

  async existeDoFreelancerNoProjeto(projetoId: string, freelancerId: string): Promise<boolean> {
    const resultado = await this.db.query(
      'SELECT 1 FROM propostas WHERE projeto_id = $1 AND freelancer_id = $2 LIMIT 1',
      [projetoId, freelancerId],
    );
    return (resultado.rowCount ?? 0) > 0;
  }
}

function paraEntidade(linha: LinhaProposta): Proposta {
  return Proposta.restaurar({
    id: linha.id,
    projetoId: linha.projeto_id,
    freelancerId: linha.freelancer_id,
    valor: Number(linha.valor),
    prazoDias: linha.prazo_dias,
    mensagem: linha.mensagem,
    status: linha.status,
    criadaEm: linha.criada_em,
  });
}
