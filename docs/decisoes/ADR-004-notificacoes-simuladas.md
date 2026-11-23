# ADR-004: Notificações por porta e adaptador simulado

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Natan Lucena

## Contexto
O RF07 exige que o sistema avise os envolvidos em eventos do fluxo principal: nova proposta recebida (cliente), proposta aceita ou recusada (freelancer) e pagamento liberado (freelancer). Em produção, o envio seria feito por um serviço de e-mail externo, como o SendGrid.

Integrar um serviço real exigiria conta, chave de API e domínio verificado, o que não agrega à demonstração do estilo arquitetural e cria dependência de rede durante a apresentação.

## Decisão
Definir a porta de saída `NotificationService` na camada de aplicação e implementá-la com o adaptador `ConsoleNotificationAdapter`:

- Os casos de uso `EnviarProposta`, `AceitarProposta` e `LiberarPagamento` chamam a porta após concluir a operação.
- A porta recebe dados de negócio (destinatário, tipo de evento e informações do projeto) e não conhece o formato de e-mail.
- O adaptador simulado registra no console o destinatário, o assunto e o corpo da mensagem.
- Um adaptador real, como `SendGridNotificationAdapter`, pode ser adicionado depois e selecionado por configuração.

### Contrato da porta
A porta fica em `backend/src/application/ports/NotificationService.ts`:

```ts
type TipoNotificacao = 'NOVA_PROPOSTA' | 'PROPOSTA_ACEITA' | 'PROPOSTA_RECUSADA' | 'PAGAMENTO_LIBERADO';

interface Notificacao {
  tipo: TipoNotificacao;
  destinatarioId: string;
  projeto: { id: string; titulo: string };
  detalhes?: Record<string, string | number>;
}

interface NotificationService {
  notificar(notificacao: Notificacao): Promise<void>;
}
```

| Evento | Caso de uso | Destinatário |
|---|---|---|
| `NOVA_PROPOSTA` | `EnviarProposta` | Cliente dono do projeto |
| `PROPOSTA_ACEITA` | `AceitarProposta` | Freelancer da proposta aceita |
| `PROPOSTA_RECUSADA` | `AceitarProposta` e `CancelarProjeto` | Freelancers das demais propostas |
| `PAGAMENTO_LIBERADO` | `LiberarPagamento` | Freelancer do contrato |

O destinatário é identificado pelo id do usuário. Resolver o e-mail a partir do id fica a cargo de um adaptador real, que pode depender do `UsuarioRepository`.

Além do `ConsoleNotificationAdapter`, há o `InMemoryNotificationService`, que guarda as notificações enviadas para que os testes dos casos de uso possam verificá-las sem efeitos colaterais.

## Alternativas consideradas
- **Integração real com SendGrid ou SMTP:** demonstraria um envio de verdade, mas adicionaria configuração externa e risco de falha na apresentação sem mostrar nada novo sobre a arquitetura.
- **Chamada direta à biblioteca de e-mail dentro do caso de uso:** seria mais rápida de escrever, mas acoplaria a camada de aplicação a uma tecnologia, o que contraria o RNF02.

## Consequências
**Positivas**
- O fluxo principal pode ser demonstrado sem dependência externa.
- A troca do adaptador simulado por um real não altera nenhum caso de uso, o que evidencia a adoção da Arquitetura Hexagonal.
- Os testes dos casos de uso podem verificar as notificações com um adaptador falso em memória.

**Negativas**
- Nenhum e-mail é entregue de fato nesta versão.
- O envio é síncrono. Em produção, seria recomendado enviar por fila para não atrasar a resposta da API.
