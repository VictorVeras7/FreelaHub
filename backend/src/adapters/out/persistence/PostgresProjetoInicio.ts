import { ProjetoInicio } from '../../../application/ports/ProjetoInicio';
import { ErroConflito } from '../../../domain/erros';
import { Consultavel } from './Consultavel';

/** Atualização condicional: em aceites simultâneos, só o primeiro encontra o projeto ABERTO. */
export class PostgresProjetoInicio implements ProjetoInicio {
  constructor(private readonly db: Consultavel) {}

  async iniciar(projetoId: string): Promise<void> {
    const resultado = await this.db.query(
      "UPDATE projetos SET status = 'EM_ANDAMENTO' WHERE id = $1 AND status = 'ABERTO'",
      [projetoId],
    );
    if (resultado.rowCount !== 1) throw new ErroConflito('O projeto não está aberto.');
  }
}
