from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from models.usuario import Usuario
from models.aluno import Aluno
from dependecies import pegar_sessao_kivira
import bcrypt
from sqlalchemy.orm import Session
from schemas.auth import LoginSchema, LoginAlunoSchema
from datetime import datetime, timedelta, timezone
from jose import jwt
from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

kivira_auth_router = APIRouter(prefix="/auth_kivira", tags=["auth"])


# Processo de criação de token para o usuário se manter logado
def criar_token(
    id_usuario, duracao_token=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
):
    data_expiracao = datetime.now(timezone.utc) + duracao_token
    dict_info = {"sub": str(id_usuario), "exp": data_expiracao}
    jwt_codificado = jwt.encode(dict_info, SECRET_KEY, ALGORITHM)

    return jwt_codificado


# Autenticação de usuário


def autenticar_usuario_kivira(email, senha, session):
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        return False
    elif not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")):
        return False
    return usuario


# Login


@kivira_auth_router.post("/login")
async def login(
    login_schema: LoginSchema, session: Session = Depends(pegar_sessao_kivira)
):

    usuario = autenticar_usuario_kivira(login_schema.email, login_schema.senha, session)

    if not usuario:
        raise HTTPException(
            status_code=400, detail="Usuário não encontrado ou credenciais inválidas"
        )
    else:
        access_token = criar_token(usuario.id)
        refresh_token = criar_token(usuario.id, duracao_token=timedelta(days=7))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "tipo_usuario": usuario.tipo
        }


# Login via formulário OAuth2 - usado pelo botão "Authorize" do Swagger
@kivira_auth_router.post("/login_form")
async def login_form(
    dados_formulario: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(pegar_sessao_kivira),
):

    usuario = autenticar_usuario_kivira(
        dados_formulario.username, dados_formulario.password, session
    )

    if not usuario:
        raise HTTPException(
            status_code=400, detail="Usuário não encontrado ou credenciais inválidas"
        )
    else:
        access_token = criar_token(usuario.id)
        return {"access_token": access_token, "token_type": "Bearer"}


# Autenticação do Aluno


def autenticar_aluno_kivira(username, senha, session):
    aluno = session.query(Aluno).filter(Aluno.username == username).first()
    if not aluno:
        return False

    usuario = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()
    if not usuario:
        return False
    elif not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")):
        return False
    return usuario


# Login do aluno
@kivira_auth_router.post("/login_aluno")
async def login_aluno(
    login_schema: LoginAlunoSchema, session: Session = Depends(pegar_sessao_kivira)
):

    usuario = autenticar_aluno_kivira(
        login_schema.username, login_schema.senha, session
    )

    if not usuario:
        raise HTTPException(
            status_code=400, detail="Usuário inexistente ou Login/Senha incorretos"
        )
    else:
        access_token = criar_token(usuario.id)
        refresh_token = criar_token(usuario.id, duracao_token=timedelta(days=7))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
        }
