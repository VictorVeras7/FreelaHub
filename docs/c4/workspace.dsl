workspace "FreelaHub: Marketplace de Freelancers" "Modelo C4 do trabalho final de Arquitetura de Software (Tema 11)" {

    !identifiers hierarchical

    model {
        cliente = person "Cliente" "Pessoa ou empresa que publica projetos e contrata freelancers."
        freelancer = person "Freelancer" "Profissional que busca projetos e envia propostas."
        admin = person "Administrador" "Modera usuários, projetos e disputas."

        gatewayPagamento = softwareSystem "Gateway de Pagamento" "Processa pagamentos (ex.: Mercado Pago ou Stripe em modo sandbox)." "Externo"
        servicoEmail = softwareSystem "Serviço de E-mail" "Envia notificações por e-mail (ex.: SendGrid)." "Externo"

        freelahub = softwareSystem "FreelaHub" "Plataforma que conecta clientes a freelancers, gerenciando projetos, propostas, contratos e pagamentos." {
            webapp = container "Aplicação Web" "Interface para clientes, freelancers e administradores." "React + TypeScript" "Browser" {
                roteamento = component "Roteamento e Guardas" "Define as rotas e restringe o acesso por perfil." "React Router"
                sessao = component "Sessão" "Mantém o usuário logado e o token JWT." "React Context"
                paginasAutenticacao = component "Páginas de Autenticação" "Login e cadastro." "React"
                paginasProjetos = component "Páginas de Projetos" "Projetos abertos, detalhe, novo projeto e meus projetos." "React"
                paginasPropostas = component "Páginas de Propostas" "Envio de proposta e propostas recebidas." "React"
                paginasContratos = component "Páginas de Contratos" "Contratos, pagamento e confirmação de entrega." "React"
                clienteApi = component "Cliente da API" "Portas por recurso com adaptadores HTTP e simulado." "TypeScript + fetch"
            }
            api = container "API Backend" "Regras de negócio do marketplace, organizada em Arquitetura Hexagonal (domínio + portas + adaptadores)." "Node.js + Express + TypeScript" {
                # Fatia RF04 e RF07: propostas e notificações
                rotasPropostas = component "Rotas de Propostas" "POST e GET /projetos/{id}/propostas. Converte HTTP em chamadas aos casos de uso." "Express Router" "Adaptador"
                enviarProposta = component "EnviarProposta" "Caso de uso: valida perfil, RN02 e RN03, cria a proposta PENDENTE e notifica o cliente." "TypeScript" "Caso de uso"
                listarPropostas = component "ListarPropostasDoProjeto" "Caso de uso: lista as propostas de um projeto para o cliente dono." "TypeScript" "Caso de uso"
                proposta = component "Proposta" "Entidade de domínio com o ciclo PENDENTE -> ACEITA ou RECUSADA." "TypeScript" "Domínio"
                propostaRepository = component "PropostaRepository" "Porta de saída para persistência de propostas." "Interface TypeScript" "Porta"
                projetoConsulta = component "ProjetoConsulta" "Porta de saída de leitura do dono, título e status do projeto." "Interface TypeScript" "Porta"
                notificationService = component "NotificationService" "Porta de saída para notificações de eventos do fluxo." "Interface TypeScript" "Porta"
                postgresPropostaRepository = component "PostgresPropostaRepository" "Implementa PropostaRepository sobre a tabela propostas." "pg" "Adaptador"
                postgresProjetoConsulta = component "PostgresProjetoConsulta" "Implementa ProjetoConsulta sobre a tabela projetos." "pg" "Adaptador"
                consoleNotification = component "ConsoleNotificationAdapter" "Implementa NotificationService registrando destinatário, assunto e corpo no console." "TypeScript" "Adaptador"

                # Fatia RF05: aceite de proposta e contratos
                contratoController = component "ContratoController" "Recebe POST /propostas/{id}/aceite, GET /contratos e GET /contratos/{id}." "Express" "RF05,AdaptadorEntrada"
                aceitarProposta = component "AceitarProposta" "Aceita a proposta, recusa as demais, inicia o projeto e gera o contrato em uma transação." "TypeScript" "RF05,Aplicacao"
                consultarContratos = component "ConsultarContratos" "Lista e detalha contratos do usuário participante." "TypeScript" "RF05,Aplicacao"
                contrato = component "Contrato" "Entidade de domínio com o ciclo de vida ATIVO e CONCLUÍDO." "TypeScript" "RF05,Dominio"
                contratoRepository = component "ContratoRepository" "Porta de saída para persistência de contratos." "Interface TypeScript" "RF05,Porta"
                unidadeDeTrabalho = component "UnidadeDeTrabalho" "Porta de saída para execução transacional." "Interface TypeScript" "RF05,Porta"
                projetoInicio = component "ProjetoInicio" "Porta de saída para a transição de ABERTO para EM_ANDAMENTO." "Interface TypeScript" "RF05,Porta"
                postgresContratoRepository = component "PostgresContratoRepository" "Implementa ContratoRepository com SQL." "node-postgres" "RF05,AdaptadorSaida"
                postgresUnidadeDeTrabalho = component "PostgresUnidadeDeTrabalho" "Implementa UnidadeDeTrabalho com transações do PostgreSQL." "node-postgres" "RF05,AdaptadorSaida"
                postgresProjetoInicio = component "PostgresProjetoInicio" "Implementa ProjetoInicio com atualização condicional." "node-postgres" "RF05,AdaptadorSaida"

                # Fatia RF01: adaptadores de entrada
                usuariosController = component "UsuariosController" "POST /usuarios: converte a requisição em chamada ao caso de uso Cadastrar." "Express Router" "RF01,AdaptadorEntrada"
                sessoesController = component "SessoesController" "POST /sessoes: converte a requisição em chamada ao caso de uso Autenticar." "Express Router" "RF01,AdaptadorEntrada"
                authMiddleware = component "AuthMiddleware" "Lê o token Bearer, identifica o usuário e aplica os perfis aceitos pela rota." "Express Middleware" "RF01,AdaptadorEntrada"
                errorMiddleware = component "ErrorMiddleware" "Mapeia erros de domínio para 400, 401, 403, 404 e 409 com mensagem em JSON." "Express Middleware" "RF01,AdaptadorEntrada"

                # Fatia RF01: aplicação
                cadastrar = component "Cadastrar" "Cadastra Cliente ou Freelancer, com e-mail único e senha em hash." "Caso de uso" "RF01,Aplicacao,Codigo"
                autenticar = component "Autenticar" "Valida as credenciais e emite o token de acesso." "Caso de uso" "RF01,Aplicacao,Codigo"
                usuarioRepository = component "UsuarioRepository" "Porta de saída: buscarPorEmail, buscarPorId e incluir." "Interface" "RF01,Porta,Codigo"
                tokenService = component "TokenService" "Porta de saída: emitir e verificar token." "Interface" "RF01,Porta,Codigo"
                senhaHasher = component "SenhaHasher" "Porta de saída: gerar e comparar hash de senha." "Interface" "RF01,Porta,Codigo"

                # Fatia RF01: domínio (visão de Código)
                usuario = component "Usuario" "Entidade com id, nome, email, senhaHash e um único perfil (RN01)." "Classe de domínio" "RF01,Dominio,Codigo,SomenteCodigo"
                perfilUsuario = component "PerfilUsuario" "Enumeração: CLIENTE, FREELANCER e ADMINISTRADOR." "Tipo de domínio" "RF01,Dominio,Codigo,SomenteCodigo"
                errosDominio = component "ErroDominio" "Erros de validação, autenticação, permissão, inexistência e conflito, sem dependência de HTTP." "Classes de domínio" "RF01,Dominio,Codigo,SomenteCodigo"

                # Fatia RF01: adaptadores de saída
                postgresUsuarioRepository = component "PostgresUsuarioRepository" "Persiste usuários no PostgreSQL." "pg" "RF01,AdaptadorSaida,Codigo"
                seedAdministrador = component "SeedAdministrador" "Carga inicial idempotente do Administrador." "pg" "RF01,AdaptadorSaida"
                jwtTokenService = component "JwtTokenService" "Emite e verifica JWT HS256 com expiração de 1 hora." "jsonwebtoken" "RF01,AdaptadorSaida,Codigo"
                bcryptSenhaHasher = component "BcryptSenhaHasher" "Gera e compara hashes bcrypt." "bcryptjs" "RF01,AdaptadorSaida,Codigo"
            }
            db = container "Banco de Dados" "Armazena usuários, projetos, propostas, contratos e pagamentos." "PostgreSQL" "Database"
        }

        # Relações no nível de contexto
        cliente -> freelahub "Publica projetos, avalia propostas e paga freelancers"
        freelancer -> freelahub "Busca projetos, envia propostas e entrega trabalhos"
        admin -> freelahub "Modera a plataforma"
        freelahub -> gatewayPagamento "Solicita cobranças e repasses" "HTTPS/REST"
        freelahub -> servicoEmail "Envia notificações" "HTTPS/REST"
        gatewayPagamento -> freelahub "Confirma status de pagamento" "Webhook HTTPS"
        servicoEmail -> cliente "Entrega notificações por e-mail" "SMTP"
        servicoEmail -> freelancer "Entrega notificações por e-mail" "SMTP"

        # Relações no nível de container
        cliente -> freelahub.webapp "Usa" "HTTPS"
        freelancer -> freelahub.webapp "Usa" "HTTPS"
        admin -> freelahub.webapp "Usa" "HTTPS"
        freelahub.webapp -> freelahub.api "Faz requisições" "JSON/HTTPS (REST) + JWT"
        freelahub.api -> freelahub.db "Lê e grava dados" "SQL (via adaptador de repositório)"
        freelahub.api -> gatewayPagamento "Cria cobranças e repasses" "HTTPS/REST (adaptador de pagamento)"
        freelahub.api -> servicoEmail "Envia e-mails" "HTTPS/REST (adaptador de notificação)"
        gatewayPagamento -> freelahub.api "Notifica pagamento confirmado" "Webhook HTTPS"

        # Relações no nível de componente: propostas e notificações
        freelahub.webapp -> freelahub.api.rotasPropostas "Envia e consulta propostas" "JSON/HTTPS + JWT"
        freelahub.api.rotasPropostas -> freelahub.api.enviarProposta "Executa"
        freelahub.api.rotasPropostas -> freelahub.api.listarPropostas "Executa"
        freelahub.api.enviarProposta -> freelahub.api.proposta "Cria"
        freelahub.api.enviarProposta -> freelahub.api.projetoConsulta "Consulta status e dono do projeto"
        freelahub.api.enviarProposta -> freelahub.api.propostaRepository "Verifica duplicidade e salva"
        freelahub.api.enviarProposta -> freelahub.api.notificationService "Notifica nova proposta"
        freelahub.api.listarPropostas -> freelahub.api.projetoConsulta "Verifica o dono do projeto"
        freelahub.api.listarPropostas -> freelahub.api.propostaRepository "Lista por projeto"
        freelahub.api.postgresPropostaRepository -> freelahub.api.propostaRepository "Implementa"
        freelahub.api.postgresProjetoConsulta -> freelahub.api.projetoConsulta "Implementa"
        freelahub.api.consoleNotification -> freelahub.api.notificationService "Implementa"
        freelahub.api.postgresPropostaRepository -> freelahub.db "Lê e grava propostas" "SQL"
        freelahub.api.postgresProjetoConsulta -> freelahub.db "Lê projetos" "SQL"
        freelahub.api.consoleNotification -> servicoEmail "Simula o envio (mensagem registrada no console)"

        # Relações da Aplicação Web
        cliente -> freelahub.webapp.paginasProjetos "Publica e acompanha projetos" "HTTPS"
        freelancer -> freelahub.webapp.paginasProjetos "Busca projetos" "HTTPS"
        freelahub.webapp.roteamento -> freelahub.webapp.sessao "Consulta perfil e token"
        freelahub.webapp.roteamento -> freelahub.webapp.paginasAutenticacao "Renderiza"
        freelahub.webapp.roteamento -> freelahub.webapp.paginasProjetos "Renderiza"
        freelahub.webapp.roteamento -> freelahub.webapp.paginasPropostas "Renderiza"
        freelahub.webapp.roteamento -> freelahub.webapp.paginasContratos "Renderiza"
        freelahub.webapp.paginasAutenticacao -> freelahub.webapp.sessao "Inicia e encerra a sessão"
        freelahub.webapp.paginasAutenticacao -> freelahub.webapp.clienteApi "Usa"
        freelahub.webapp.paginasProjetos -> freelahub.webapp.clienteApi "Usa"
        freelahub.webapp.paginasPropostas -> freelahub.webapp.clienteApi "Usa"
        freelahub.webapp.paginasContratos -> freelahub.webapp.clienteApi "Usa"
        freelahub.webapp.clienteApi -> freelahub.webapp.sessao "Obtém o token"
        freelahub.webapp.clienteApi -> freelahub.api "Faz requisições" "JSON/HTTPS (REST) + JWT"

        # Relações da fatia RF05
        freelahub.webapp.clienteApi -> freelahub.api.contratoController "Aceita propostas e consulta contratos" "JSON/HTTPS (REST) + JWT"
        freelahub.api.contratoController -> freelahub.api.authMiddleware "Protege as rotas"
        freelahub.api.contratoController -> freelahub.api.errorMiddleware "Encaminha erros"
        freelahub.api.contratoController -> freelahub.api.aceitarProposta "Executa"
        freelahub.api.contratoController -> freelahub.api.consultarContratos "Executa"
        freelahub.api.aceitarProposta -> freelahub.api.contrato "Gera"
        freelahub.api.aceitarProposta -> freelahub.api.proposta "Aceita e recusa"
        freelahub.api.aceitarProposta -> freelahub.api.contratoRepository "Salva o contrato"
        freelahub.api.aceitarProposta -> freelahub.api.unidadeDeTrabalho "Executa em transação"
        freelahub.api.aceitarProposta -> freelahub.api.propostaRepository "Atualiza propostas"
        freelahub.api.aceitarProposta -> freelahub.api.projetoConsulta "Consulta dono e status"
        freelahub.api.aceitarProposta -> freelahub.api.projetoInicio "Inicia o projeto"
        freelahub.api.aceitarProposta -> freelahub.api.notificationService "Notifica freelancers"
        freelahub.api.consultarContratos -> freelahub.api.contratoRepository "Consulta"
        freelahub.api.postgresContratoRepository -> freelahub.api.contratoRepository "Implementa"
        freelahub.api.postgresUnidadeDeTrabalho -> freelahub.api.unidadeDeTrabalho "Implementa"
        freelahub.api.postgresProjetoInicio -> freelahub.api.projetoInicio "Implementa"
        freelahub.api.postgresContratoRepository -> freelahub.db "Lê e grava contratos" "SQL"
        freelahub.api.postgresUnidadeDeTrabalho -> freelahub.db "Controla transações" "SQL"
        freelahub.api.postgresProjetoInicio -> freelahub.db "Atualiza o status do projeto" "SQL"

        # Relações da fatia RF01
        freelahub.webapp -> freelahub.api.usuariosController "Cadastra usuário" "JSON/HTTP"
        freelahub.webapp -> freelahub.api.sessoesController "Faz login" "JSON/HTTP"
        freelahub.api.usuariosController -> freelahub.api.cadastrar "Chama"
        freelahub.api.sessoesController -> freelahub.api.autenticar "Chama"
        freelahub.api.authMiddleware -> freelahub.api.tokenService "Verifica token"
        freelahub.api.usuariosController -> freelahub.api.errorMiddleware "Encaminha erros"
        freelahub.api.sessoesController -> freelahub.api.errorMiddleware "Encaminha erros"
        freelahub.api.authMiddleware -> freelahub.api.errorMiddleware "Encaminha erros"
        freelahub.api.cadastrar -> freelahub.api.usuarioRepository "Consulta e inclui usuário"
        freelahub.api.cadastrar -> freelahub.api.senhaHasher "Gera hash"
        freelahub.api.cadastrar -> freelahub.api.usuario "Valida e cria"
        freelahub.api.autenticar -> freelahub.api.usuarioRepository "Busca por e-mail"
        freelahub.api.autenticar -> freelahub.api.senhaHasher "Compara hash"
        freelahub.api.autenticar -> freelahub.api.tokenService "Emite token"
        freelahub.api.usuario -> freelahub.api.perfilUsuario "Possui um"
        freelahub.api.usuario -> freelahub.api.errosDominio "Lança"
        freelahub.api.cadastrar -> freelahub.api.errosDominio "Lança"
        freelahub.api.autenticar -> freelahub.api.errosDominio "Lança"
        freelahub.api.usuarioRepository -> freelahub.api.usuario "Assinaturas usam"
        freelahub.api.tokenService -> freelahub.api.perfilUsuario "Assinaturas usam"
        freelahub.api.postgresUsuarioRepository -> freelahub.api.usuarioRepository "Implementa"
        freelahub.api.postgresUsuarioRepository -> freelahub.api.usuario "Mapeia"
        freelahub.api.jwtTokenService -> freelahub.api.tokenService "Implementa"
        freelahub.api.bcryptSenhaHasher -> freelahub.api.senhaHasher "Implementa"
        freelahub.api.seedAdministrador -> freelahub.api.senhaHasher "Gera hash"
        freelahub.api.seedAdministrador -> freelahub.api.usuario "Valida"
        freelahub.api.postgresUsuarioRepository -> freelahub.db "Lê e grava usuários" "SQL"
        freelahub.api.seedAdministrador -> freelahub.db "Insere Administrador" "SQL"
    }

    views {
        systemContext freelahub "Contexto" {
            include *
            autolayout lr
            description "Diagrama de Contexto (C4 nível 1) do FreelaHub."
        }

        container freelahub "Containers" {
            include *
            exclude "servicoEmail -> cliente"
            exclude "servicoEmail -> freelancer"
            autolayout lr
            description "Diagrama de Containers (C4 nível 2) do FreelaHub."
        }

        component freelahub.api "Componentes-Propostas" {
            include freelahub.webapp freelahub.db servicoEmail
            include freelahub.api.rotasPropostas freelahub.api.enviarProposta freelahub.api.listarPropostas freelahub.api.proposta
            include freelahub.api.propostaRepository freelahub.api.projetoConsulta freelahub.api.notificationService
            include freelahub.api.postgresPropostaRepository freelahub.api.postgresProjetoConsulta freelahub.api.consoleNotification
            autolayout lr
            description "Diagrama de Componentes (C4 nível 3) da API: fatia de propostas e notificações (RF04 e RF07)."
        }

        component freelahub.webapp "ComponentesWeb" {
            include *
            autolayout lr
            description "Diagrama de Componentes (C4 nível 3) da Aplicação Web."
        }

        component freelahub.api "RF05_Componentes" {
            include element.tag==RF05
            include freelahub.api.proposta freelahub.api.propostaRepository freelahub.api.projetoConsulta freelahub.api.notificationService
            include freelahub.api.authMiddleware freelahub.api.errorMiddleware
            include freelahub.webapp freelahub.db
            autolayout tb
            description "Diagrama de Componentes (C4 nível 3) da fatia RF05: aceite de proposta e contratos."
        }

        component freelahub.api "RF01_Componentes" {
            include element.tag==RF01
            exclude element.tag==SomenteCodigo
            include freelahub.webapp freelahub.db
            autolayout lr
            description "Diagrama de Componentes (C4 nível 3) da fatia RF01: cadastro e autenticação."
        }

        component freelahub.api "RF01_Codigo" {
            include element.tag==Codigo
            autolayout tb
            description "Visão de Código (C4 nível 4) da fatia RF01: classes de domínio, casos de uso, portas e adaptadores."
        }

        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Externo" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
            element "Dominio" {
                background #1b6e3c
                color #ffffff
            }
            element "Aplicacao" {
                background #2f6fb3
                color #ffffff
            }
            element "Porta" {
                background #f2c14e
                color #000000
                shape Hexagon
            }
            element "AdaptadorEntrada" {
                background #b9d7f2
                color #000000
            }
            element "AdaptadorSaida" {
                background #d9d9d9
                color #000000
            }
            element "Browser" {
                shape WebBrowser
            }
            element "Domínio" {
                background #f5da81
            }
            element "Caso de uso" {
                background #a9dfbf
            }
            element "Adaptador" {
                background #d7dbdd
            }
        }
    }
}
