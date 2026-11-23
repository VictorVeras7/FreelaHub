import { InMemoryProjetoRepository } from '../../src/adapters/out/memoria/InMemoryProjetoRepository';
import { Solicitante } from '../../src/application/Solicitante';
import { PerfilUsuario } from '../../src/domain/PerfilUsuario';
import { NovoProjeto, Projeto, StatusProjeto } from '../../src/domain/projeto/Projeto';
import { UsuarioRepositoryEmMemoria } from '../unit/fakes';

export const dadosDoProjeto = {
  titulo: 'Landing page',
  descricao: 'Página de captura para o lançamento.',
  orcamento: 1500,
  prazoDesejado: '2026-12-20',
  habilidades: ['React', 'Tailwind'],
};

/** Repositórios em memória com uma cliente (Ana), um segundo cliente (Bruno) e um freelancer (Caio). */
export async function cenarioDeProjetos() {
  const usuarios = new UsuarioRepositoryEmMemoria();
  const projetos = new InMemoryProjetoRepository();
  const incluir = async (nome: string, perfil: PerfilUsuario): Promise<Solicitante> => {
    const usuario = await usuarios.incluir({ nome, email: `${nome.toLowerCase()}@exemplo.com`, senhaHash: 'hash', perfil });
    return { id: usuario.id, perfil: usuario.perfil };
  };
  const ana = await incluir('Ana', PerfilUsuario.CLIENTE);
  const bruno = await incluir('Bruno', PerfilUsuario.CLIENTE);
  const caio = await incluir('Caio', PerfilUsuario.FREELANCER);

  let sequencia = 0;
  /** Grava um projeto direto no repositório, já no status pedido. */
  const adicionarProjeto = async (
    clienteId: string,
    dados: Partial<Omit<NovoProjeto, 'id' | 'clienteId'>> = {},
    status: StatusProjeto = 'ABERTO',
  ): Promise<Projeto> => {
    sequencia += 1;
    const criado = Projeto.criar(
      { id: `projeto-${sequencia}`, clienteId, ...dadosDoProjeto, ...dados },
      new Date(Date.UTC(2026, 10, 1, 0, sequencia)),
    );
    const projeto = Projeto.restaurar({ ...criado.paraDados(), status });
    await projetos.salvar(projeto);
    return projeto;
  };

  return { usuarios, projetos, ana, bruno, caio, adicionarProjeto };
}
