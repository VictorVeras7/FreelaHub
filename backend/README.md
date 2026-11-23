# Backend

API em Node.js + Express + TypeScript, organizada em Arquitetura Hexagonal (ADR-001).

## Estrutura

```
src/
  domain/                 entidades e erros de domínio (sem dependência de framework)
  application/
    casos-de-uso/         portas de entrada
    ports/                portas de saída (interfaces)
  adapters/
    in/http/              app Express, rotas, autenticação e tratamento de erros
    out/persistence/      repositórios PostgreSQL
    out/notification/     ConsoleNotificationAdapter (e-mail simulado)
    out/memoria/          adaptadores em memória usados nos testes
  main.ts                 raiz de composição: conecta adaptadores às portas
tests/                    testes com Vitest e Supertest
```

## Executando

Requer Node.js 22.

```bash
cd backend
npm install
cp .env.example .env   # ajuste DATABASE_URL
npm run dev
```

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe a API com recarga automática (tsx) |
| `npm run typecheck` | Verifica os tipos sem gerar arquivos |
| `npm test` | Executa os testes |
| `npm run build` | Compila para `dist/` |
| `npm start` | Executa a versão compilada |

O CI (`.github/workflows/backend.yml`) roda tipos, testes e build em todo pull request que altera o backend.

## Banco de dados

A API aplica as migrations pendentes ao subir. Para executar manualmente, com `DATABASE_URL` definida:

```bash
npm run migrate
npm run migrate:down
```

## Como cada fatia se conecta

1. Entidades e regras em `src/domain/<entidade>/`.
2. Casos de uso em `src/application/casos-de-uso/` e portas de saída em `src/application/ports/`.
3. Rotas em `src/adapters/in/http/rotas/<recurso>.ts`, exportando uma função `criarRotasDe...` que devolve um `Router`.
4. Registro das rotas e dos adaptadores concretos em `src/main.ts`.

Erros de domínio (`src/domain/erros.ts`) são convertidos em status HTTP por `tratarErros` (400, 401, 403, 404 e 409, ADR-003).

O middleware `autenticar` (RF01) valida o token e grava o usuário em `req.usuario`. As rotas leem esse valor com `obterSolicitante(req)`.

## Documentação das rotas

- [Projetos](../docs/api/projetos.md)
- [Propostas](../docs/api/propostas.md)
