# API: Propostas (RF04)

Rotas da fatia de propostas. Todas exigem o cabeçalho `Authorization: Bearer <token>` (ADR-002) e trocam JSON (ADR-003).

Erros seguem o formato padrão da API:

```json
{ "erro": { "codigo": "CONFLITO", "mensagem": "Mensagem legível para o usuário." } }
```

## Enviar proposta

`POST /projetos/{projetoId}/propostas`

Somente usuários com perfil **Freelancer**.

### Requisição

```json
{
  "valor": 1500.0,
  "prazoDias": 10,
  "mensagem": "Tenho experiência com React e posso entregar em dez dias."
}
```

| Campo | Tipo | Regras |
|---|---|---|
| `valor` | número | Obrigatório, maior que zero. Arredondado para duas casas decimais. |
| `prazoDias` | número inteiro | Obrigatório, maior que zero. |
| `mensagem` | texto | Obrigatória, até 2000 caracteres. Espaços nas pontas são removidos. |

### Resposta `201 Created`

Cabeçalho `Location: /projetos/{projetoId}/propostas/{id}`.

```json
{
  "id": "7b0c3f0e-5d2a-4e43-9a51-0f4f3b8f2c11",
  "projetoId": "c1d2e3f4-0000-4000-8000-000000000001",
  "freelancerId": "a9b8c7d6-0000-4000-8000-000000000002",
  "valor": 1500,
  "prazoDias": 10,
  "mensagem": "Tenho experiência com React e posso entregar em dez dias.",
  "status": "PENDENTE",
  "criadaEm": "2026-11-23T13:00:00.000Z"
}
```

Após a criação, o cliente dono do projeto recebe a notificação `NOVA_PROPOSTA` (RF07).

### Erros

| Status | Quando |
|---|---|
| 400 | Campos ausentes ou inválidos, ou corpo que não é JSON |
| 401 | Token ausente ou inválido |
| 403 | Usuário não é Freelancer |
| 404 | Projeto não encontrado |
| 409 | Projeto não está ABERTO (RN02) ou o freelancer já enviou proposta para ele (RN03) |

## Listar propostas recebidas

`GET /projetos/{projetoId}/propostas`

Somente o **cliente dono do projeto**. Usada pela tela de propostas recebidas (RF05).

### Resposta `200 OK`

Lista ordenada da proposta mais antiga para a mais recente, no mesmo formato da criação:

```json
[
  {
    "id": "7b0c3f0e-5d2a-4e43-9a51-0f4f3b8f2c11",
    "projetoId": "c1d2e3f4-0000-4000-8000-000000000001",
    "freelancerId": "a9b8c7d6-0000-4000-8000-000000000002",
    "valor": 1500,
    "prazoDias": 10,
    "mensagem": "Tenho experiência com React e posso entregar em dez dias.",
    "status": "PENDENTE",
    "criadaEm": "2026-11-23T13:00:00.000Z"
  }
]
```

### Erros

| Status | Quando |
|---|---|
| 401 | Token ausente ou inválido |
| 403 | Usuário não é o cliente dono do projeto |
| 404 | Projeto não encontrado |

## Persistência esperada

O `PostgresPropostaRepository` usa a tabela abaixo. Ela deve constar nas migrations (ADR-005):

```sql
CREATE TABLE propostas (
  id            UUID PRIMARY KEY,
  projeto_id    UUID NOT NULL REFERENCES projetos (id),
  freelancer_id UUID NOT NULL REFERENCES usuarios (id),
  valor         NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  prazo_dias    INTEGER NOT NULL CHECK (prazo_dias > 0),
  mensagem      TEXT NOT NULL,
  status        VARCHAR(10) NOT NULL CHECK (status IN ('PENDENTE', 'ACEITA', 'RECUSADA')),
  criada_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, freelancer_id)
);
```

Da tabela `projetos`, a fatia lê apenas `id`, `cliente_id`, `titulo` e `status` (valores `ABERTO`, `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO`).
