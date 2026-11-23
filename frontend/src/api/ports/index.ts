export type Perfil = 'CLIENTE' | 'FREELANCER' | 'ADMINISTRADOR';
export type StatusProjeto = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusProposta = 'PENDENTE' | 'ACEITA' | 'RECUSADA';
export type StatusContrato = 'ATIVO' | 'CONCLUIDO';
export type StatusPagamento = 'PENDENTE' | 'RETIDO' | 'LIBERADO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Projeto {
  id: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  descricao: string;
  orcamento: number;
  prazoDesejado: string | null;
  habilidades: string[];
  status: StatusProjeto;
  criadoEm: string;
}

export interface Proposta {
  id: string;
  projetoId: string;
  freelancerId: string;
  freelancerNome: string;
  valor: number;
  prazoDias: number;
  mensagem: string;
  status: StatusProposta;
  criadaEm: string;
}

export interface Contrato {
  id: string;
  projetoId: string;
  projetoTitulo: string;
  propostaId: string;
  clienteId: string;
  clienteNome: string;
  freelancerId: string;
  freelancerNome: string;
  valor: number;
  prazoDias: number;
  status: StatusContrato;
  criadoEm: string;
}

export interface Pagamento {
  id: string;
  contratoId: string;
  valor: number;
  status: StatusPagamento;
  transacaoId: string | null;
  atualizadoEm: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: 'CLIENTE' | 'FREELANCER';
}

export interface Credenciais {
  email: string;
  senha: string;
}

export interface SessaoAutenticada {
  token: string;
  usuario: Usuario;
}

export interface NovoProjeto {
  titulo: string;
  descricao: string;
  orcamento: number;
  prazoDesejado: string;
  habilidades: string[];
}

export interface FiltrosProjetos {
  habilidade?: string;
  orcamentoMin?: number;
  orcamentoMax?: number;
}

export interface NovaProposta {
  valor: number;
  prazoDias: number;
  mensagem: string;
}

export interface AuthApi {
  cadastrar(dados: NovoUsuario): Promise<Usuario>;
  entrar(credenciais: Credenciais): Promise<SessaoAutenticada>;
}

export interface ProjetosApi {
  publicar(dados: NovoProjeto): Promise<Projeto>;
  listarAbertos(filtros: FiltrosProjetos): Promise<Projeto[]>;
  listarMeus(): Promise<Projeto[]>;
  buscar(id: string): Promise<Projeto>;
  cancelar(id: string): Promise<Projeto>;
}

export interface PropostasApi {
  enviar(projetoId: string, dados: NovaProposta): Promise<Proposta>;
  listarDoProjeto(projetoId: string): Promise<Proposta[]>;
}

export interface ContratosApi {
  aceitarProposta(propostaId: string): Promise<Contrato>;
  listar(): Promise<Contrato[]>;
  buscar(id: string): Promise<Contrato>;
}

export interface PagamentosApi {
  realizar(contratoId: string): Promise<Pagamento>;
  /** Retorna null quando o contrato ainda não tem pagamento (404 na API). */
  buscar(contratoId: string): Promise<Pagamento | null>;
  confirmarEntrega(contratoId: string): Promise<Pagamento>;
}

export interface Api {
  auth: AuthApi;
  projetos: ProjetosApi;
  propostas: PropostasApi;
  contratos: ContratosApi;
  pagamentos: PagamentosApi;
}
