from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from models.usuario import Usuario
from models.aluno import Aluno
from dependecies import pegar_sessao_kivira, verificar_token_kivira, verificar_token_2fa
import bcrypt
from sqlalchemy.orm import Session
from schemas.auth import LoginSchema, LoginAlunoSchema, CodigoDoisFatoresSchema
from models.dois_fatores import DoisFatores
from services.dois_fatores_service import novo_segredo, conferir_codigo
from datetime import datetime, timedelta, timezone
from jose import jwt
from core.config import SECRET_KEY, ALGORITHM, PROFESSOR_TOKEN_EXPIRE_MINUTES, ALUNO_TOKEN_EXPIRE_MINUTES
from services.auditoria_service import registrar_log

kivira_auth_router = APIRouter(prefix="/auth_kivira", tags=["auth"])


# Processo de criação de token para o usuário se manter logado. A duração
# depende do perfil: o token é a sessão inteira (não há refresh token).
# `minutos` e `extras` servem pro "ver como aluno" do admin (token curto e marcado).
def criar_token(usuario, minutos=None, extras=None):
    if minutos is None:
        minutos = ALUNO_TOKEN_EXPIRE_MINUTES if usuario.tipo == "estudante" else PROFESSOR_TOKEN_EXPIRE_MINUTES
    id_usuario = usuario.id
    data_expiracao = datetime.now(timezone.utc) + timedelta(minutes=minutos)
    dict_info = {"sub": str(id_usuario), "exp": data_expiracao, **(extras or {})}
    jwt_codificado = jwt.encode(dict_info, SECRET_KEY, ALGORITHM)

    return jwt_codificado


# Autenticação de usuário


def autenticar_usuario_kivira(email, senha, session):
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        return False
    elif not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")):
        return False
    exigir_conta_ativa(usuario)
    return usuario


# Só avisa que a conta está desativada depois da senha certa: quem está chutando
# senha não descobre o estado da conta.
def exigir_conta_ativa(usuario):
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada. Fale com o professor ou com a administração da escola")


# Tentativa de login que falhou também vira log: é o que mostra alguém tentando
# adivinhar a senha de uma conta. Se o usuário existe, o log fica ligado a ele
# (senha errada); se não, guarda só o que foi digitado. Login por e-mail é a tela
# de professor/admin, então um e-mail desconhecido fica registrado como professor.
def _registrar_falha_login(session, identificador, via, usuario=None, papel="professor"):
    registrar_log(
        session,
        usuario,
        acao="LOGIN_FALHOU",
        entidade="usuario",
        entidade_id=usuario.id if usuario else None,
        detalhes={
            "identificador": identificador,
            "via": via,
            "motivo": "senha_incorreta" if usuario else "usuario_inexistente",
        },
        papel=papel,
    )


# 2FA do admin (TOTP, app autenticador)

MINUTOS_TOKEN_2FA = 5


def _conferir_e_auditar(session, usuario, registro, codigo):
    try:
        conferir_codigo(session, registro, codigo)
    except HTTPException:
        registrar_log(session, usuario, acao="LOGIN_2FA_FALHOU", entidade="usuario", entidade_id=usuario.id)
        raise


# Primeiro login do admin: gera o segredo e o QR pra escanear no app.
# Depois de ativado não troca mais por aqui (senão a senha sozinha trocaria o 2FA).
@kivira_auth_router.post("/2fa/configurar")
def configurar_dois_fatores(session: Session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_2fa)):
    registro = session.get(DoisFatores, usuario.id)
    if registro and registro.ativo:
        raise HTTPException(status_code=400, detail="O 2FA já está configurado")
    return novo_segredo(session, usuario)


@kivira_auth_router.post("/2fa/verificar")
def verificar_dois_fatores(dados: CodigoDoisFatoresSchema, session: Session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_2fa)):
    registro = session.get(DoisFatores, usuario.id)
    ativando = bool(registro and not registro.ativo)
    _conferir_e_auditar(session, usuario, registro, dados.codigo)
    if ativando:
        registrar_log(session, usuario, acao="ATIVAR_2FA", entidade="usuario", entidade_id=usuario.id)

    registrar_log(session, usuario, acao="LOGIN", entidade="usuario", entidade_id=usuario.id, detalhes={"identificador": usuario.email, "via": "login"})
    return {
        "access_token": criar_token(usuario, extras={"mfa": True}),
        "token_type": "Bearer",
        "tipo_usuario": usuario.tipo,
    }


# Login


@kivira_auth_router.post("/login")
def login(
    login_schema: LoginSchema, session: Session = Depends(pegar_sessao_kivira)
):

    usuario = autenticar_usuario_kivira(login_schema.email, login_schema.senha, session)

    if not usuario:
        _registrar_falha_login(session, login_schema.email, "login", session.query(Usuario).filter(Usuario.email == login_schema.email).first())
        raise HTTPException(
            status_code=400, detail="Usuário não encontrado ou credenciais inválidas"
        )
    elif usuario.tipo == "admin":
        # Admin: a senha certa só dá um token de 5 min que serve pra configurar/confirmar o 2FA
        registro = session.get(DoisFatores, usuario.id)
        return {
            "requer_2fa": True,
            "configurado": bool(registro and registro.ativo),
            "token_2fa": criar_token(usuario, minutos=MINUTOS_TOKEN_2FA, extras={"escopo": "2fa"}),
        }
    else:
        access_token = criar_token(usuario)

        registrar_log(session, usuario, acao="LOGIN", entidade="usuario", entidade_id=usuario.id, detalhes={"identificador": login_schema.email, "via": "login"})

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "tipo_usuario": usuario.tipo,
        }


# Login via formulário OAuth2 - usado pelo botão "Authorize" do Swagger
@kivira_auth_router.post("/login_form")
def login_form(
    dados_formulario: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(pegar_sessao_kivira),
):

    usuario = autenticar_usuario_kivira(
        dados_formulario.username, dados_formulario.password, session
    )

    if not usuario:
        _registrar_falha_login(session, dados_formulario.username, "login_form", session.query(Usuario).filter(Usuario.email == dados_formulario.username).first())
        raise HTTPException(
            status_code=400, detail="Usuário não encontrado ou credenciais inválidas"
        )
    else:
        extras = None
        # Admin no Swagger: o código do app autenticador vai no campo client_secret
        if usuario.tipo == "admin":
            registro = session.get(DoisFatores, usuario.id)
            if not registro or not registro.ativo:
                raise HTTPException(status_code=403, detail="Configure o 2FA entrando pelo site antes de usar o Swagger")
            _conferir_e_auditar(session, usuario, registro, dados_formulario.client_secret or "")
            extras = {"mfa": True}

        access_token = criar_token(usuario, extras=extras)

        registrar_log(session, usuario, acao="LOGIN", entidade="usuario", entidade_id=usuario.id, detalhes={"identificador": dados_formulario.username, "via": "login_form"})

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
    exigir_conta_ativa(usuario)
    return usuario


# Login do aluno
@kivira_auth_router.post("/login_aluno")
def login_aluno(
    login_schema: LoginAlunoSchema, session: Session = Depends(pegar_sessao_kivira)
):

    usuario = autenticar_aluno_kivira(
        login_schema.username, login_schema.senha, session
    )

    if not usuario:
        aluno = session.query(Aluno).filter(Aluno.username == login_schema.username).first()
        dono = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first() if aluno else None
        _registrar_falha_login(session, login_schema.username, "login_aluno", dono, papel="estudante")
        raise HTTPException(
            status_code=400, detail="Usuário inexistente ou Login/Senha incorretos"
        )
    else:
        access_token = criar_token(usuario)

        registrar_log(session, usuario, acao="LOGIN", entidade="usuario", entidade_id=usuario.id, detalhes={"identificador": login_schema.username, "via": "login_aluno"})

        return {
            "access_token": access_token,
            "token_type": "Bearer",
        }


# Logout: com JWT stateless não há sessão pra invalidar no servidor — o token
# continua válido até expirar mesmo depois disso. Esse endpoint existe só para
# registrar a auditoria de saída; o front chama antes de limpar o localStorage.

@kivira_auth_router.post("/logout")
def logout(session: Session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    registrar_log(session, usuario, acao="LOGOUT", entidade="usuario", entidade_id=usuario.id)
    return {"mensagem": "Logout registrado com sucesso"}
