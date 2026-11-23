import { ProjetoConsulta, ProjetoResumo, StatusProjeto } from '../../../application/ports/ProjetoConsulta';
import { Consultavel } from './Consultavel';

interface LinhaProjeto {
  id: string;
  cliente_id: string;
  titulo: string;
  status: StatusProjeto;
}

/**
 * Leitura mínima da tabela `projetos` usada pela fatia de propostas.
 * Quando o PostgresProjetoRepository (RF02/RF03) existir, ele pode implementar
 * a porta ProjetoConsulta e este adaptador deixa de ser necessário.
 */
export class PostgresProjetoConsulta implements ProjetoConsulta {
  constructor(private readonly db: Consultavel) {}

  async buscarResumo(projetoId: string): Promise<ProjetoResumo | null> {
    const resultado = await this.db.query<LinhaProjeto>(
      'SELECT id, cliente_id, titulo, status FROM projetos WHERE id = $1',
      [projetoId],
    );
    const linha = resultado.rows[0];
    if (!linha) return null;
    return { id: linha.id, clienteId: linha.cliente_id, titulo: linha.titulo, status: linha.status };
  }
}
