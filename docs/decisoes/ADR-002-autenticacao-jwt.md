# ADR-002: Autenticação com JWT

**Status:** Aceita
**Data:** 16/11/2026 (revisada em 23/11/2026, após a implementação do RF01)
**Responsável:** Victor Veras

## Contexto
O FreelaHub possui três perfis de acesso (Cliente, Freelancer e Administrador) e várias operações restritas ao dono do recurso, como aceitar propostas de um projeto ou liberar o pagamento de um contrato. A API precisa identificar o usuário e o seu perfil em cada requisição.

A API é consumida por uma aplicação web separada (React), e a execução local é feita com Docker Compose, sem infraestrutura adicional de sessão.

## Decisão
Usar autenticação baseada em JSON Web Token (JWT):

- O caso de uso `Autenticar` valida e-mail e senha e emite um token assinado contendo o identificador e o perfil do usuário.
- O token é enviado pelo frontend no cabeçalho `Authorization: Bearer <token>`.
- A verificação do token fica em um middleware do adaptador HTTP. O domínio recebe apenas o usuário já identificado e não conhece o formato do token.
- As senhas são armazenadas com hash bcrypt.
- A emissão e a verificação do token ficam atrás da porta `TokenService`, implementada por um adaptador que usa a biblioteca `jsonwebtoken`.

## Implementação adotada
- **Token:** `jsonwebtoken`, algoritmo HS256 fixado na emissão e na verificação, com o identificador em `sub` e o perfil em `perfil`.
- **Expiração:** 1 hora (3600 segundos), configurável por `JWT_EXPIRES_IN_SECONDS`.
- **Segredo:** lido de `JWT_SECRET`, com mínimo de 32 caracteres. A API não inicia sem ele.
- **Erros (conforme ADR-003):** 401 para token ausente, malformado, expirado ou com assinatura inválida e para credenciais inválidas; 403 para perfil não permitido pela rota. O corpo é `{ "mensagem": "..." }`.
- **Credenciais inválidas:** e-mail inexistente e senha incorreta recebem a mesma resposta.

### Divergências em relação à decisão original
- O hash bcrypt é gerado pela biblioteca `bcryptjs`, implementação em JavaScript do mesmo algoritmo, para evitar compilação nativa nos containers. Foi adicionada a porta `SenhaHasher`, para que os casos de uso não dependam da biblioteca.
- A senha é limitada a 72 bytes, porque o bcrypt ignora o que passa desse tamanho.

## Alternativas consideradas
- **Sessão no servidor com cookie:** exigiria armazenamento de sessão compartilhado e tratamento de CSRF. Para uma API REST consumida por uma SPA, o JWT é mais simples de implementar e de testar.
- **Provedor externo (OAuth, Auth0, Firebase):** reduziria o código de autenticação, mas adicionaria uma dependência externa sem relação com o problema central do marketplace e aumentaria o tempo de configuração da equipe.

## Consequências
**Positivas**
- A API permanece sem estado, o que simplifica a execução local e os testes.
- A autorização por perfil é feita de forma uniforme em todas as rotas protegidas.
- Como a geração do token fica atrás de uma porta, o mecanismo pode ser trocado sem alterar os casos de uso.

**Negativas**
- Um token emitido não pode ser revogado antes de expirar. O risco é reduzido com tempo de expiração curto.
- Não haverá recuperação de senha nem renovação de token (refresh token) nesta versão. Ao expirar o token, o usuário precisa fazer login novamente.
- O frontend guarda o token no `localStorage`, que fica acessível a scripts da página em caso de XSS. A expiração de 1 hora limita esse risco.
