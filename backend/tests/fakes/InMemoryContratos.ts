import { ContratoDetalhado, ContratoRepository } from '../../src/application/ports/ContratoRepository';
import { ProjetoInicio } from '../../src/application/ports/ProjetoInicio';
import { UnidadeDeTrabalho } from '../../src/application/ports/UnidadeDeTrabalho';
import { Contrato } from '../../src/domain/contrato/Contrato';
import { ErroConflito } from '../../src/domain/erros';
import { InMemoryProjetoConsulta } from './InMemoryProjetoConsulta';

export class InMemoryContratoRepository implements ContratoRepository {
  readonly registros = new Map<string, ContratoDetalhado>();

  capturar(): () => void {
    const copia = new Map(this.registros);
    return () => {
      this.registros.clear();
      copia.forEach((contrato, id) => this.registros.set(id, contrato));
    };
  }

  async salvar(contrato: Contrato): Promise<void> {
    this.registros.set(contrato.id, {
      ...contrato.paraDados(),
      projetoTitulo: 'Landing page',
      clienteNome: 'Cliente',
      freelancerNome: 'Freelancer',
    });
  }

  async buscarPorId(id: string): Promise<ContratoDetalhado | null> {
    return this.registros.get(id) ?? null;
  }

  async listarPorUsuario(usuarioId: string): Promise<ContratoDetalhado[]> {
    return [...this.registros.values()].filter((c) => c.clienteId === usuarioId || c.freelancerId === usuarioId);
  }
}

export class InMemoryProjetoInicio implements ProjetoInicio {
  constructor(private readonly projetos: InMemoryProjetoConsulta) {}

  async iniciar(projetoId: string): Promise<void> {
    const projeto = await this.projetos.buscarResumo(projetoId);
    if (projeto?.status !== 'ABERTO') throw new ErroConflito('O projeto não está aberto.');
    this.projetos.adicionar({ ...projeto, status: 'EM_ANDAMENTO' });
  }
}

interface Transacional {
  capturar(): () => void;
}

/** Descarta as alterações dos repositórios participantes quando o trabalho lança erro. */
export class UnidadeDeTrabalhoFalsa implements UnidadeDeTrabalho {
  execucoes = 0;
  confirmacoes = 0;
  private readonly participantes: Transacional[];

  constructor(...participantes: Transacional[]) {
    this.participantes = participantes;
  }

  async executar<T>(trabalho: () => Promise<T>): Promise<T> {
    this.execucoes += 1;
    const restauracoes = this.participantes.map((participante) => participante.capturar());
    try {
      const resultado = await trabalho();
      this.confirmacoes += 1;
      return resultado;
    } catch (erro) {
      restauracoes.forEach((restaurar) => restaurar());
      throw erro;
    }
  }
}
