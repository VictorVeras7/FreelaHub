import { ContratoDetalhado, ContratoRepository } from '../../../application/ports/ContratoRepository';
import { Contrato, StatusContrato } from '../../../domain/contrato/Contrato';
import { ErroConflito } from '../../../domain/erros';
import { Consultavel } from './Consultavel';

interface LinhaContrato {
  id: string;
  projeto_id: string;
  proposta_id: string;
  cliente_id: string;
  freelancer_id: string;
  valor: string; // NUMERIC chega como string no driver pg
  prazo_dias: number;
  status: StatusContrato;
  criado_em: Date;
  projeto_titulo: string;
  cliente_nome: string;
  freelancer_nome: string;
}

const CONSULTA = `
  SELECT c.id, c.projeto_id, c.proposta_id, c.cliente_id, c.freelancer_id, c.valor, c.prazo_dias,
         c.status, c.criado_em, p.titulo AS projeto_titulo, uc.nome AS cliente_nome, uf.nome AS freelancer_nome
    FROM contratos c
    JOIN projetos p ON p.id = c.projeto_id
    JOIN usuarios uc ON uc.id = c.cliente_id
    JOIN usuarios uf ON uf.id = c.freelancer_id`;

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIOLACAO_DE_UNICIDADE = '23505';
const VIOLACAO_DE_CHAVE_ESTRANGEIRA = '23503';

/** Adaptador PostgreSQL da porta ContratoRepository (tabela `contratos`, ADR-005). */
export class PostgresContratoRepository implements ContratoRepository {
  constructor(private readonly db: Consultavel) {}

  async salvar(contrato: Contrato): Promise<void> {
    const d = contrato.paraDados();
    try {
      await this.db.query(
        `INSERT INTO contratos (id, projeto_id, proposta_id, cliente_id, freelancer_id, valor, prazo_dias, status, criado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [d.id, d.projetoId, d.propostaId, d.clienteId, d.freelancerId, d.valor, d.prazoDias, d.status, d.criadoEm],
      );
    } catch (erro) {
      const codigo = (erro as { code?: string }).code;
      if (codigo === VIOLACAO_DE_UNICIDADE) throw new ErroConflito('Este projeto já tem um contrato.');
      if (codigo === VIOLACAO_DE_CHAVE_ESTRANGEIRA) {
        throw new ErroConflito('O contrato referencia um registro inexistente.');
      }
      throw erro;
    }
  }

  async buscarPorId(id: string): Promise<ContratoDetalhado | null> {
    if (!FORMATO_UUID.test(id)) return null;
    const resultado = await this.db.query<LinhaContrato>(`${CONSULTA} WHERE c.id = $1`, [id]);
    return resultado.rows[0] ? paraDetalhado(resultado.rows[0]) : null;
  }

  async listarPorUsuario(usuarioId: string): Promise<ContratoDetalhado[]> {
    const resultado = await this.db.query<LinhaContrato>(
      `${CONSULTA} WHERE c.cliente_id = $1 OR c.freelancer_id = $1 ORDER BY c.criado_em DESC`,
      [usuarioId],
    );
    return resultado.rows.map(paraDetalhado);
  }
}

function paraDetalhado(l: LinhaContrato): ContratoDetalhado {
  return {
    id: l.id,
    projetoId: l.projeto_id,
    propostaId: l.proposta_id,
    clienteId: l.cliente_id,
    freelancerId: l.freelancer_id,
    valor: Number(l.valor),
    prazoDias: l.prazo_dias,
    status: l.status,
    criadoEm: l.criado_em,
    projetoTitulo: l.projeto_titulo,
    clienteNome: l.cliente_nome,
    freelancerNome: l.freelancer_nome,
  };
}
