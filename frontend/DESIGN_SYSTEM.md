# Design system do Kivira

Extraído das telas do **aluno** e do **jogo**, que são a referência visual do
produto. As telas de professor/admin usam os mesmos tokens e componentes
(`Button`, `Input`, `.cartao`...), com menu azul e animações do `motion`.

Tokens e classes ficam em `src/index.css`; componentes em `src/components/ui/`.

## Cores (`@theme` → utilitários `bg-*`, `text-*`, `border-*`)

| Token | Hex | Uso |
|---|---|---|
| `azul` | `#214a5a` | texto padrão, menu do professor, botão secundário |
| `coral` | `#eb7561` | ação principal, aba ativa, fase liberada |
| `laranja` / `laranja-claro` | `#eeb37f` / `#f0c6a1` | anéis de avatar, peças do jogo, item ativo do menu |
| `bege` | `#f5e6d3` | fundo de todas as telas |
| `branco` | `#ffffff` | superfícies (cards, header) |
| `cinza-claro` | `#ececec` | bordas, fase bloqueada |
| `verde` | `#3fae7a` | acerto, fase concluída |
| `vermelho` | `#c0392b` | só ações destrutivas |
| `*-escuro` | — | sombra do botão `tatil` da mesma cor |
| `pessego-bg/fg` | — | faixas de seção do jogo (`.faixa-secao`) |
| `mat/cie/por/ouro-bg/fg` | — | cor por disciplina nos cards do aluno |

Texto secundário: `text-azul/60`; terciário/placeholder: `text-azul/40`.
Evite cinzas do Tailwind (`text-gray-*`) — fogem da paleta.

## Tipografia

- Títulos `h1–h3`: Nunito (`--font-display`), aplicado automaticamente.
- Corpo: Inter (`--font-sans`).
- Escala responsiva para títulos de página: `text-xl sm:text-2xl` (ou `text-2xl sm:text-3xl` no aluno).
- Peso: telas do aluno usam `font-black`/`font-extrabold`; professor `font-bold`.

## Forma e profundidade

- Raios: campos/botões `rounded-xl`, cards `rounded-2xl`/`rounded-3xl`, abas e badges `rounded-full`.
- Sombra: `shadow-sm` em cards; `shadow-xl` só em modais/popovers.
- **Botão tátil** (`.tatil`): sombra sólida embaixo que afunda ao clicar. Cor da sombra via `[--sombra:var(--color-azul-escuro)]`. Padrão de todo botão de ação no aluno e no jogo.

## Classes de componente (`@layer components`)

| Classe | O que é |
|---|---|
| `.pagina` | `<main>` de toda tela com menu — padding que cresce com a tela (`px-4 → sm:px-6 → lg:px-8`) |
| `.cartao` | superfície branca padrão (card, painel, estado vazio) |
| `.rotulo` | rótulo de campo em caixa alta |
| `.faixa-secao` | pílula de cabeçalho de seção do jogo |
| `.tatil` | botão com profundidade |
| `.animate-tremida-leve` | balanço de validação/erro |

## Componentes (`src/components/ui/`)

- `Button` — botão tátil. `variante`: `primario` (coral), `secundario` (azul), `contorno`, `perigo`, `fantasma` (chapado); `tamanho`: `md`, `sm`, `icone`; `as={Link}` pra links.
- `Input` — campo de texto padrão (`icone` opcional à esquerda).
- `EstadoVazio` — lista vazia padrão (cartão + ação opcional).
- `Animacao` — `Lista`/`Item` (cascata, `elevar` pro hover), `Entrada`, `Contador`, `Modal`. `utils/comemorar` dispara confete. Tudo respeita `prefers-reduced-motion`.
- `SelectCustom` — select estilizado.
- `BarraProgresso` — contínua (XP) ou em segmentos (peças).
- `Avatar` — imagem de `/avatares` ou inicial sobre coral; tamanho/raio/anel via `className`.
- `Carregando` — estado de carregamento de página.

Layouts:
- `aluno/HeaderAluno` — header branco; no celular as abas viram barra fixa no rodapé (ícone + nome).
- `SidebarPainel` — menu azul de professor/admin; abaixo de `lg` vira barra no topo + gaveta.

## Responsividade

Breakpoints do Tailwind, mobile-first:

| Faixa | Largura | Comportamento |
|---|---|---|
| celular | `< 640px` (padrão) | uma coluna; abas do aluno no rodapé; menu do professor em gaveta; bandeja de peças do jogo fixa no rodapé |
| tablet | `sm` 640px / `md` 768px | grids de 2 colunas; abas do aluno no topo só com ícone |
| desktop | `lg` 1024px+ | menu lateral fixo; formulários em 2 colunas; perguntas do jogo em coluna lateral; abas com texto |

Regras:
1. Comece pelo celular e adicione `sm:`/`lg:` — nunca larguras fixas (`w-100`, `min-w-80`) em colunas.
2. Layout de duas colunas: `flex flex-col lg:flex-row`; coluna fixa com `w-full lg:max-w-sm`, e `lg:sticky` só no desktop.
3. Coluna flexível sempre com `min-w-0` (senão texto longo estoura a tela).
4. Tabelas dentro de `overflow-x-auto`.
5. Alvo de toque mínimo de 44px (`min-h-11`) em tudo que a criança toca.
6. Cabeçalho título + ações: `flex flex-wrap gap-3` pra quebrar no celular.
