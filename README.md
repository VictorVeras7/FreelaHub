# FreelaHub

Marketplace de freelancers desenvolvido como trabalho final da disciplina de Arquitetura de Software (2026.2) da UFC, Campus Quixadá. Tema 11: Marketplace de Freelancers.

## Sobre o sistema
O FreelaHub conecta clientes a profissionais freelancers. O cliente publica um projeto, os freelancers enviam propostas com valor e prazo, e o cliente aceita a que melhor atende à sua necessidade. Ao aceitar uma proposta, a plataforma gera um contrato e retém o pagamento, que só é liberado ao freelancer quando o cliente confirma a entrega do trabalho.

O documento completo de requisitos está em [`docs/requisitos`](docs/requisitos).

## Escopo
| ID | Funcionalidade | Escopo |
|---|---|---|
| RF01 | Cadastro e autenticação de usuários (JWT) | Implementação |
| RF02 | Publicação e cancelamento de projeto | Implementação |
| RF03 | Listagem e filtro de projetos | Implementação |
| RF04 | Envio de proposta | Implementação |
| RF05 | Aceite de proposta e geração de contrato | Implementação |
| RF06 | Pagamento com retenção (escrow) | Implementação (simulada) |
| RF07 | Notificações por e-mail | Implementação (simulada) |
| RF08 | Avaliações mútuas | Somente documentação |
| RF09 | Chat entre cliente e freelancer | Somente documentação |
| RF10 | Moderação e disputas | Somente documentação |

Fluxo principal demonstrado na implementação: o cliente publica um projeto, o freelancer envia uma proposta, o cliente aceita a proposta e o contrato é gerado, o pagamento fica retido e é liberado ao freelancer após a confirmação da entrega.

## Estilo arquitetural
O backend segue majoritariamente a Arquitetura Hexagonal (Ports and Adapters). O domínio (Projeto, Proposta, Contrato e Pagamento) não depende de framework, banco de dados nem gateway externo. A comunicação com o exterior acontece por portas (interfaces), e cada tecnologia entra no sistema como um adaptador que implementa uma dessas portas.

As decisões arquiteturais estão registradas em [`docs/decisoes`](docs/decisoes).

## Stack
React e TypeScript no frontend, Node.js, Express e TypeScript no backend, PostgreSQL como banco de dados e Docker Compose para execução local.

## Arquitetura (C4)
Os diagramas são mantidos em Structurizr DSL no arquivo [`docs/c4/workspace.dsl`](docs/c4/workspace.dsl).

| Visão | Imagem | Situação |
|---|---|---|
| Contexto | [`docs/c4/contexto.png`](docs/c4/contexto.png) | Concluída |
| Container | [`docs/c4/containers.png`](docs/c4/containers.png) | Concluída |
| Componentes | [Ver todos](docs/c4/README.md#nível-3-componentes) | Aplicação Web, RF01, RF02, RF03, RF04, RF05 e RF07 concluídos. RF06 pendente |
| Código | [Ver todos](docs/c4/README.md#nível-4-código) | RF01, RF02, RF03, RF04, RF05 e RF07 concluídos. RF06 pendente |

Para visualizar o modelo no navegador, cole o conteúdo do `workspace.dsl` em [playground.structurizr.com](https://playground.structurizr.com). Para visualizar localmente com Docker:

```bash
cd docs/c4
docker run -it --rm -p 8080:8080 -v "$(pwd)":/usr/local/structurizr structurizr/structurizr local
```

Em seguida, acesse http://localhost:8080.

## Equipe e divisão das atividades
A divisão foi feita por fatias verticais do fluxo principal. Cada integrante implementa a sua fatia em todas as camadas do hexágono (entidade de domínio, caso de uso, porta, adaptador e tela) e registra a decisão arquitetural relacionada a ela. O acompanhamento das tarefas é feito pelas [Issues](https://github.com/VictorVeras7/FreelaHub/issues) do repositório.

| Integrante | Implementação | Decisão arquitetural |
|---|---|---|
| Victor Veras | RF01: entidade Usuário, casos de uso Cadastrar e Autenticar, portas UsuarioRepository e TokenService, middleware JWT e carga inicial do Administrador | [ADR-002](docs/decisoes/ADR-002-autenticacao-jwt.md) |
| Emilly Paiva | RF02 e RF03: entidade Projeto, casos de uso PublicarProjeto, CancelarProjeto e ListarProjetos, repositório de projetos e rotas de projetos | [ADR-003](docs/decisoes/ADR-003-comunicacao-rest-json.md) |
| Natan Lucena | RF04 e RF07: entidade Proposta, caso de uso EnviarProposta, repositório de propostas, porta NotificationService com ConsoleNotificationAdapter e rotas de propostas | [ADR-004](docs/decisoes/ADR-004-notificacoes-simuladas.md) |
| Matheus Rodrigues | Todo o frontend. RF05: entidade Contrato, casos de uso AceitarProposta e ConsultarContratos, repositório de contratos e rotas de aceite e contratos. Schema e migrations do PostgreSQL (#31), assumidos do Victor em 23/11 | [ADR-005](docs/decisoes/ADR-005-postgresql.md) |
| Enzo Hariel | RF06: entidade Pagamento, casos de uso RealizarPagamento e LiberarPagamento, repositório de pagamentos, porta PaymentGateway com FakePaymentAdapter e rotas de pagamento | [ADR-006](docs/decisoes/ADR-006-pagamento-escrow-simulado.md) |

Atividades comuns a todos os integrantes:
- Modelar os componentes e as classes da própria fatia nos diagramas de Componentes e de Código (23/11).
- Verificar a conformidade entre o código da própria fatia e os diagramas (01/12).
- Revisar o pull request de pelo menos um colega antes do merge.
- Apresentar a própria fatia do fluxo principal na apresentação final.

## Estrutura do repositório
```
docs/
  c4/                     diagramas C4 (Structurizr DSL e imagens exportadas)
  decisoes/               registros de decisões arquiteturais (ADRs)
  requisitos/             documento de requisitos
backend/src/
  domain/                 entidades e regras de negócio
  application/            casos de uso e portas
  adapters/
    in/http/              controllers Express (adaptador de entrada)
    out/persistence/      repositórios PostgreSQL
    out/security/         token JWT e hash de senha
    out/payment/          gateway de pagamento simulado
    out/notification/     envio de e-mail simulado
frontend/                 aplicação React
```

## Cronograma
| Data | Entrega |
|---|---|
| 16/11 e 17/11 | Aplicativo definido, funcionalidades documentadas, estilo arquitetural, repositório e diagramas de Contexto e Container |
| 23/11 e 24/11 | Diagramas de Componentes e Código |
| 01/12, 07/12 e 08/12 | Código em execução, conformidade com os diagramas e apresentação |
