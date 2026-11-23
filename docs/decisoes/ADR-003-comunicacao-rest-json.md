# ADR-003: Comunicação REST/JSON entre frontend e API

**Status:** Aceita
**Data:** 16/11/2026 (revisada em 23/11/2026, após a implementação do RF01 ao RF06)
**Responsável:** Emilly Paiva

## Contexto
O sistema é composto por uma aplicação web e uma API backend implantadas como containers separados. A aplicação web precisa consultar e alterar projetos, propostas, contratos e pagamentos, e todas as operações do fluxo principal são iniciadas por uma ação do usuário e respondidas de imediato.

Na Arquitetura Hexagonal adotada (ADR-001), a forma de comunicação com o frontend é um adaptador de entrada. A escolha do protocolo não deve afetar o domínio.

## Decisão
Expor a API como REST sobre HTTPS, com corpo das mensagens em JSON:

- Os recursos são organizados por entidade: `/usuarios`, `/projetos`, `/projetos/{id}/propostas`, `/contratos` e `/contratos/{id}/pagamento`.
- Mudanças de estado do fluxo são representadas como ações sobre o recurso, por exemplo `POST /propostas/{id}/aceite` e `POST /contratos/{id}/confirmacao-entrega`.
- Os controllers Express convertem a requisição em uma chamada ao caso de uso e convertem o resultado em resposta HTTP. Nenhuma regra de negócio fica no controller.
- Os erros de domínio são mapeados para códigos HTTP padronizados (400, 401, 403, 404 e 409), com corpo JSON contendo uma mensagem legível.

## Implementação adotada
Revisão de 23/11/2026. A decisão de REST/JSON não mudou. Esta seção registra as rotas e o mapeamento de erros que existem no código, em `backend/src/adapters/in/http/`.

### Rotas
Todas as rotas, menos `/saude`, `POST /usuarios` e `POST /sessoes`, exigem `Authorization: Bearer <token>` (ADR-002). Sem token válido, a resposta é 401.

| Método | Caminho | Caso de uso | Perfil exigido | Situação |
|---|---|---|---|---|
| GET | `/saude` | (verificação de disponibilidade) | Público | Implementada |
| POST | `/usuarios` | `Cadastrar` | Público | Implementada (RF01) |
| POST | `/sessoes` | `Autenticar` | Público | Implementada (RF01) |
| POST | `/projetos` | `PublicarProjeto` | Cliente | Implementada (RF02) |
| GET | `/projetos` | `ListarProjetos` | Qualquer autenticado | Implementada (RF03) |
| GET | `/projetos/meus` | `ListarMeusProjetos` | Cliente | Implementada (RF02) |
| GET | `/projetos/{id}` | `ObterProjeto` | Qualquer autenticado | Implementada (RF03) |
| POST | `/projetos/{id}/cancelamento` | `CancelarProjeto` | Cliente dono do projeto | Implementada (RF02) |
| POST | `/projetos/{id}/propostas` | `EnviarProposta` | Freelancer | Implementada (RF04) |
| GET | `/projetos/{id}/propostas` | `ListarPropostasDoProjeto` | Cliente dono do projeto | Implementada (RF04) |
| POST | `/propostas/{id}/aceite` | `AceitarProposta` | Cliente dono do projeto | Implementada (RF05) |
| GET | `/contratos` | `ConsultarContratos.listar` | Qualquer autenticado (só os contratos de que participa) | Implementada (RF05) |
| GET | `/contratos/{id}` | `ConsultarContratos.buscar` | Cliente ou Freelancer do contrato | Implementada (RF05) |
| POST | `/contratos/{id}/pagamento` | `RealizarPagamento` | Cliente do contrato | Implementada (RF06) |
| GET | `/contratos/{id}/pagamento` | `ConsultarPagamento` | Cliente ou Freelancer do contrato | Implementada (RF06) |
| POST | `/contratos/{id}/confirmacao-entrega` | `LiberarPagamento` | Cliente do contrato | Implementada (RF06) |

As rotas de pagamento atendem ao cliente HTTP do frontend (`frontend/src/api/http`). O pagamento é criado como PENDENTE, retido após a cobrança simulada e liberado com a conclusão transacional do contrato e do projeto.

Os detalhes de requisição e resposta de cada fatia ficam em `docs/api/`: [projetos](../api/projetos.md), [propostas](../api/propostas.md) e [pagamentos](../api/pagamentos.md).

### Mapeamento de erros
Os erros de domínio ficam em `backend/src/domain/erros.ts` e não conhecem HTTP. O middleware `tratarErros` (`errorMiddleware.ts`), registrado uma única vez em `app.ts`, converte cada tipo em status e corpo JSON:

| Erro de domínio | Status | `codigo` | Exemplo |
|---|---|---|---|
| `ErroValidacao` | 400 | `DADOS_INVALIDOS` | Projeto sem título ou com orçamento menor ou igual a zero |
| `ErroNaoAutenticado` | 401 | `NAO_AUTENTICADO` | Token ausente, malformado ou expirado; credenciais inválidas |
| `ErroSemPermissao` | 403 | `SEM_PERMISSAO` | Freelancer publicando projeto; quem não é dono cancelando projeto |
| `ErroNaoEncontrado` | 404 | `NAO_ENCONTRADO` | Projeto inexistente |
| `ErroConflito` | 409 | `CONFLITO` | Cancelar projeto que não está ABERTO; e-mail já cadastrado; proposta repetida; aceite e cancelamento simultâneos do mesmo projeto |

Corpo de todas as respostas de erro:

```json
{ "erro": { "codigo": "CONFLITO", "mensagem": "O projeto está com status EM_ANDAMENTO e não pode passar para CANCELADO." } }
```

### Erros fora do mapeamento
| Situação | Status | `codigo` |
|---|---|---|
| Corpo que não é JSON válido | 400 | `JSON_INVALIDO` |
| Corpo maior que 10 kB | 413 | `CORPO_MUITO_GRANDE` |
| Rota inexistente | 404 | `ROTA_NAO_ENCONTRADA` |
| Qualquer outro erro | 500 | `ERRO_INTERNO` |

No erro 500, a mensagem é sempre genérica ("Erro interno do servidor.") e o erro original vai apenas para o log do servidor, para não expor detalhes internos ao cliente.

### Divergências em relação à decisão original
- O corpo de erro tem o formato `{ "erro": { "codigo", "mensagem" } }` em vez de apenas uma mensagem. O `codigo` é estável e permite ao frontend tratar o erro sem depender do texto.
- O login é a ação `POST /sessoes`, e não uma rota dentro de `/usuarios`.
- Foi incluída a rota `GET /projetos/meus`, usada pela tela "Meus projetos" do cliente, que lista os projetos dele em qualquer status. `GET /projetos` continua listando só projetos ABERTO (RF03).
- Além dos cinco códigos previstos, a API usa 413 para corpo grande demais e 500 para erros não previstos.
- Na execução local com Docker Compose a API responde em HTTP. O HTTPS fica a cargo do ambiente de implantação.

## Alternativas consideradas
- **GraphQL:** daria mais flexibilidade nas consultas do frontend, mas o número de telas é pequeno e as consultas são previsíveis. A curva de aprendizado não se justifica no prazo do trabalho.
- **WebSocket:** seria útil para o chat (RF09), que está fora do escopo de implementação. Para o fluxo principal, requisição e resposta atendem.

## Consequências
**Positivas**
- O padrão é conhecido por toda a equipe e pode ser testado com ferramentas simples, como Postman ou curl.
- O contrato da API fica explícito e pode ser documentado rota por rota.
- Um novo adaptador de entrada, como uma CLI ou uma fila, pode reutilizar os mesmos casos de uso.

**Negativas**
- Telas que combinam dados de vários recursos podem exigir mais de uma requisição.
- Notificações em tempo real exigirão um mecanismo adicional no futuro.
