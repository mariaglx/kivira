from fastapi import FastAPI
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kivira API")

#oauth2_schema = OAuth2PasswordBearer(tokenUrl="/login")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="/auth_kivira/login_form")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Importação das rotas precisa ser feita depois do FastAPI() ser instanciado

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
# app.include_router(materia_router)
