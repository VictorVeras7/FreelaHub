# Diagrama de Código: Projetos (RF02 e RF03)

Nível 4 do C4 para a fatia de projetos da API. As setas tracejadas com triângulo indicam implementação de uma porta. A mesma fatia também está modelada no Structurizr, na visão `RF02_Codigo` de [`workspace.dsl`](../workspace.dsl).

```mermaid
classDiagram
    direction LR

    namespace Dominio {
        class Projeto {
            -id: string
            -clienteId: string
            -titulo: string
            -descricao: string
            -orcamento: number
            -prazoDesejado: string | null
            -habilidades: string[]
            -status: StatusProjeto
            -criadoEm: Date
            +criar(novo, agora)$ Projeto
            +restaurar(dados)$ Projeto
            +pertenceA(clienteId) boolean
            +iniciar() void
            +concluir() void
            +cancelar() void
            +paraDados() DadosProjeto
        }
        class StatusProjeto {
            <<enumeration>>
            ABERTO
            EM_ANDAMENTO
            CONCLUIDO
            CANCELADO
        }
    }

    namespace Aplicacao {
        class PublicarProjeto {
            +executar(entrada) ProjetoDetalhado
        }
        class CancelarProjeto {
            +executar(entrada) ProjetoDetalhado
        }
        class ListarProjetos {
            +executar(filtros) ProjetoDetalhado[]
        }
        class ListarMeusProjetos {
            +executar(entrada) ProjetoDetalhado[]
        }
        class ObterProjeto {
            +executar(entrada) ProjetoDetalhado
        }
        class ProjetoRepository {
            <<interface>>
            +salvar(projeto) void
            +buscarPorId(id) Projeto
            +listarAbertos(filtros) Projeto[]
            +listarPorCliente(clienteId) Projeto[]
        }
        class ProjetoConsulta {
            <<interface>>
            +buscarResumo(projetoId) ProjetoResumo
        }
        class PropostaRepository {
            <<interface>>
        }
        class UsuarioRepository {
            <<interface>>
        }
    }

    namespace Adaptadores {
        class RotasDeProjetos {
            POST /projetos
            GET /projetos
            GET /projetos/meus
            GET /projetos/:id
            POST /projetos/:id/cancelamento
        }
        class PostgresProjetoRepository
        class InMemoryProjetoRepository
    }

    Projeto --> StatusProjeto
    RotasDeProjetos --> PublicarProjeto
    RotasDeProjetos --> CancelarProjeto
    RotasDeProjetos --> ListarProjetos
    RotasDeProjetos --> ListarMeusProjetos
    RotasDeProjetos --> ObterProjeto
    PublicarProjeto ..> Projeto : cria
    PublicarProjeto --> ProjetoRepository
    CancelarProjeto --> ProjetoRepository
    CancelarProjeto --> PropostaRepository : recusa pendentes
    ListarProjetos --> ProjetoRepository
    ListarMeusProjetos --> ProjetoRepository
    ObterProjeto --> ProjetoRepository
    PublicarProjeto --> UsuarioRepository : nome do cliente
    ListarProjetos --> UsuarioRepository : nome do cliente

    PostgresProjetoRepository ..|> ProjetoRepository
    PostgresProjetoRepository ..|> ProjetoConsulta
    InMemoryProjetoRepository ..|> ProjetoRepository
    InMemoryProjetoRepository ..|> ProjetoConsulta
```

## Onde cada classe fica

| Classe | Camada | Arquivo |
|---|---|---|
| `Projeto` e `StatusProjeto` | Domínio | `backend/src/domain/projeto/Projeto.ts` |
| `PublicarProjeto` | Aplicação (porta de entrada) | `backend/src/application/casos-de-uso/PublicarProjeto.ts` |
| `CancelarProjeto` | Aplicação (porta de entrada) | `backend/src/application/casos-de-uso/CancelarProjeto.ts` |
| `ListarProjetos` | Aplicação (porta de entrada) | `backend/src/application/casos-de-uso/ListarProjetos.ts` |
| `ListarMeusProjetos` | Aplicação (porta de entrada) | `backend/src/application/casos-de-uso/ListarMeusProjetos.ts` |
| `ObterProjeto` | Aplicação (porta de entrada) | `backend/src/application/casos-de-uso/ObterProjeto.ts` |
| `ProjetoDetalhado` | Aplicação | `backend/src/application/casos-de-uso/detalharProjetos.ts` |
| `ProjetoRepository` | Aplicação (porta de saída) | `backend/src/application/ports/ProjetoRepository.ts` |
| Rotas de projetos | Adaptador de entrada | `backend/src/adapters/in/http/rotas/projetos.ts` |
| `PostgresProjetoRepository` | Adaptador de saída | `backend/src/adapters/out/persistence/PostgresProjetoRepository.ts` |
| `InMemoryProjetoRepository` | Adaptador de saída para testes | `backend/src/adapters/out/memoria/InMemoryProjetoRepository.ts` |

`ProjetoDetalhado` são os dados do projeto acrescidos do nome do cliente, que a interface mostra nas telas de listagem e detalhe. O nome é lido pela porta `UsuarioRepository` da fatia RF01.

Os dois repositórios de projetos implementam também a porta `ProjetoConsulta` da fatia de propostas, que antes tinha um adaptador próprio (`PostgresProjetoConsulta`).

## Transições do ciclo de vida

| Método | De | Para | Usado por |
|---|---|---|---|
| `cancelar()` | ABERTO | CANCELADO | `CancelarProjeto` (RF02, RN07) |
| `iniciar()` | ABERTO | EM_ANDAMENTO | `AceitarProposta` (RF05) |
| `concluir()` | EM_ANDAMENTO | CONCLUIDO | `LiberarPagamento` (RF06) |

Qualquer outra transição lança `ErroConflito`, que a API devolve como 409.
