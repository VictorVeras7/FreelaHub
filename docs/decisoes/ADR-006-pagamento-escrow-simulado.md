# ADR-006: Pagamento em escrow com gateway simulado

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Enzo Hariel

## Contexto
O RF06 define que o valor do contrato é pago pelo cliente e fica retido pela plataforma até a confirmação da entrega, quando é liberado ao freelancer. Em produção, a cobrança e o repasse seriam feitos por um gateway como Mercado Pago ou Stripe, que confirma o pagamento de forma assíncrona via webhook.

A integração com um gateway real, mesmo em modo sandbox, exige cadastro, chaves de API e um endereço público para receber webhooks, o que não é viável na execução local da apresentação.

## Decisão
Controlar o ciclo de vida do pagamento no domínio e isolar o gateway atrás de uma porta:

- A entidade `Pagamento` controla os status PENDENTE, RETIDO e LIBERADO e impede transições inválidas, como liberar um pagamento que não foi retido.
- O caso de uso `RealizarPagamento` cria o pagamento com o valor da proposta aceita (RN05) e solicita a cobrança pela porta `PaymentGateway`.
- O caso de uso `LiberarPagamento` só pode ser executado pelo cliente do contrato (RN06), solicita o repasse pela porta e conclui o contrato e o projeto.
- A porta `PaymentGateway` é implementada pelo `FakePaymentAdapter`, que aprova a cobrança e o repasse de forma imediata e gera um identificador de transação simulado.
- O webhook do gateway aparece nos diagramas como parte da arquitetura alvo. Na versão simulada, a confirmação acontece de forma síncrona.

## Implementação
O backend implementa a cobrança em `POST /contratos/{id}/pagamento`, a consulta em `GET /contratos/{id}/pagamento` e a liberação em `POST /contratos/{id}/confirmacao-entrega`. O `PagamentoRepository` usa a tabela `pagamentos` já definida na migration inicial. A liberação persiste, em uma única transação, o pagamento LIBERADO, o contrato CONCLUIDO e o projeto CONCLUIDO. A especificação HTTP está em [`docs/api/pagamentos.md`](../api/pagamentos.md), e as visões C4 estão em [`docs/c4/workspace.dsl`](../c4/workspace.dsl) e [`docs/c4/codigo/pagamentos.md`](../c4/codigo/pagamentos.md).

## Alternativas consideradas
- **Integração com Mercado Pago ou Stripe em sandbox:** demonstraria o fluxo real, mas exigiria endereço público para webhooks e aumentaria o risco de falha durante a apresentação.
- **Registrar o pagamento apenas como um campo do contrato:** seria mais simples, mas perderia o ciclo de vida do pagamento e a demonstração de uma porta de saída para um sistema externo.

## Consequências
**Positivas**
- As regras de retenção e liberação ficam no domínio e podem ser testadas sem dependência externa.
- Um adaptador real pode substituir o simulado sem alteração nos casos de uso.
- O fluxo principal pode ser demonstrado do início ao fim em ambiente local.

**Negativas**
- Falhas de cobrança, estornos e confirmações assíncronas não são exercitados nesta versão.
- A integração com um gateway real exigirá, além do novo adaptador, um adaptador de entrada para o webhook.
