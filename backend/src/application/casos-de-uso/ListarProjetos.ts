import { ErroValidacao } from '../../domain/erros';
import { FiltrosProjetos, ProjetoRepository } from '../ports/ProjetoRepository';
import { UsuarioRepository } from '../ports/UsuarioRepository';
import { detalharProjetos, ProjetoDetalhado } from './detalharProjetos';

export interface ListarProjetosEntrada {
  habilidade?: unknown;
  orcamentoMin?: unknown;
  orcamentoMax?: unknown;
}

function valorOpcional(valor: unknown, campo: string): number | undefined {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
    throw new ErroValidacao(`O ${campo} deve ser um número maior ou igual a zero.`);
  }
  return valor;
}

function validarFiltros(entrada: ListarProjetosEntrada): FiltrosProjetos {
  const { habilidade } = entrada;
  if (habilidade !== undefined && typeof habilidade !== 'string') {
    throw new ErroValidacao('A habilidade do filtro deve ser um texto.');
  }
  const orcamentoMin = valorOpcional(entrada.orcamentoMin, 'orçamento mínimo');
  const orcamentoMax = valorOpcional(entrada.orcamentoMax, 'orçamento máximo');
  if (orcamentoMin !== undefined && orcamentoMax !== undefined && orcamentoMin > orcamentoMax) {
    throw new ErroValidacao('O orçamento mínimo não pode ser maior que o máximo.');
  }
  const termo = habilidade?.trim();
  return { habilidade: termo ? termo : undefined, orcamentoMin, orcamentoMax };
}

/** RF03: lista somente os projetos ABERTO, com filtros opcionais de habilidade e faixa de orçamento. */
export class ListarProjetos {
  constructor(
    private readonly projetos: ProjetoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(entrada: ListarProjetosEntrada = {}): Promise<ProjetoDetalhado[]> {
    const projetos = await this.projetos.listarAbertos(validarFiltros(entrada));
    return detalharProjetos(projetos, this.usuarios);
  }
}
