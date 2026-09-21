# Análise de redundância e arquitetura — Kivira

Levantamento feito em 2026-09-21 na branch `feature-jogo`. Só identifica; nada foi alterado.
Cada item traz **onde**, **problema** e **sugestão**. Itens marcados com ⚠️ eu não li a fundo (só grep/estrutura), então vale conferir antes de agir.

Legenda de prioridade: 🔴 alta (risco ou bug) · 🟡 média (dívida que cresce) · 🟢 baixa (limpeza)

---

## 1. Parte da IA (o que você quer ajustar)

Fluxo atual: `CriarAtividade` → `useCriarAtividade.gerarQuestoesComIA` → `POST /ia/gerar_questoes` → `routes/ia.py` → `services/gemini_service.py` → Gemini.

| # | Prio | Problema | Onde | Sugestão |
|---|------|----------|------|----------|
| 1.1 | 🔴 | **Qualquer usuário logado chama a IA**, inclusive aluno. O router só exige token válido, não papel. Cada chamada custa cota/dinheiro do Gemini e não há limite de taxa. | `routes/ia.py:8` | Usar `Depends(admin_ou_professor)` (já existe em `core/rbac.py`). Rate limit depois, se precisar. |
| 1.2 | 🟡 | **Ollama é código morto.** Nenhuma rota importa `ollama_service.py`; só comentários o citam. Variáveis `OLLAMA_*` seguem no config e no `.env.example`. | `services/ollama_service.py` (109 linhas), `core/config.py:18-20`, `.env.example` | Apagar o arquivo, as 3 variáveis e as linhas do `.env.example`. |
| 1.3 | 🟢 | Comentário no front diz "Ollama/llama3", mas o back usa Gemini. Comentário do back diz "fallback do ollama_service". | `useCriarAtividade.js:104`, `gemini_service.py:1-6,69` | Atualizar/remover os comentários junto com o item 1.2. |
| 1.4 | 🟡 | **Contagem inconsistente entre front e back.** O front considera "vazio" só o bloco sem pergunta *e* sem resposta. O back calcula `faltante = total − preenchidos`. Se o professor deixar um bloco meio preenchido (só pergunta), o back gera mais pares do que o front tem posições vazias; o front descarta o excedente silenciosamente. | `useCriarAtividade.js:112-123` × `gemini_service.py:88` | Uma regra só, em um lugar. Ex.: o front manda `quantidade_a_gerar = indicesVazios.length` e o back para de recalcular. |
| 1.5 | 🟡 | "Nunca repita pergunta ou resposta" existe **só no prompt**. Nada valida no código; a IA pode devolver duplicata ou repetir uma questão existente. | `gemini_service.py:34`, laço `:118-125` | Filtrar no back contra `questoes_existentes` e contra os próprios itens gerados (um `set`). |
| 1.6 | 🟢 | `extrair_json_da_resposta` remove cercas markdown, mas a chamada já usa `response_mime_type="application/json"`. Fallback provavelmente nunca dispara. | `gemini_service.py:63-70` | Remover o tratamento de ``` e manter só o `json.loads` com o 502. |
| 1.7 | 🟢 | Tratamento de erro do Gemini é bom, mas a validação do resultado repete a mesma mensagem 502 em dois pontos. | `gemini_service.py:113,127` | Unificar num único `if not questoes_geradas` no fim. |
| 1.8 | 🟡 | Limite `24` (quantidade máxima de casas do tabuleiro) aparece no schema do back e no front, e o tamanho de upload (5MB) tem comentário "precisa bater com" o back. Constantes duplicadas mantidas na mão. | `schemas/ia_geracao.py:17`, `useCriarAtividade.js:225` | Aceitável em TCC; no mínimo deixar as duas pontas apontando uma para a outra em comentário, ou expor por endpoint de config. |

---

## 2. Arquitetura do backend

### 🔴 2.1 Autorização inconsistente / com buracos
- `/pixabay/*`, `/atividade/upload_imagem`, `/atividade/imagem_do_pixabay` exigem só token, sem papel. Um aluno consegue subir imagem para o Cloudinary da conta do projeto.
- `GET /atividade/{id}` e `GET /atividade/` (placeholder) não checam dono nem papel; qualquer usuário autenticado lê qualquer atividade.
- `routes/aluno.py` e `routes/professor.py` **não** têm dependência no router; a proteção é rota a rota, fácil de esquecer numa rota nova.

**Sugestão:** definir a proteção no `APIRouter(dependencies=[...])` com o papel certo e abrir exceção só onde precisa (login, cadastro, verificar código da turma).

### 🔴 2.2 `async def` com SQLAlchemy síncrono
Quase todas as rotas são `async def` e usam `session.query(...)` (driver PyMySQL, bloqueante). Cada consulta trava o event loop inteiro; sob carga simultânea (uma turma jogando ao mesmo tempo) a API inteira fica lenta.
**Sugestão:** trocar para `def` simples nas rotas que só acessam o banco (o FastAPI roda em thread pool). Mantém `async` só onde há `await` real (Gemini, Pixabay, upload). Mudança mecânica, alto ganho.

### 🟡 2.3 Checagem de dono copiada ~15 vezes
Este trecho aparece, com pequenas variações, em `atividade.py`, `questao.py`, `opcao_questao.py`, `aluno_turma.py`, `aluno.py`, `professor.py`:

```python
if usuario.tipo != "admin" and (not professor or professor.id != atividade.professor_id):
    raise HTTPException(403, ...)
```

Junto vem a query `professor = session.query(Professor).filter(usuario_id == ...)` repetida antes de cada uma. São 48 comparações manuais de `usuario.tipo` com string literal.
**Sugestão:** duas funções em `core/rbac.py`: `professor_do_usuario(session, usuario)` e `garantir_dono(usuario, professor, recurso)`. Usar o enum `Papel` que já existe em vez de `"admin"`/`"estudante"` soltos.

### 🟡 2.4 `core/rbac.py` existe, mas é pouco usado
Ele oferece `exigir_papel`, `admin_ou_professor`, `somente_admin`. Só `admin.py` e algumas rotas de `atividade.py` usam. O resto faz `if usuario.tipo != ...` na mão dentro da função. Duas formas de fazer a mesma coisa.

### 🟡 2.5 Import circular disfarçado
`main.py` define `oauth2_schema`; `dependecies.py` importa de `main`; `core/rbac.py` importa de `dependecies`. Por isso o `main.py` precisa importar as rotas *depois* de criar o app (o comentário admite). A causa é o `oauth2_schema` estar no lugar errado.
**Sugestão:** mover `oauth2_schema` para `dependecies.py`. Os imports de rotas voltam ao topo e o comentário some. (Aproveitar para renomear `dependecies.py` → `dependencies.py`.)

### 🟡 2.6 `pegar_sessao_kivira` recria `sessionmaker` a cada requisição
`dependecies.py:15-18` cria um `sessionmaker` novo por request. Além do custo, se `Session()` falhar, `session` fica indefinida e o `finally` levanta `UnboundLocalError`.
**Sugestão:** `sessao_local = sessionmaker(bind=engine)` uma vez em `database.py`; a dependência vira `db = sessao_local(); try: yield db; finally: db.close()`.

### 🟡 2.7 `registrar_log` faz `commit` próprio
O docstring diz "não faz commit sozinho", mas a função faz `session.commit()`. Além disso o log é gravado em uma transação **separada** da operação principal: se o log falhar, a ação já foi salva sem registro; se a ação falhar depois, sobra log de algo que não aconteceu. Contradição entre doc e código.
**Sugestão:** remover o `commit()` de dentro e chamar `registrar_log` *antes* do commit da rota, para ficar atômico.

### 🟡 2.8 Sem migrações
Schema é criado por `criar_schema_producao.py` e dados de referência copiados por `copiar_avatares.py`. Não há Alembic. Qualquer mudança de coluna precisa ser feita à mão nos dois bancos (teste e produção).
**Sugestão:** se o TCC continuar evoluindo o schema, adotar Alembic; senão, ao menos documentar o procedimento e apagar os scripts depois de usados.

### ✅ 2.9 Convenção de URL e payload — decisão da equipe
URLs e payloads JSON ficam em `snake_case` (ex.: `/atividade/criar_atividade`, `texto_questao`), mesmo com o `CONTRIBUTING.md` pedindo `kebab-case`/`camelCase`. Não é problema a corrigir. O `GET /atividade/` de teste foi removido (2.1).

### 🟢 2.10 Rotas gordas, sem camada de serviço
`atividade.py` (493 linhas) e `aluno.py` (486) misturam validação, regras de negócio, queries e auditoria. `services/` existe, mas só para integrações externas (Gemini, Cloudinary, Pixabay) e auditoria. Não é urgente, mas são os arquivos onde bug mais vai aparecer.

### 🟢 2.11 Config e infra
- `requirements.txt` está em UTF-16 e é um `pip freeze` com ~50 pacotes transitivos; `requests` e `email-validator` não são importados em lugar nenhum.
- `database.py` desliga verificação de certificado SSL (`verify_mode: False`). Está documentado como necessário para o Aiven, mas o Aiven fornece um CA que dá pra usar.
- Dois bancos (`DATABASE_URL_TEST` / `_PROD`) escolhidos por `APP_ENV`; o fallback para `DATABASE_URL` legado pode ser removido.

---

## 3. Arquitetura do frontend

### 🔴 3.1 Tratamento de 401 copiado em ~8 telas, por texto da mensagem
`Atividades`, `Dashboard`, `Turmas`, `Usuarios`, `LogsAuditoria`, `useConfiguracoesProfessor` fazem:

```js
if (err.message?.includes("Token") || err.message?.includes("401") || err.message?.includes("autorização")) {
  localStorage.removeItem("access_token"); navigate("/login");
}
```

Frágil (depende do texto do backend) e repetido. O `apiRequest` já anexa `erro.status`, então dá para tratar 401 **uma vez só** ali.
**Sugestão:** em `apiRequest`, se `response.status === 401`, limpar a sessão e redirecionar; remover os 8 blocos.

### 🟡 3.2 Logout/limpeza de sessão copiado ~10 vezes
As 3 linhas `removeItem("access_token" / "refresh_token" / "user_type")` aparecem em 3 Sidebars, `useHomeAluno`, `useTurmaAluno`, `useTurmasAluno`, `useConfiguracoes*`. O `setItem` dos três aparece em `Login.jsx`, `useLoginEmoji`, `usePrimeiroAcesso`.
**Sugestão:** `services/sessao.js` com `salvarSessao(data)` e `limparSessao()`. ~30 linhas somem e o 3.1 usa a mesma função.

### 🟡 3.3 Três Sidebars e dois Configurações ⚠️
`components/admin/Sidebar.jsx`, `professor/Sidebar.jsx`, `aluno/Sidebar.jsx`, além de `pages/professor/Configuracoes.jsx` (608 linhas) e `pages/aluno/Configuracoes.jsx` (165) com controllers quase paralelos (`useConfiguracoesProfessor`/`Aluno`). Provável estrutura comum (lista de links + logout). Conferir antes de unificar: se só o array de itens muda, um `Sidebar` recebendo `itens` resolve.

### 🟡 3.4 Proteção de rotas incompleta
`RequireRole` protege `/professor/*` e `/admin/*`, mas **`/aluno/*` e `/jogo` estão fora**. O CLAUDE.md ainda diz "no route protection" (desatualizado). O backend é a proteção real, mas a tela abre e falha feio para visitante.
**Sugestão:** envolver as rotas de aluno em `<RequireRole allowedRoles={["estudante"]} />`.

### 🟡 3.5 Arquivos gigantes
`CriarAtividade.jsx` 1200 linhas (+ controller de 324), `TurmaForm.jsx` 672 (+ controller de 305), `Configuracoes.jsx` 608. O controller existe, mas as páginas continuam enormes, o que indica JSX com muitos blocos que poderiam ser componentes (modal de imagem, tabuleiro, formulário). ⚠️ Não li o conteúdo.

### 🟡 3.6 Três fluxos de login de aluno ⚠️
`LoginAluno.jsx` (usuário/senha), `LoginEmoji.jsx` (emoji sem código de turma, commit `8ff8098`) e `PrimeiroAcesso.jsx`. O backend também mantém `/login_aluno`. Se o login por emoji substituiu o antigo, `LoginAluno` + rota `/auth_kivira/login_aluno` podem ser código morto. Conferir com a equipe qual fluxo é o oficial.

### 🟢 3.7 Ícones
19 arquivos `.tsx` (3072 linhas) num projeto sem TypeScript configurado, uma versão animada de ícones que só exibem um SVG. Todos estão em uso. Trocar por SVG simples cortaria ~3000 linhas, mas perde a animação; decisão de design, não de arquitetura.

### 🟢 3.8 Estado de UI espalhado no controller
`useCriarAtividade` mistura formulário, tabuleiro, IA, modal de imagem e Pixabay (~15 `useState`). Quando for mexer na IA, considerar tirar IA e busca de imagem para hooks próprios (`useGeracaoIA`, `useBuscaImagem`) para não crescer mais.

---

## 4. Documentação e repositório

| # | Problema | Sugestão |
|---|----------|----------|
| 4.1 | `CLAUDE.md` está defasado: diz que `services/` está vazio (tem 5 arquivos), que não há proteção de rota (existe `RequireRole`) e lista só 8 entidades (faltam `avatar`, `log_auditoria`, `admin`, `ia`, `pixabay`). | Atualizar; quem usa esse arquivo (você e o Claude) recebe informação errada. |
| 4.2 | Não há nenhum teste. A lógica de IA (contagem, parse, filtros) é justamente a mais fácil de testar isolada. | Um `test_gemini_service.py` com `extrair_json_da_resposta` e o filtro de duplicatas já cobre o ponto mais frágil. |
| 4.3 | `.claude/` aparece como não rastreado no git. | Decidir: versionar ou adicionar ao `.gitignore`. |

---

## 5. Ordem sugerida de ataque

1. **1.1 + 2.1** — travar IA/upload/pixabay por papel (poucas linhas, fecha risco de custo).
2. **3.1 + 3.2** — 401 e sessão centralizados (remove ~80 linhas, corrige fragilidade).
3. **2.5 + 2.6** — mover `oauth2_schema` e o `sessionmaker` (10 linhas, remove import circular e bug latente).
4. **1.2 + 1.3** — apagar Ollama (−109 linhas, −3 variáveis).
5. **2.2** — `async def` → `def` nas rotas só de banco.
6. **2.3 + 2.4** — helper de dono no `rbac.py` (−~100 linhas de repetição).
7. **1.4 + 1.5** — ajuste da lógica da IA (o que você pretendia mexer): quantidade a gerar decidida pelo front e dedupe no back.
8. Restante (3.3–3.8, 2.7–2.11, 4.x) conforme o tempo do TCC.
