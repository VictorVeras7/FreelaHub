# API: Projetos (RF02 e RF03)

Rotas da fatia de projetos. Todas exigem o cabeçalho `Authorization: Bearer <token>` (ADR-002) e trocam JSON (ADR-003).

Erros seguem o formato padrão da API:

```json
{ "erro": { "codigo": "CONFLITO", "mensagem": "Mensagem legível para o usuário." } }
```

## Representação de um projeto

Todas as rotas abaixo devolvem projetos neste formato:

```json
{
  "id": "c1d2e3f4-0000-4000-8000-000000000001",
  "clienteId": "a9b8c7d6-0000-4000-8000-000000000002",
  "clienteNome": "Ana Souza",
  "titulo": "Landing page para lançamento",
  "descricao": "Página de captura com formulário e integração com e-mail marketing.",
  "orcamento": 1500,
  "prazoDesejado": "2026-12-20",
  "habilidades": ["React", "Tailwind"],
  "status": "ABERTO",
  "criadoEm": "2026-11-23T13:00:00.000Z"
}
```

`status` é um dos valores do ciclo de vida: `ABERTO`, `EM_ANDAMENTO`, `CONCLUIDO` ou `CANCELADO`. `prazoDesejado` é `null` quando o cliente não informou.

## Publicar projeto

`POST /projetos`

Somente usuários com perfil **Cliente** (RF02).

### Requisição

```json
{
  "titulo": "Landing page para lançamento",
  "descricao": "Página de captura com formulário e integração com e-mail marketing.",
  "orcamento": 1500,
  "prazoDesejado": "2026-12-20",
  "habilidades": ["React", "Tailwind"]
}
```

| Campo | Tipo | Regras |
|---|---|---|
| `titulo` | texto | Obrigatório, até 160 caracteres. Espaços nas pontas são removidos. |
| `descricao` | texto | Obrigatória, até 5000 caracteres. Espaços nas pontas são removidos. |
| `orcamento` | número | Obrigatório, maior que zero. Arredondado para duas casas decimais. |
| `prazoDesejado` | texto | Opcional. Data no formato `AAAA-MM-DD`. |
| `habilidades` | lista de textos | Opcional, até 20 itens de até 50 caracteres. Itens vazios e repetidos (sem diferenciar maiúsculas) são descartados. |

Qualquer `status` enviado é ignorado: todo projeto publicado nasce `ABERTO`.

### Resposta `201 Created`

Cabeçalho `Location: /projetos/{id}` e o projeto criado no corpo.

### Erros

| Status | Quando |
|---|---|
| 400 | Campos ausentes ou inválidos, ou corpo que não é JSON |
| 401 | Token ausente ou inválido |
| 403 | Usuário não é Cliente |

## Listar projetos abertos

`GET /projetos?habilidade=React&orcamentoMin=1000&orcamentoMax=5000`

Qualquer usuário autenticado. Devolve **somente** projetos `ABERTO` (RF03), do mais recente para o mais antigo.

| Parâmetro | Regras |
|---|---|
| `habilidade` | Opcional. Projetos que exigem exatamente essa habilidade, sem diferenciar maiúsculas de minúsculas. |
| `orcamentoMin` | Opcional. Número maior ou igual a zero. Limite inclusivo. |
| `orcamentoMax` | Opcional. Número maior ou igual a zero e não menor que `orcamentoMin`. Limite inclusivo. |

### Resposta `200 OK`

Lista de projetos, possivelmente vazia.

### Erros

| Status | Quando |
|---|---|
| 400 | Orçamento que não é número, negativo, ou mínimo maior que o máximo |
| 401 | Token ausente ou inválido |

## Listar meus projetos

`GET /projetos/meus`

Somente **Cliente**. Devolve todos os projetos publicados pelo cliente autenticado, em qualquer status, do mais recente para o mais antigo. Usada pela tela "Meus projetos".

### Erros

| Status | Quando |
|---|---|
| 401 | Token ausente ou inválido |
| 403 | Usuário não é Cliente |

## Detalhe do projeto

`GET /projetos/{id}`

Qualquer usuário autenticado. Devolve o projeto em qualquer status.

### Erros

| Status | Quando |
|---|---|
| 401 | Token ausente ou inválido |
| 404 | Projeto não encontrado |

## Cancelar projeto

`POST /projetos/{id}/cancelamento`

Somente o **cliente que publicou o projeto** (RN07), e somente enquanto ele estiver `ABERTO` (RF02). Sem corpo.

O projeto passa para `CANCELADO` e todas as propostas `PENDENTE` dele passam para `RECUSADA`.

### Resposta `200 OK`

O projeto com status `CANCELADO`.

### Erros

| Status | Quando |
|---|---|
| 401 | Token ausente ou inválido |
| 403 | Usuário não é o cliente dono do projeto |
| 404 | Projeto não encontrado |
| 409 | Projeto não está `ABERTO` |

## Persistência

O `PostgresProjetoRepository` usa a tabela `projetos` da migration inicial (ADR-005): `id`, `cliente_id`, `titulo`, `descricao`, `orcamento NUMERIC(12, 2)`, `prazo_desejado DATE`, `habilidades TEXT[]`, `status` e `criado_em`. Depois de criado, só o `status` do projeto é atualizado.
