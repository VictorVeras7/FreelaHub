# Diagrama de Código: Pagamentos (RF06)

Nível 4 do C4 para a fatia de pagamento em escrow. As setas tracejadas com triângulo indicam implementação de uma porta. A visão de componentes correspondente está definida como `RF06_Componentes` em [`workspace.dsl`](../workspace.dsl).

```mermaid
classDiagram
    direction LR

    namespace Dominio {
        class Pagamento {
            -id: string
            -contratoId: string
            -valor: number
            -status: StatusPagamento
            -transacaoId: string | null
            -atualizadoEm: Date
            +criar(dados, agora)$ Pagamento
            +restaurar(dados)$ Pagamento
            +reter(transacaoId, agora) void
            +liberar(agora) void
            +paraDados() DadosPagamento
        }
        class StatusPagamento {
            <<type>>
            PENDENTE
            RETIDO
            LIBERADO
        }
        class Contrato {
            -status: StatusContrato
            +concluir() void
        }
        class Projeto {
            -status: StatusProjeto
            +concluir() void
        }
    }

    namespace Aplicacao {
        class RealizarPagamento {
            +executar(contratoId, usuarioId) Pagamento
        }
        class LiberarPagamento {
            +executar(contratoId, usuarioId) Pagamento
        }
        class ConsultarPagamento {
            +executar(contratoId, usuarioId) Pagamento
        }
        class PagamentoRepository {
            <<interface>>
            +salvar(pagamento) void
            +buscarPorContrato(contratoId) Pagamento
        }
        class PaymentGateway {
            <<interface>>
            +cobrar(pagamentoId, valor) string
            +liberar(transacaoId, valor) void
        }
        class UnidadeDeTrabalho {
            <<interface>>
            +executar(trabalho) T
        }
        class ContratoRepository {
            <<interface>>
            +buscarPorId(id) ContratoDetalhado
            +salvar(contrato) void
        }
        class ProjetoRepository {
            <<interface>>
            +buscarPorId(id) Projeto
            +salvar(projeto) void
        }
    }

    namespace Adaptadores {
        class ContratoController {
            POST /contratos/:id/pagamento
            GET /contratos/:id/pagamento
            POST /contratos/:id/confirmacao-entrega
        }
        class PostgresPagamentoRepository
        class PostgresContratoRepository
        class PostgresProjetoRepository
        class PostgresUnidadeDeTrabalho
        class FakePaymentAdapter
    }

    Pagamento --> StatusPagamento
    ContratoController --> RealizarPagamento
    ContratoController --> ConsultarPagamento
    ContratoController --> LiberarPagamento
    RealizarPagamento --> PagamentoRepository
    RealizarPagamento --> PaymentGateway
    RealizarPagamento --> ContratoRepository
    RealizarPagamento --> UnidadeDeTrabalho
    RealizarPagamento ..> Pagamento : cria e retém
    ConsultarPagamento --> PagamentoRepository
    ConsultarPagamento --> ContratoRepository : autoriza participante
    LiberarPagamento --> PagamentoRepository
    LiberarPagamento --> PaymentGateway
    LiberarPagamento --> ContratoRepository
    LiberarPagamento --> ProjetoRepository
    LiberarPagamento --> UnidadeDeTrabalho
    LiberarPagamento ..> Pagamento : libera
    LiberarPagamento ..> Contrato : conclui
    LiberarPagamento ..> Projeto : conclui
    PostgresPagamentoRepository ..|> PagamentoRepository
    PostgresContratoRepository ..|> ContratoRepository
    PostgresProjetoRepository ..|> ProjetoRepository
    PostgresUnidadeDeTrabalho ..|> UnidadeDeTrabalho
    FakePaymentAdapter ..|> PaymentGateway
```

## Onde cada classe fica

| Classe | Camada | Arquivo |
|---|---|---|
| `Pagamento`, `StatusPagamento` | Domínio | `backend/src/domain/pagamento/Pagamento.ts` |
| `RealizarPagamento`, `LiberarPagamento`, `ConsultarPagamento` | Aplicação | `backend/src/application/casos-de-uso/` |
| `PagamentoRepository`, `PaymentGateway` | Portas de saída | `backend/src/application/ports/` |
| `ContratoController` | Adaptador de entrada | `backend/src/adapters/in/http/ContratoController.ts` |
| `PostgresPagamentoRepository` | Adaptador de saída | `backend/src/adapters/out/persistence/PostgresPagamentoRepository.ts` |
| `FakePaymentAdapter` | Adaptador de saída | `backend/src/adapters/out/payment/FakePaymentAdapter.ts` |
| `PostgresUnidadeDeTrabalho` | Adaptador transacional | `backend/src/adapters/out/persistence/PostgresUnidadeDeTrabalho.ts` |
