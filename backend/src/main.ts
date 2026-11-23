import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { criarApp } from './adapters/in/http/app';
import { autenticar as middlewareAutenticar } from './adapters/in/http/authMiddleware';
import { criarRotasDePropostas } from './adapters/in/http/rotas/propostas';
import { ConsoleNotificationAdapter } from './adapters/out/notification/ConsoleNotificationAdapter';
import { PostgresProjetoConsulta } from './adapters/out/persistence/PostgresProjetoConsulta';
import { PostgresPropostaRepository } from './adapters/out/persistence/PostgresPropostaRepository';
import { PostgresUsuarioRepository } from './adapters/out/persistence/PostgresUsuarioRepository';
import { aplicarMigrations } from './adapters/out/persistence/migrations/Migrador';
import { carregarAdministrador } from './adapters/out/persistence/seedAdministrador';
import { BcryptSenhaHasher } from './adapters/out/security/BcryptSenhaHasher';
import { JwtTokenService } from './adapters/out/security/JwtTokenService';
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
  const projetos = new PostgresProjetoConsulta(pool);
  const propostas = new PostgresPropostaRepository(pool);
  const notificacoes = new ConsoleNotificationAdapter();

  await aplicarMigrations(pool);
  await carregarAdministrador(pool, hasher, { email: config.adminEmail, senha: config.adminSenha });

  const app = criarApp({
    cadastrar: new Cadastrar(usuarios, hasher),
    autenticar: new Autenticar(usuarios, hasher, tokens),
    rotasAdicionais: [
      criarRotasDePropostas({
        enviarProposta: new EnviarProposta(projetos, propostas, notificacoes, randomUUID),
        listarPropostasDoProjeto: new ListarPropostasDoProjeto(projetos, propostas),
        autenticar: middlewareAutenticar(tokens),
      }),
    ],
  });
  app.listen(config.porta, () => console.log(`API do FreelaHub na porta ${config.porta}`));
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a API:', erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
