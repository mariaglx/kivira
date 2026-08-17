# Guia de Contribuição e Padronização de Código

Este documento estabelece as diretrizes de padronização de código, nomenclaturas, arquitetura e fluxo de trabalho com Git para o repositório do nosso projeto de TCC.

O objetivo destas regras é manter a consistência, legibilidade e manutenibilidade do código entre todos os integrantes da equipe.

---

## 1. Padronização de Nomenclatura por Tecnologia

Para respeitar as convenções idiomáticas de cada linguagem e ecossistema, adotamos os seguintes padrões:

| Camada / Elemento | Padrão | Exemplo |
| :--- | :--- | :--- |
| **Python (Backend)** | | |
| Variáveis, funções e métodos | `snake_case` | `user_id`, `calculate_score()` |
| Classes e Exceções | `PascalCase` | `StudentService`, `AuthException` |
| Constantes globais | `UPPER_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS`, `BASE_URL` |
| Módulos e pacotes | `snake_case` (minúsculo) | `auth_service.py`, `database/` |
| **JavaScript / React (Frontend)** | | |
| Variáveis, funções e hooks | `camelCase` | `studentData`, `fetchResults()`, `useAuth()` |
| Componentes React, Interfaces | `PascalCase` | `StudentCard`, `SidebarMenu` |
| Constantes globais | `UPPER_SNAKE_CASE` | `API_TIMEOUT`, `DEFAULT_PAGE_SIZE` |
| Arquivos de Componentes | `PascalCase` | `StudentCard.jsx`, `SidebarMenu.tsx` |
| Arquivos Utilitários / Hooks | `camelCase` | `formatDate.js`, `useAuth.js` |
| **HTML / JSX (DOM)** | | |
| IDs de elementos HTML/JSX | `kebab-case` | `id="submit-button"`, `id="user-profile"` |
| Classes CSS (`className`) | `kebab-case` | `className="card-header"` |
| **SQL / Banco de Dados** | | |
| Nomes de tabelas | `snake_case` (Plural) | `students`, `game_sessions` |
| Nomes de colunas | `snake_case` | `first_name`, `created_at` |
| Chaves Primárias / Estrangeiras | `snake_case` | `id`, `student_id` |

---

## 2. Regras de Integração Backend <-> Frontend (API)

Para evitar incompatibilidades de estilo entre Python (`snake_case`) e React (`camelCase`):

* **JSON Payloads:** Os endpoints da API em Python devem Serializar/Deserializar os payloads em `camelCase` para envio ao frontend, ou o frontend deve fazer o mapeamento dos campos na camada de serviço/fetcher.
* **URLs de Endpoints:** Devem ser em `kebab-case` no plural.
  * **Bom:** `GET /api/v1/student-scores`
  * **Ruim:** `GET /api/v1/getStudentScores` ou `/api/v1/student_scores`

---

## 3. Estrutura do Repositório e Organização

### 3.1 Backend (Python)
```text
backend/
├── app/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── main.py
├── tests/
└── requirements.txt