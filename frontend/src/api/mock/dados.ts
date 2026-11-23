import type { Contrato, Pagamento, Projeto, Proposta, Usuario } from '@/api/ports';

export interface UsuarioMock extends Usuario {
  senha: string;
}

export interface BancoMock {
  usuarios: UsuarioMock[];
  projetos: Projeto[];
  propostas: Proposta[];
  contratos: Contrato[];
  pagamentos: Pagamento[];
}

/** Contas de demonstração, válidas somente no adaptador simulado. */
export const CONTAS_DEMO = {
  cliente: { email: 'cliente@freelahub.test', senha: 'demo12345' },
  freelancer: { email: 'freelancer@freelahub.test', senha: 'demo12345' },
} as const;

const CLIENTE = { clienteId: 'u-cliente-1', clienteNome: 'Marina Costa' };

const diasAFrente = (dias: number): string => {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
};

export const criarBancoInicial = (): BancoMock => ({
  usuarios: [
    { id: CLIENTE.clienteId, nome: CLIENTE.clienteNome, email: CONTAS_DEMO.cliente.email, senha: CONTAS_DEMO.cliente.senha, perfil: 'CLIENTE' },
    { id: 'u-cliente-2', nome: 'Oficina Norte', email: 'oficina@freelahub.test', senha: 'demo12345', perfil: 'CLIENTE' },
    { id: 'u-free-1', nome: 'Rafael Lima', email: CONTAS_DEMO.freelancer.email, senha: CONTAS_DEMO.freelancer.senha, perfil: 'FREELANCER' },
    { id: 'u-free-2', nome: 'Beatriz Nunes', email: 'beatriz@freelahub.test', senha: 'demo12345', perfil: 'FREELANCER' },
  ],
  projetos: [
    {
      id: 'p-1',
      ...CLIENTE,
      titulo: 'Landing page institucional',
      descricao: 'Site responsivo para uma clínica, com apresentação dos serviços, equipe e formulário de contato integrado ao e-mail.',
      orcamento: 1500,
      prazoDesejado: diasAFrente(20),
      habilidades: ['React', 'Figma'],
      status: 'ABERTO',
      criadoEm: '2026-11-18T12:00:00.000Z',
    },
    {
      id: 'p-2',
      clienteId: 'u-cliente-2',
      clienteNome: 'Oficina Norte',
      titulo: 'API de agendamento de serviços',
      descricao: 'API REST para agendar revisões de veículos, com controle de horários e envio de lembretes.',
      orcamento: 4200,
      prazoDesejado: diasAFrente(35),
      habilidades: ['Node.js', 'PostgreSQL'],
      status: 'ABERTO',
      criadoEm: '2026-11-19T12:00:00.000Z',
    },
    {
      id: 'p-3',
      ...CLIENTE,
      titulo: 'Identidade visual para cafeteria',
      descricao: 'Logotipo, paleta de cores e modelos para redes sociais de uma cafeteria de bairro.',
      orcamento: 900,
      prazoDesejado: diasAFrente(15),
      habilidades: ['Branding', 'Figma'],
      status: 'ABERTO',
      criadoEm: '2026-11-20T12:00:00.000Z',
    },
  ],
  propostas: [
    {
      id: 'pr-1',
      projetoId: 'p-1',
      freelancerId: 'u-free-2',
      freelancerNome: 'Beatriz Nunes',
      valor: 1400,
      prazoDias: 12,
      mensagem: 'Trabalho com sites institucionais há quatro anos e posso entregar o layout em Figma antes da implementação.',
      status: 'PENDENTE',
      criadaEm: '2026-11-21T12:00:00.000Z',
    },
  ],
  contratos: [],
  pagamentos: [],
});
