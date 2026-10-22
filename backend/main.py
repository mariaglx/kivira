from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from services.auditoria_service import origem_requisicao

app = FastAPI(title="Kivira API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "https://kivira.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Guarda IP e navegador de cada requisição pra auditoria (ver registrar_log).
# Atrás do proxy da hospedagem o IP real vem no X-Forwarded-For (o 1º da lista).
@app.middleware("http")
async def guardar_origem_da_requisicao(request: Request, call_next):
    encaminhado = request.headers.get("x-forwarded-for")
    ip = encaminhado.split(",")[0].strip() if encaminhado else (request.client.host if request.client else None)
    token = origem_requisicao.set({"ip": ip, "navegador": request.headers.get("user-agent")})
    try:
        return await call_next(request)
    finally:
        origem_requisicao.reset(token)


from routes.professor import professor_router
from routes.aluno import aluno_router
from routes.atividade import atividade_router
from routes.turma import turma_router, turma_publico_router
from routes.auth import kivira_auth_router
from routes.questao import questao_router
from routes.opcao_questao import opcao_questao_router
from routes.aluno_turma import aluno_turma_router
from routes.ia import ia_router
from routes.avatar import avatar_router
from routes.pixabay import pixabay_router
from routes.admin import admin_router
from routes.sessao_jogo import sessao_jogo_router
from routes.feedback import feedback_router
from routes.feedback_aluno import feedback_aluno_router
# from routes.materia import materia_router

app.include_router(professor_router)
app.include_router(aluno_router)
app.include_router(atividade_router)
# turma_publico_router precisa vir ANTES do turma_router: ambos usam o prefixo "/turma" e,
# como "/{id_turma}" casa com qualquer segmento único, se ele for registrado primeiro
# "/turma/verificar-codigo/..." seria capturado por ele e falharia com 422.
app.include_router(turma_publico_router)
app.include_router(turma_router)
app.include_router(kivira_auth_router)
app.include_router(questao_router)
app.include_router(opcao_questao_router)
app.include_router(aluno_turma_router)
app.include_router(ia_router)
app.include_router(avatar_router)
app.include_router(pixabay_router)
app.include_router(admin_router)
app.include_router(sessao_jogo_router)
app.include_router(feedback_router)
app.include_router(feedback_aluno_router)
# app.include_router(materia_router)
