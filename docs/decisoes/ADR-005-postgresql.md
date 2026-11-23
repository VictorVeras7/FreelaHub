# ADR-005: PostgreSQL e modelo relacional

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Matheus Rodrigues

## Contexto
Os dados do FreelaHub são fortemente relacionados: um projeto pertence a um cliente, recebe várias propostas de freelancers, gera no máximo um contrato, e cada contrato possui um pagamento. Algumas regras de negócio dependem dessa integridade, como "um freelancer não pode enviar mais de uma proposta para o mesmo projeto" (RN03) e "um projeto pode ter no máximo uma proposta aceita" (RN04).

O aceite de uma proposta altera várias entidades ao mesmo tempo (proposta aceita, demais recusadas, projeto em andamento e contrato criado), e essas alterações precisam ser atômicas.

## Decisão
Usar PostgreSQL como banco de dados, executado em container pelo Docker Compose:

- O schema é relacional, com tabelas `usuarios`, `projetos`, `propostas`, `contratos` e `pagamentos` e chaves estrangeiras entre elas.
- As regras de unicidade também são garantidas no banco, por exemplo `UNIQUE (projeto_id, freelancer_id)` em `propostas`.
- O schema é versionado com migrations em TypeScript na pasta `backend/src/adapters/out/persistence/migrations/`. Um migrador próprio registra as versões em `schema_migrations`, aplica tudo em uma transação com bloqueio consultivo e oferece rollback (`npm run migrate` e `npm run migrate:down`). A API aplica as pendentes ao subir.
- RN03 é garantida por `UNIQUE (projeto_id, freelancer_id)` em `propostas`, RN04 por um índice único parcial de proposta aceita, e cada projeto tem no máximo um contrato. Os status são limitados por `CHECK`.
- O acesso ao banco fica restrito aos adaptadores de persistência, que implementam as portas `UsuarioRepository`, `ProjetoRepository`, `PropostaRepository`, `ContratoRepository` e `PagamentoRepository`.
- Operações que alteram várias entidades são executadas dentro de uma transação, controlada pelo adaptador por meio de uma porta de unidade de trabalho.

## Alternativas consideradas
- **MongoDB:** o modelo de documentos não oferece de forma natural as restrições entre entidades de que o fluxo depende, o que levaria parte dessas garantias para o código.
- **node-pg-migrate ou Knex:** resolveriam o versionamento, mas acrescentariam uma dependência para um único schema inicial.
- **SQLite:** simplificaria a configuração, mas não representa um ambiente próximo do real e tem limitações de concorrência.

## Consequências
**Positivas**
- A integridade dos dados é garantida em duas camadas: no domínio e no banco.
- As transações tornam o aceite de proposta e a liberação de pagamento operações atômicas.
- Como o domínio só conhece as portas de repositório, os casos de uso podem ser testados com repositórios em memória.

**Negativas**
- É preciso manter o mapeamento entre as entidades de domínio e as tabelas.
- A execução local depende do Docker para subir o banco.
