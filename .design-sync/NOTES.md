# design-sync notes (Kivira)

## How this repo is synced
- Not a published package: `frontend/` is a Vite app with plain `.jsx`, no `dist/`, no `.d.ts`. The bundle entry is the committed barrel `.design-sync/entry.js` (re-exports `frontend/src/components/ui/*.jsx`); `cfg.entry` points at it, so PKG_DIR resolves to the repo root (`kivira`, `window.Kivira`).
- Prop contracts are hand-written in `cfg.dtsPropsFor` (one per component). When a component's props change in `frontend/src/components/ui/`, update its entry there — nothing extracts them automatically.
- New component in `ui/`: add the export to `entry.js`, a `componentSrcMap` + `dtsPropsFor` entry, and a preview in `previews/`.
- CSS: Tailwind v4 is only compiled by Vite in the app, so `node .design-sync/build-css.mjs` compiles `.design-sync/kivira.css` (imports `frontend/src/index.css`, scans `frontend/src` + `previews/`, plus an `@source inline()` safelist of layout/color utilities for the design agent) into `.design-sync/.cache/kivira.css` = `cfg.cssEntry`. Run it before every build (it's in `buildCmd`). Grow the safelist in `kivira.css` if designs need utilities the app doesn't use.
- Fonts are remote, same as `frontend/index.html`: Inter (rsms.me) + Nunito (Google Fonts), prepended as `@import url(...)` by `build-css.mjs` → `[FONT_REMOTE]` is expected.
- All components land in group `general`: the `ui/` dir is generic and the source has no JSDoc `@category`. Regrouping needs `docsMap` stub docs, which would replace the synthesized Examples in `.prompt.md` — not worth it at 12 components.
- Node modules: `--node-modules frontend/node_modules` (after `npm ci --prefix frontend`).

## Windows quirks
- Render check / capture use system Chrome: `DS_CHROMIUM_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"`; `playwright` is installed into `.ds-sync/` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (no browser download needed).
- A shell whose cwd is inside `ds-bundle/` makes the build's rm fail with EPERM — run the build from the repo root.

## Known render warns / capture artifacts
- `package-capture.mjs` pins the page clock (`setFixedTime`) and shoots right after load: motion **spring** animations (`Lista`/`Item` cascade, `Modal`) stay at opacity 0 and `Entrada`/`Contador` are caught mid-animation. In a real-clock browser they finish (verified with a 2.5s delayed shot of each `?story=` URL). Grade these from a delayed real-clock shot, not the review sheet.
- `Modal` preview wraps the modal in a `transform: translateZ(0)` frame so its `fixed inset-0` overlay anchors to the card instead of escaping it; `cfg.overrides.Modal` is `cardMode: single`.
- `SelectCustom` open state needs a click — previews show closed states only.

## Re-sync risks
- `dtsPropsFor` is a hand copy of each component's props: silently stale if `ui/*.jsx` props change.
- `conventions.md` names token/class names verified against the build of 2026-10-27; re-validate against `_ds_bundle.css` when `frontend/src/index.css` changes.
- `Avatar` `arquivo` images live in `frontend/public/avatares` and are not shipped; previews and conventions use `nome` only.
- No icon library ships in the bundle (`lucide-react` is only inlined where `Carregando` uses `Sparkles`); `Input` `icone` in designs needs an inline-SVG component.
