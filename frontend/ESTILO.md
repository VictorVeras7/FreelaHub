# Estilo visual do FreelaHub

Direção aprovada: linguagem editorial inspirada no template Lumenis da galeria [Oversight Supply](https://supply.madebyoversight.com), simplificada. A página inicial tem só o letreiro e a chamada, e as telas internas usam cartões brancos flutuantes sobre fundo cinza. A interface não usa fotos. O código e os textos do FreelaHub são próprios.

Os tokens ficam em `src/styles/global.css` (variáveis CSS) e `tailwind.config.js` (nomes usados nas classes). As telas usam apenas esses tokens.

## Paleta

| Token | Hexadecimal | Uso |
|---|---|---|
| `primaria`, `texto` | `#000000` | Texto, botões e bordas fortes |
| `fundo`, `superficie` | `#FFFFFF` | Fundo, campos e modais |
| `neutro-suave` | `#F4F4F4` | Blocos de apoio e navegação |
| `texto-suave` | `#525252` | Texto de apoio |
| `borda` | `#D6D6D6` | Contornos discretos |
| `oliva` | `#353420` | Cabeçalho das páginas e painel do login |
| `sucesso` | `#166534` | Concluído, aceita e liberado |
| `alerta` | `#854D0E` | Em andamento e retido |
| `erro` | `#AA1C1C` | Erros, recusas e ações destrutivas |

## Tipografia

| Uso | Família | Tamanho |
|---|---|---|
| Letreiro e títulos de página (`h1`) | Anton | Letreiro ocupa a largura da tela, `text-titulo` de 32 a 52 px |
| Títulos de bloco | TASA Orbiter | `text-subtitulo`, 26 px |
| Texto geral | TASA Orbiter | `text-corpo`, 15 px |
| Rótulos e badges | TASA Orbiter, caixa alta | `rotulo`, 12 px |

## Forma e espaçamento

- Cartões com raio de 24 px e sombra suave, que sobem levemente no hover.
- Campos e botões com raio de 12 px. Badges e etiquetas em formato de pílula.
- Conteúdo interno limitado a 1152 px, com grade de até 3 cartões.
- Margem lateral de 16 px no celular e 32 px a partir de 640 px.

## Componentes base

| Componente | Arquivo |
|---|---|
| Botão | `components/Botao.tsx` |
| Cartão | `components/Cartao.tsx` |
| Badge de status | `components/StatusBadge.tsx` |
| Campo | `components/Campo.tsx` |
| Modal | `components/ModalConfirmacao.tsx` |
| Feedback e cabeçalho de página | `components/Feedback.tsx` |
| Toast | `components/Toast.tsx` |

## Acessibilidade

Todo campo tem `label`, o foco é visível, os modais prendem o foco e fecham com Esc, o status sempre traz texto além da cor.
