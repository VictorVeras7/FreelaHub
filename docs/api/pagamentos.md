# API: Pagamentos (RF06)

As rotas exigem `Authorization: Bearer <token>` (ADR-002). Valores são copiados do contrato e não são aceitos no corpo da requisição.

## Realizar pagamento

`POST /contratos/{contratoId}/pagamento`

Somente o cliente do contrato. O gateway simulado aprova a cobrança de forma síncrona; o valor fica retido pela plataforma.

### Resposta `200 OK`

```json
{
  "id": "7b0c3f0e-5d2a-4e43-9a51-0f4f3b8f2c11",
  "contratoId": "c1d2e3f4-0000-4000-8000-000000000001",
  "valor": 1500,
  "status": "RETIDO",
  "transacaoId": "sim-4e43-9a51-0f4f3b8f2c11",
  "atualizadoEm": "2026-11-23T13:00:00.000Z"
}
```

Um pagamento já retido ou liberado não pode ser realizado novamente.

## Consultar pagamento

`GET /contratos/{contratoId}/pagamento`

Disponível ao cliente e ao freelancer participantes do contrato.

### Resposta `200 OK`

Usa o mesmo formato da resposta de pagamento. Se o contrato ainda não tiver pagamento, retorna `404`; o frontend trata esse caso como status PENDENTE.

## Confirmar entrega e liberar pagamento

`POST /contratos/{contratoId}/confirmacao-entrega`

Somente o cliente do contrato. Exige pagamento RETIDO. A liberação do pagamento, a conclusão do contrato e a conclusão do projeto são persistidas em uma única transação.

### Resposta `200 OK`

Retorna o mesmo formato com `status: "LIBERADO"`.

## Erros

| Status | Quando |
|---|---|
| 401 | Token ausente ou inválido |
| 403 | Perfil incompatível ou usuário não participa/não é cliente do contrato |
| 404 | Contrato, projeto ou pagamento não encontrado |
| 409 | Contrato concluído, pagamento já realizado ou pagamento ainda não retido |

As respostas seguem o formato padrão: `{ "erro": { "codigo": "...", "mensagem": "..." } }`.
