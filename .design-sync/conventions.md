# Kivira — how to build with this design system

Kivira is a gamified learning app for children (student "aluno" screens) and teachers ("professor" panel). UI copy is Brazilian Portuguese. Components live on `window.Kivira` (`Button`, `Input`, `SelectCustom`, `BarraProgresso`, `Avatar`, `Carregando`, `EstadoVazio`, and the motion helpers `Entrada`, `Lista`, `Item`, `Contador`, `Modal`). No provider or wrapper is needed: the theme is global CSS from `styles.css`.

## Styling idiom: precompiled Tailwind v4 utilities + brand tokens

Style layout glue with Tailwind classes. **The CSS is precompiled**, so only classes present in `_ds_bundle.css` exist; stick to the families below (all verified in the build) and grep `_ds_bundle.css` before using anything unusual. Never use Tailwind grays (`text-gray-*`) — they are off-palette.

| Family | Real names |
|---|---|
| Brand colors (`bg-*`, `text-*`, `border-*`) | `azul` (default text, secondary), `coral` (primary action), `laranja`, `laranja-claro`, `bege` (page background), `branco` (surfaces), `cinza-claro` (borders), `verde` (success), `vermelho` (destructive only) |
| Opacity steps | `text-azul/60` secondary text, `text-azul/40` placeholder, `bg-azul/5`–`/15` tints, `border-cinza-claro/30` |
| Subject colors (student cards) | `bg-mat-bg text-mat-fg`, `bg-cie-bg text-cie-fg`, `bg-por-bg text-por-fg`, `bg-ouro-bg text-ouro-fg` |
| Component classes | `.cartao` (white rounded-3xl card), `.rotulo` (uppercase field label), `.pagina` (padded `<main>`), `.faixa-secao` (pill section header), `.tatil` (3D button shadow; color via `[--sombra:var(--color-azul-escuro)]`) |
| Shape | fields/buttons `rounded-xl`, cards `rounded-2xl`/`rounded-3xl`, pills `rounded-full`; `shadow-sm` on cards, `shadow-xl` only for modals |
| Type | `h1`–`h3` get Nunito automatically; body is Inter. Student screens `font-black`/`font-extrabold`, teacher screens `font-bold` |
| Layout | mobile-first `flex`, `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `gap-*`, `p-*`, `max-w-*`, `min-w-0` on flexible columns, `min-h-11` touch targets |

Tokens are also CSS variables (`var(--color-coral)`, `var(--color-azul-escuro)`…) for inline styles.

## Component gotchas

- `Button`: pick `variante` (`primario` | `secundario` | `contorno` | `perigo` | `fantasma`) and `tamanho` (`md` | `sm` | `icone`); don't restyle colors with `className` — only width/margins.
- `Input` `icone` takes a component (`size`/`className` props); no icon library ships in the bundle, so pass a small inline-SVG component or omit it.
- `SelectCustom` `onChange` receives `{ target: { name, value } }`.
- `Avatar`: pass `nome` (shows the initial on coral). `arquivo` points at the app's `/avatares/` folder, which designs can't reach.
- `Lista` must wrap `Item`s for the cascade to run; `Modal` is a `fixed inset-0` overlay controlled by `aberto`.

## Where the truth lives

Read `styles.css` → `_ds_bundle.css` (tokens under `@theme`, component classes under `@layer components`) and each `components/general/<Name>/<Name>.prompt.md` + `.d.ts` before styling.

## Example

```jsx
const { Button, EstadoVazio, Lista, Item } = window.Kivira;

<main className="pagina bg-bege min-h-screen">
  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
    <h1 className="text-2xl sm:text-3xl font-black text-azul">Minhas turmas</h1>
    <Button tamanho="sm">Nova turma</Button>
  </div>
  <Lista className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <Item elevar className="cartao p-4">
      <p className="font-bold text-azul">4º ano B</p>
      <p className="text-xs text-azul/60">21 alunos</p>
    </Item>
  </Lista>
  <EstadoVazio acao={<Button tamanho="sm">Criar atividade</Button>}>
    Nenhuma atividade publicada ainda.
  </EstadoVazio>
</main>
```
