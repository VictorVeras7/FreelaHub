import { ApiError } from '@/api/ApiError';
import type { Api, Contrato, Pagamento, Projeto, Proposta, Usuario } from '@/api/ports';
import { avisarSessaoExpirada, lerSessao } from '@/features/sessao/armazenamento';
import { criarBancoInicial, type BancoMock } from './dados';

const copia = <T>(valor: T): T => structuredClone(valor);
const agora = (): string => new Date().toISOString();

export function criarMockApi(banco: BancoMock = criarBancoInicial(), latenciaMs = 180): Api {
  const responder = async <T>(acao: () => T): Promise<T> => {
    if (latenciaMs > 0) await new Promise((fim) => setTimeout(fim, latenciaMs));
    return copia(acao());
  };

  const usuarioLogado = (): Usuario => {
    const id = lerSessao()?.usuario.id;
    const usuario = banco.usuarios.find((u) => u.id === id);
    if (!usuario) {
      avisarSessaoExpirada();
      throw new ApiError(401, 'SESSAO_EXPIRADA', 'Sua sessão expirou. Entre novamente.');
    }
    return usuario;
  };

  const exigirPerfil = (perfil: Usuario['perfil']): Usuario => {
    const usuario = usuarioLogado();
    if (usuario.perfil !== perfil) {
      throw new ApiError(403, 'PERFIL_NAO_PERMITIDO', 'Seu perfil não permite esta ação.');
    }
    return usuario;
  };

  const projetoPorId = (id: string): Projeto => {
    const projeto = banco.projetos.find((p) => p.id === id);
    if (!projeto) throw new ApiError(404, 'PROJETO_NAO_ENCONTRADO', 'Projeto não encontrado.');
    return projeto;
  };

  const exigirDono = (projeto: Projeto, usuario: Usuario): void => {
    if (projeto.clienteId !== usuario.id) {
      throw new ApiError(403, 'NAO_E_DONO', 'Apenas o cliente que publicou o projeto pode fazer isso.');
    }
  };

  const contratoDoParticipante = (id: string, usuario: Usuario): Contrato => {
    const contrato = banco.contratos.find((c) => c.id === id);
    if (!contrato) throw new ApiError(404, 'CONTRATO_NAO_ENCONTRADO', 'Contrato não encontrado.');
    if (contrato.clienteId !== usuario.id && contrato.freelancerId !== usuario.id) {
      throw new ApiError(403, 'NAO_E_PARTICIPANTE', 'Você não participa deste contrato.');
    }
    return contrato;
  };

  const contratoDoCliente = (id: string): Contrato => {
    const usuario = exigirPerfil('CLIENTE');
    const contrato = contratoDoParticipante(id, usuario);
    return contrato;
  };

  return {
    auth: {
      cadastrar: (dados) =>
        responder(() => {
          const email = dados.email.toLowerCase();
          if (banco.usuarios.some((u) => u.email === email)) {
            throw new ApiError(409, 'EMAIL_JA_CADASTRADO', 'Já existe uma conta com este e-mail.');
          }
          const usuario = { id: crypto.randomUUID(), nome: dados.nome, email, perfil: dados.perfil, senha: dados.senha };
          banco.usuarios.push(usuario);
          return { id: usuario.id, nome: usuario.nome, email, perfil: usuario.perfil };
        }),
      entrar: ({ email, senha }) =>
        responder(() => {
          const achado = banco.usuarios.find((u) => u.email === email.toLowerCase() && u.senha === senha);
          if (!achado) throw new ApiError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos.');
          return {
            token: `simulado.${achado.id}`,
            usuario: { id: achado.id, nome: achado.nome, email: achado.email, perfil: achado.perfil },
          };
        }),
    },

    projetos: {
      publicar: (dados) =>
        responder(() => {
          const cliente = exigirPerfil('CLIENTE');
          const projeto: Projeto = {
            ...dados,
            id: crypto.randomUUID(),
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            status: 'ABERTO',
            criadoEm: agora(),
          };
          banco.projetos.unshift(projeto);
          return projeto;
        }),
      listarAbertos: ({ habilidade, orcamentoMin, orcamentoMax }) =>
        responder(() => {
          exigirPerfil('FREELANCER');
          const termo = habilidade?.trim().toLowerCase();
          return banco.projetos.filter(
            (p) =>
              p.status === 'ABERTO' &&
              (!termo || p.habilidades.some((h) => h.toLowerCase().includes(termo))) &&
              (orcamentoMin === undefined || p.orcamento >= orcamentoMin) &&
              (orcamentoMax === undefined || p.orcamento <= orcamentoMax),
          );
        }),
      listarMeus: () =>
        responder(() => {
          const cliente = exigirPerfil('CLIENTE');
          return banco.projetos.filter((p) => p.clienteId === cliente.id);
        }),
      buscar: (id) =>
        responder(() => {
          usuarioLogado();
          return projetoPorId(id);
        }),
      cancelar: (id) =>
        responder(() => {
          const cliente = exigirPerfil('CLIENTE');
          const projeto = projetoPorId(id);
          exigirDono(projeto, cliente);
          if (projeto.status !== 'ABERTO') {
            throw new ApiError(409, 'PROJETO_NAO_ABERTO', 'Só é possível cancelar projetos abertos.');
          }
          projeto.status = 'CANCELADO';
          banco.propostas
            .filter((p) => p.projetoId === id && p.status === 'PENDENTE')
            .forEach((p) => {
              p.status = 'RECUSADA';
            });
          return projeto;
        }),
    },

    propostas: {
      enviar: (projetoId, dados) =>
        responder(() => {
          const freelancer = exigirPerfil('FREELANCER');
          const projeto = projetoPorId(projetoId);
          if (projeto.status !== 'ABERTO') {
            throw new ApiError(409, 'PROJETO_NAO_ABERTO', 'O projeto não está aberto para propostas.');
          }
          if (banco.propostas.some((p) => p.projetoId === projetoId && p.freelancerId === freelancer.id)) {
            throw new ApiError(409, 'PROPOSTA_DUPLICADA', 'Você já enviou uma proposta para este projeto.');
          }
          const proposta: Proposta = {
            ...dados,
            id: crypto.randomUUID(),
            projetoId,
            freelancerId: freelancer.id,
            freelancerNome: freelancer.nome,
            status: 'PENDENTE',
            criadaEm: agora(),
          };
          banco.propostas.push(proposta);
          return proposta;
        }),
      listarDoProjeto: (projetoId) =>
        responder(() => {
          const cliente = exigirPerfil('CLIENTE');
          exigirDono(projetoPorId(projetoId), cliente);
          return banco.propostas.filter((p) => p.projetoId === projetoId);
        }),
    },

    contratos: {
      aceitarProposta: (propostaId) =>
        responder(() => {
          const cliente = exigirPerfil('CLIENTE');
          const proposta = banco.propostas.find((p) => p.id === propostaId);
          if (!proposta) throw new ApiError(404, 'PROPOSTA_NAO_ENCONTRADA', 'Proposta não encontrada.');
          const projeto = projetoPorId(proposta.projetoId);
          exigirDono(projeto, cliente);
          if (projeto.status !== 'ABERTO') {
            throw new ApiError(409, 'PROJETO_NAO_ABERTO', 'O projeto não está aberto.');
          }
          if (proposta.status !== 'PENDENTE') {
            throw new ApiError(409, 'PROPOSTA_NAO_PENDENTE', 'Esta proposta não está pendente.');
          }
          banco.propostas
            .filter((p) => p.projetoId === projeto.id)
            .forEach((p) => {
              p.status = p.id === proposta.id ? 'ACEITA' : 'RECUSADA';
            });
          projeto.status = 'EM_ANDAMENTO';
          const contrato: Contrato = {
            id: crypto.randomUUID(),
            projetoId: projeto.id,
            projetoTitulo: projeto.titulo,
            propostaId: proposta.id,
            clienteId: projeto.clienteId,
            clienteNome: projeto.clienteNome,
            freelancerId: proposta.freelancerId,
            freelancerNome: proposta.freelancerNome,
            valor: proposta.valor,
            prazoDias: proposta.prazoDias,
            status: 'ATIVO',
            criadoEm: agora(),
          };
          banco.contratos.unshift(contrato);
          return contrato;
        }),
      listar: () =>
        responder(() => {
          const usuario = usuarioLogado();
          return banco.contratos.filter((c) => c.clienteId === usuario.id || c.freelancerId === usuario.id);
        }),
      buscar: (id) => responder(() => contratoDoParticipante(id, usuarioLogado())),
    },

    pagamentos: {
      realizar: (contratoId) =>
        responder(() => {
          const contrato = contratoDoCliente(contratoId);
          const existente = banco.pagamentos.find((p) => p.contratoId === contratoId);
          if (existente && existente.status !== 'PENDENTE') {
            throw new ApiError(409, 'PAGAMENTO_JA_REALIZADO', 'O pagamento deste contrato já foi realizado.');
          }
          const pagamento: Pagamento = existente ?? {
            id: crypto.randomUUID(),
            contratoId,
            valor: contrato.valor,
            status: 'PENDENTE',
            transacaoId: null,
            atualizadoEm: agora(),
          };
          pagamento.status = 'RETIDO';
          pagamento.transacaoId = `sim-${crypto.randomUUID().slice(0, 8)}`;
          pagamento.atualizadoEm = agora();
          if (!existente) banco.pagamentos.push(pagamento);
          return pagamento;
        }),
      buscar: (contratoId) =>
        responder(() => {
          contratoDoParticipante(contratoId, usuarioLogado());
          return banco.pagamentos.find((p) => p.contratoId === contratoId) ?? null;
        }),
      confirmarEntrega: (contratoId) =>
        responder(() => {
          const contrato = contratoDoCliente(contratoId);
          const pagamento = banco.pagamentos.find((p) => p.contratoId === contratoId);
          if (!pagamento || pagamento.status !== 'RETIDO') {
            throw new ApiError(409, 'PAGAMENTO_NAO_RETIDO', 'O pagamento precisa estar retido para ser liberado.');
          }
          pagamento.status = 'LIBERADO';
          pagamento.atualizadoEm = agora();
          contrato.status = 'CONCLUIDO';
          projetoPorId(contrato.projetoId).status = 'CONCLUIDO';
          return pagamento;
        }),
    },
  };
}
