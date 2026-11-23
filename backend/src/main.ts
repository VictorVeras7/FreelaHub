import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { criarApp } from './adapters/in/http/app';
import { criarContratoController } from './adapters/in/http/ContratoController';
import { autenticar as middlewareAutenticar } from './adapters/in/http/authMiddleware';
import { criarRotasDePropostas } from './adapters/in/http/rotas/propostas';
import { ConsoleNotificationAdapter } from './adapters/out/notification/ConsoleNotificationAdapter';
import { PostgresContratoRepository } from './adapters/out/persistence/PostgresContratoRepository';
import { PostgresProjetoConsulta } from './adapters/out/persistence/PostgresProjetoConsulta';
import { PostgresProjetoInicio } from './adapters/out/persistence/PostgresProjetoInicio';
import { PostgresPropostaRepository } from './adapters/out/persistence/PostgresPropostaRepository';
import { PostgresUnidadeDeTrabalho } from './adapters/out/persistence/PostgresUnidadeDeTrabalho';
import { PostgresUsuarioRepository } from './adapters/out/persistence/PostgresUsuarioRepository';
import { aplicarMigrations } from './adapters/out/persistence/migrations/Migrador';
import { carregarAdministrador } from './adapters/out/persistence/seedAdministrador';
import { BcryptSenhaHasher } from './adapters/out/security/BcryptSenhaHasher';
import { JwtTokenService } from './adapters/out/security/JwtTokenService';
import { AceitarProposta } from './application/casos-de-uso/AceitarProposta';
import { ConsultarContratos } from './application/casos-de-uso/ConsultarContratos';
import { EnviarProposta } from './application/casos-de-uso/EnviarProposta';
import { ListarPropostasDoProjeto } from './application/casos-de-uso/ListarPropostasDoProjeto';
import { Autenticar } from './application/usecases/Autenticar';
import { Cadastrar } from './application/usecases/Cadastrar';
import { carregarConfig } from './config';

async function iniciar(): Promise<void> {
  const config = carregarConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  const hasher = new BcryptSenhaHasher();
  const tokens = new JwtTokenService(config.jwtSecret, config.jwtExpiracaoSegundos);
  const usuarios = new PostgresUsuarioRepository(pool);
  const unidadeDeTrabalho = new PostgresUnidadeDeTrabalho(pool);
  const projetos = new PostgresProjetoConsulta(unidadeDeTrabalho.conexao);
  const propostas = new PostgresPropostaRepository(unidadeDeTrabalho.conexao);
  const contratos = new PostgresContratoRepository(unidadeDeTrabalho.conexao);
  const projetoInicio = new PostgresProjetoInicio(unidadeDeTrabalho.conexao);
  const notificacoes = new ConsoleNotificationAdapter();

  const autenticacao = middlewareAutenticar(tokens);

  await aplicarMigrations(pool);
  await carregarAdministrador(pool, hasher, { email: config.adminEmail, senha: config.adminSenha });

  const app = criarApp({
    cadastrar: new Cadastrar(usuarios, hasher),
    autenticar: new Autenticar(usuarios, hasher, tokens),
    rotasAdicionais: [
      criarRotasDePropostas({
        enviarProposta: new EnviarProposta(projetos, propostas, notificacoes, randomUUID),
        listarPropostasDoProjeto: new ListarPropostasDoProjeto(projetos, propostas, usuarios),
        autenticar: autenticacao,
      }),
      criarContratoController({
        aceitarProposta: new AceitarProposta({
          propostas,
          projetos,
          projetoInicio,
          contratos,
          unidadeDeTrabalho,
          notificacoes,
          gerarId: randomUUID,
        }),
        consultarContratos: new ConsultarContratos(contratos),
        autenticar: autenticacao,
      }),
    ],
  });
  app.listen(config.porta, () => console.log(`API do FreelaHub na porta ${config.porta}`));
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a API:', erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
