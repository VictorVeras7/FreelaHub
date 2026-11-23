# Estilo visual do FreelaHub

Direção aprovada: Produto Preciso, com acabamento moderno. A referência é o template Nullify da galeria [Oversight Supply](https://supply.madebyoversight.com). A interface é clara, com bordas finas e informação objetiva. O gradiente índigo e violeta aparece só em pontos de marca e ações principais.

Os tokens ficam em `src/styles/global.css` (variáveis CSS) e `tailwind.config.js` (nomes usados nas classes). As telas usam apenas esses tokens.

## Paleta

| Token | Hexadecimal | Uso |
|---|---|---|
| `primaria` | `#4338CA` | Ações, links e foco |
| `primaria-forte` | `#3730A3` | Texto sobre fundo primário suave |
| `violeta` | `#7C3AED` | Final do gradiente de marca |
| `primaria-suave` | `#E0E7FF` | Secundária, badges e seleção |
| `fundo` | `#F8FAFC` | Fundo da página |
| `superficie` | `#FFFFFF` | Cartões, campos e modais |
| `texto` | `#0F172A` | Texto principal |
| `texto-suave` | `#475569` | Texto de apoio |
| `borda` | `#E2E8F0` | Divisões e contornos |
| `sucesso` | `#15803D` | Concluído, aceita e liberado |
| `alerta` | `#B45309` | Em andamento e retido |
| `erro` | `#B91C1C` | Erros, recusas e ações destrutivas |

## Tipografia

Família: Inter Variable.

| Token | Tamanho | Uso |
|---|---|---|
| `text-titulo` | 28 px | Título da página |
| `text-subtitulo` | 20 px | Título de bloco |
| `text-corpo` | 14 px | Texto geral |
| `text-detalhe` | 12 px | Rótulos, badges e notas |

Valores monetários e datas usam a classe `numeros`, com algarismos de largura fixa.

## Espaçamento e forma

- Escala de 4 px do Tailwind. Cartões usam `p-5` ou `p-6` e listas usam `gap-4`.
- Raios: `rounded-campo` (10 px) e `rounded-cartao` (14 px). Badges e navegação usam `rounded-full`.
- Sombras: `shadow-cartao`, `shadow-elevado` (hover) e `shadow-modal`.
- Movimento curto (`animate-surgir`), desativado por `prefers-reduced-motion`.

## Componentes base

| Componente | Arquivo | Exemplo |
|---|---|---|
| Botão | `components/Botao.tsx` | `<Botao variante="primaria">Enviar proposta</Botao>` |
| Cartão | `components/Cartao.tsx` | `<Cartao className="p-5">...</Cartao>` |
| Badge de status | `components/StatusBadge.tsx` | `<StatusBadge status="ABERTO" />` |
| Campo | `components/Campo.tsx` | `<Campo rotulo="E-mail" erro={mensagem} />` |
| Modal | `components/ModalConfirmacao.tsx` | Confirmação de ações irreversíveis |
| Feedback | `components/Feedback.tsx` | Carregamento, vazio e erro |
| Toast | `components/Toast.tsx` | `useToast()('Projeto publicado.')` |

## Acessibilidade

Todo campo tem `label`, o foco é visível, os modais prendem o foco e fecham com Esc, e o status sempre traz texto além da cor.
