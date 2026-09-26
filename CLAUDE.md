# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kivira (formerly LUK) is a gamified educational platform for children, built as a university capstone (TCC) project. It has two user profiles: **professor** (class/activity management) and **aluno** (student, plays interactive games). The board-game mechanic is based on the LUK pedagogical system.

Monorepo layout:
- `backend/` — FastAPI (Python) REST API
- `frontend/` — React + Vite SPA

## Commands

Run from the repo root (uses root `package.json` to orchestrate both apps):
```
npm run dev            # runs backend + frontend concurrently
npm run dev:backend    # cd backend && uvicorn main:app --reload
npm run dev:frontend   # npm run dev --prefix frontend (Vite)
```

Frontend only (from `frontend/`):
```
npm run dev        # Vite dev server
npm run build      # production build
npm run lint       # ESLint (flat config, eslint.config.js)
npm run preview    # preview production build
```

Backend only (from `backend/`, with the venv in `backend/venv` activated):
```
uvicorn main:app --reload
pip install -r requirements.txt
```

There are no automated tests configured in either the backend or frontend yet (root `npm test` is a stub; no `tests/` directory exists despite being referenced in CONTRIBUTING.md's aspirational layout).

Env files: `backend/.env` (see `backend/.env.example` — `DATABASE_URL`) and `frontend/.env` (see `frontend/.env.example` — `VITE_API_URL`). Backend also reads `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` (see `backend/core/config.py`), each with an insecure development fallback if unset.

## Backend Architecture (`backend/`)

FastAPI app assembled in `main.py`: instantiates `FastAPI()`, configures CORS, then imports and registers one `APIRouter` per domain.

Layers, one file per domain entity (`professor`, `aluno`, `atividade`, `turma`, `questao`, `opcao_questao`, `aluno_turma`, `auth`, `avatar`, `admin`, `ia`, `pixabay`):
- `models/` — SQLAlchemy ORM classes (`Base` from `database.py`)
- `schemas/` — Pydantic request/response schemas
- `routes/` — `APIRouter`s with path operations; each router file contains its embedded business logic directly. Routes with no `await` are plain `def` (sync SQLAlchemy would block the event loop in `async def`)
- `services/` — only external integrations and cross-cutting helpers: `gemini_service` (AI question generation), `pixabay_service`, `cloudinary_service`, `auditoria_service` (`registrar_log`); `ollama_service` is unused
- `dependecies.py` (note the typo — matches the actual filename) — shared FastAPI dependencies: `oauth2_schema`, `pegar_sessao_kivira` (DB session per-request, from `sessao_local` in `database.py`) and `verificar_token_kivira` (JWT auth guard, used as a router-level dependency)
- `core/rbac.py` — role guards for route dependencies (`admin_ou_professor`, `somente_admin`, `somente_aluno`) and `pode_gerenciar(session, usuario, recurso)` for ownership checks

Auth (`routes/auth.py`): bcrypt password hashing, JWT via `python-jose`. Two login flows — `/auth_kivira/login` (JSON, used by the SPA) and `/auth_kivira/login_form` (OAuth2 form, used by Swagger's "Authorize" button) — plus `/auth_kivira/login_aluno` for student username/password login. Tokens carry `sub` (user id) and `exp`; `verificar_token_kivira` decodes and loads the `Usuario`.

Database: MySQL via SQLAlchemy + PyMySQL, hosted on Aiven cloud — `database.py` disables hostname/cert verification in `connect_args` to work with Aiven's SSL setup. Ownership checks go through `pode_gerenciar` (admin or the professor who owns the Atividade/Turma).

Code comments and identifiers throughout the backend are in Portuguese — match that convention when editing.

## Frontend Architecture (`frontend/src/`)

- `pages/` — route-level screens, grouped by area: `auth/` (Login, LoginAluno, LoginEmoji, Cadastro), `professor/` (Dashboard, Turmas, Atividades, CriarAtividade), `aluno/`, `admin/`, `jogo/` (JogoAndamento — the student game board)
- `controllers/` — custom hooks holding page-level state/logic (e.g. `useCriarAtividade.js`, `useJogo.js`), kept separate from the presentational `pages/` components
- `components/ui/` — shared presentational primitives (`Button`, `Input`, `SelectCustom`, `BordaLateral`)
- `services/api.js` — single `apiRequest(endpoint, { method, data, headers })` wrapper around `fetch`; auto-attaches `Authorization: Bearer <token>` from `localStorage.access_token`, JSON-encodes plain objects, passes `FormData` through untouched, and throws using FastAPI's `detail` field on non-OK responses, and on a 401 (outside `/auth_kivira/*`) clears the session and redirects to login. Use this for all backend calls instead of calling `fetch` directly.
- `services/sessao.js` — `salvarSessao` / `limparSessao`, the only place that touches `access_token`/`refresh_token`/`user_type` in `localStorage`.
- Routing is centralized in `App.jsx` via `react-router-dom` `<Routes>`; `components/RequireRole.jsx` guards `/professor/*`, `/admin/*`, `/aluno/*` and `/jogo` by the `user_type` stored at login (the backend remains the real authorization).

Styling: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + daisyUI; `animate.css` for transition/feedback animations (e.g. the board's `flipInY` card-reveal effect). Icons via Font Awesome (`@fortawesome/react-fontawesome`).

## Naming Conventions (from CONTRIBUTING.md)

Backend/frontend split their naming by language convention, not project-wide:
- Python: `snake_case` for variables/functions/modules, `PascalCase` for classes/exceptions, `UPPER_SNAKE_CASE` for constants
- JS/React: `camelCase` for variables/functions/hooks, `PascalCase` for components and their filenames (`StudentCard.jsx`), `camelCase` for utility/hook filenames
- HTML/JSX: `kebab-case` for element `id`s and CSS classes
- SQL: `snake_case`, table names plural
- API endpoint URLs and JSON payloads: `snake_case` (e.g. `/atividade/criar_atividade`, `texto_questao`), by team decision — this overrides CONTRIBUTING.md's `kebab-case`/`camelCase` rule. The frontend reads the raw `snake_case` fields; only JS-side variables are `camelCase`.
