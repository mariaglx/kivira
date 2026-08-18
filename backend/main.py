from fastapi import FastAPI
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv # Carrega as variáveis de ambiente do .env
from fastapi.middleware.cors import CORSMiddleware # 
import os


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACESS_TOKEN_EXPIRE_MINUTES = int (os.getenv("ACESS_TOKEN_EXPIRE_MINUTES"))

app = FastAPI()

oauth2_schema = OAuth2PasswordBearer(tokenUrl="auth_kivira/login-form")

# para rodar o código, executar no terminal: uvicorn main:app --reload
# para rodar o front, executar no terminal: npm run dev

#Importação das rotas precisa ser feita depois do FastAPI() ser instanciado

from routes.professor import professor_router
from routes.aluno import aluno_router
from routes.atividade import atividade_router
from routes.turma import turma_router
from routes.auth import kivira_auth_router
from routes.questao import questao_router
from routes.opcao_questao import opcao_questao_router
from routes.aluno_turma import aluno_turma_router

app.include_router(professor_router)
app.include_router(aluno_router)
app.include_router(atividade_router)
app.include_router(turma_router)
app.include_router(kivira_auth_router)
app.include_router(questao_router)
app.include_router(opcao_questao_router)
app.include_router(aluno_turma_router)

app.add_middleware (
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
