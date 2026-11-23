# ADR-007: Organização do frontend com portas e adaptadores de API

**Status:** Aceita
**Data:** 23/11/2026
**Responsável:** Matheus Rodrigues

## Contexto
O frontend precisa avançar antes do backend e consome rotas mantidas por cinco integrantes, entregues em momentos diferentes. Se as telas dependessem diretamente de cada rota, uma API ainda inexistente bloquearia a tela correspondente.

## Decisão
As telas dependem de portas por recurso, definidas em `frontend/src/api/ports`: `AuthApi`, `ProjetosApi`, `PropostasApi`, `ContratosApi` e `PagamentosApi`.

- `frontend/src/api/http` contém os adaptadores reais, com token, tratamento de erro e conversão para `ApiError`.
- `frontend/src/api/mock` contém adaptadores em memória, que respeitam as regras de negócio.
- `frontend/src/api/index.ts` escolhe o adaptador pela variável `VITE_USE_MOCK`.
- As telas não chamam `fetch`: usam hooks que dependem das portas.

## Alternativas consideradas
- **Chamadas diretas com `fetch` nas telas:** menos arquivos, mas acopla cada tela ao transporte e impede avançar sem a API.
- **Mock server separado:** simula o HTTP com fidelidade, mas exige mais um processo em execução e duplica o contrato fora da aplicação.

## Consequências
**Positivas**
- O fluxo principal pode ser demonstrado e testado sem backend.
- Trocar o adaptador não altera as telas.
- A organização mantém coerência com a Arquitetura Hexagonal do backend.

**Negativas**
- O adaptador simulado precisa acompanhar as regras do backend.
- Cada recurso tem uma interface e duas implementações para manter.
