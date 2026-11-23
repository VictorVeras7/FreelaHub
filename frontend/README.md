# Frontend

Aplicação web do FreelaHub em React, TypeScript e Vite.

## Como rodar

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

A aplicação abre em http://127.0.0.1:5173.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_USE_MOCK` | `true` | Com `true`, usa adaptadores simulados em memória. Com `false`, usa a API real. |
| `VITE_API_URL` | `/api` | Endereço da API. Em desenvolvimento, o Vite encaminha `/api` para `API_PROXY_TARGET` (padrão `http://localhost:3000`). |

No modo simulado, a tela de login tem atalhos para entrar como cliente ou freelancer. Os dados voltam ao estado inicial quando a página é recarregada.

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Testes com Vitest e Testing Library |

## Organização

```
src/
  app/          rotas, providers, layout e guardas de acesso
  pages/        uma pasta por tela
  components/   componentes visuais reutilizáveis
  features/     sessão e hooks de projetos, propostas e contratos
  api/
    ports/      interfaces por recurso
    http/       adaptadores reais
    mock/       adaptadores simulados
    index.ts    escolha do adaptador por VITE_USE_MOCK
  styles/       tokens de design e estilos globais
  utils/        formatação e rótulos de status
```

As telas não chamam `fetch` diretamente: usam hooks que dependem das portas em `api/ports`. O padrão visual está em [ESTILO.md](ESTILO.md).

## Rotas de API pendentes de confirmação

- `GET /projetos/meus` (Emilly): necessária para a tela Meus projetos.
- `GET /contratos/{id}/pagamento` (Enzo): necessária para o status do pagamento.
