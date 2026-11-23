import { ProjetoConsulta, ProjetoResumo } from '../../../application/ports/ProjetoConsulta';
import { FiltrosProjetos, ProjetoRepository } from '../../../application/ports/ProjetoRepository';
import { ErroConflito } from '../../../domain/erros';
import { Projeto, StatusProjeto, TRANSICOES_PROJETO } from '../../../domain/projeto/Projeto';
import { Consultavel } from './Consultavel';

interface LinhaProjeto {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string;
  orcamento: string; // NUMERIC chega como string no driver pg
  prazo_desejado: string | null;
  habilidades: string[];
  status: StatusProjeto;
  criado_em: Date;
}

// DATE é lido como texto AAAA-MM-DD para não sofrer conversão de fuso horário.
const COLUNAS = `id, cliente_id, titulo, descricao, orcamento,
  to_char(prazo_desejado, 'YYYY-MM-DD') AS prazo_desejado, habilidades, status, criado_em`;
/** Pares (de, para) do ciclo de vida, gerados a partir do domínio para não duplicar a regra. */
const TRANSICOES_SQL = TRANSICOES_PROJETO.map(([de, para]) => `('${de}', '${para}')`).join(', ');
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Adaptador PostgreSQL da porta ProjetoRepository (tabela `projetos`, ADR-005).
 * Implementa também a porta ProjetoConsulta usada pela fatia de propostas.
 */
export class PostgresProjetoRepository implements ProjetoRepository, ProjetoConsulta {
  constructor(private readonly db: Consultavel) {}

  async salvar(projeto: Projeto): Promise<void> {
    const dados = projeto.paraDados();
    // Depois de criado, só o status do projeto muda (seção 7 dos requisitos). A atualização só
    // acontece se o status gravado permitir a transição: em operações simultâneas (por exemplo,
    // cancelamento e aceite de proposta), a segunda a gravar encontra o status já alterado e recebe 409.
    const resultado = await this.db.query(
      `INSERT INTO projetos
         (id, cliente_id, titulo, descricao, orcamento, prazo_desejado, habilidades, status, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
       WHERE projetos.status = EXCLUDED.status
          OR (projetos.status, EXCLUDED.status) IN (${TRANSICOES_SQL})`,
      [
        dados.id,
        dados.clienteId,
        dados.titulo,
        dados.descricao,
        dados.orcamento,
        dados.prazoDesejado,
        dados.habilidades,
        dados.status,
        dados.criadoEm,
      ],
    );
    if (resultado.rowCount === 0) {
      throw new ErroConflito(`O projeto foi alterado por outra operação e não pode passar para ${dados.status}.`);
    }
  }

  async buscarPorId(id: string): Promise<Projeto | null> {
    if (!FORMATO_UUID.test(id)) return null;
    const resultado = await this.db.query<LinhaProjeto>(`SELECT ${COLUNAS} FROM projetos WHERE id = $1`, [id]);
    return resultado.rows[0] ? paraEntidade(resultado.rows[0]) : null;
  }

  async listarAbertos(filtros: FiltrosProjetos): Promise<Projeto[]> {
    const condicoes = ['status = $1'];
    const valores: unknown[] = [StatusProjeto.ABERTO];
    if (filtros.habilidade !== undefined) {
      valores.push(filtros.habilidade);
      condicoes.push(`EXISTS (SELECT 1 FROM unnest(habilidades) AS h WHERE lower(h) = lower($${valores.length}))`);
    }
    if (filtros.orcamentoMin !== undefined) {
      valores.push(filtros.orcamentoMin);
      condicoes.push(`orcamento >= $${valores.length}`);
    }
    if (filtros.orcamentoMax !== undefined) {
      valores.push(filtros.orcamentoMax);
      condicoes.push(`orcamento <= $${valores.length}`);
    }
    const resultado = await this.db.query<LinhaProjeto>(
      `SELECT ${COLUNAS} FROM projetos WHERE ${condicoes.join(' AND ')} ORDER BY criado_em DESC`,
      valores,
    );
    return resultado.rows.map(paraEntidade);
  }

  async listarPorCliente(clienteId: string): Promise<Projeto[]> {
    if (!FORMATO_UUID.test(clienteId)) return [];
    const resultado = await this.db.query<LinhaProjeto>(
      `SELECT ${COLUNAS} FROM projetos WHERE cliente_id = $1 ORDER BY criado_em DESC`,
      [clienteId],
    );
    return resultado.rows.map(paraEntidade);
  }

  async buscarResumo(projetoId: string): Promise<ProjetoResumo | null> {
    const projeto = await this.buscarPorId(projetoId);
    return projeto
      ? { id: projeto.id, clienteId: projeto.clienteId, titulo: projeto.titulo, status: projeto.status }
      : null;
  }
}

function paraEntidade(linha: LinhaProjeto): Projeto {
  return Projeto.restaurar({
    id: linha.id,
    clienteId: linha.cliente_id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    orcamento: Number(linha.orcamento),
    prazoDesejado: linha.prazo_desejado,
    habilidades: linha.habilidades,
    status: linha.status,
    criadoEm: linha.criado_em,
  });
}
