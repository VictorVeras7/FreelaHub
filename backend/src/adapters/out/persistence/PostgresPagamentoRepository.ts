import { PagamentoRepository } from '../../../application/ports/PagamentoRepository';
import { Pagamento, StatusPagamento } from '../../../domain/pagamento/Pagamento';
import { ErroConflito } from '../../../domain/erros';
import { Consultavel } from './Consultavel';

interface LinhaPagamento {
  id: string;
  contrato_id: string;
  valor: string;
  status: StatusPagamento;
  transacao_id: string | null;
  atualizado_em: Date;
}

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIOLACAO_DE_UNICIDADE = '23505';

/** Adaptador PostgreSQL da porta PagamentoRepository (tabela `pagamentos`, ADR-006). */
export class PostgresPagamentoRepository implements PagamentoRepository {
  constructor(private readonly db: Consultavel) {}

  async salvar(pagamento: Pagamento): Promise<void> {
    const dados = pagamento.paraDados();
    try {
      await this.db.query(
        `INSERT INTO pagamentos (id, contrato_id, valor, status, transacao_id, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
           SET status = EXCLUDED.status, transacao_id = EXCLUDED.transacao_id,
               atualizado_em = EXCLUDED.atualizado_em`,
        [dados.id, dados.contratoId, dados.valor, dados.status, dados.transacaoId, dados.atualizadoEm],
      );
    } catch (erro) {
      if ((erro as { code?: string }).code === VIOLACAO_DE_UNICIDADE) {
        throw new ErroConflito('Este contrato já possui um pagamento.');
      }
      throw erro;
    }
  }

  async buscarPorContrato(contratoId: string): Promise<Pagamento | null> {
    if (!FORMATO_UUID.test(contratoId)) return null;
    const resultado = await this.db.query<LinhaPagamento>(
      `SELECT id, contrato_id, valor, status, transacao_id, atualizado_em
         FROM pagamentos WHERE contrato_id = $1`,
      [contratoId],
    );
    const linha = resultado.rows[0];
    return linha
      ? Pagamento.restaurar({
          id: linha.id,
          contratoId: linha.contrato_id,
          valor: Number(linha.valor),
          status: linha.status,
          transacaoId: linha.transacao_id,
          atualizadoEm: linha.atualizado_em,
        })
      : null;
  }
}
