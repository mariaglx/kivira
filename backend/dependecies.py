from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from database import sessao_local
from models.usuario import Usuario
from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from core.config import SECRET_KEY, ALGORITHM

oauth2_schema = OAuth2PasswordBearer(tokenUrl="/auth_kivira/login_form")


# Conexão com o Kivira || Aqui nós vamos criar a conexão com o bd.
# Essa ponte que se abre com o nosso bd, ela fecha em 2 situações.
# 1 - A ação que solicitamos é concluída || 2 - Dá algum erro. (Não fica sessão pendurada).

def pegar_sessao_kivira():
    session = sessao_local()
    try:
        yield session
    finally:
        session.close()


def _decodificar(token):
    try:
        dict_info = jwt.decode(token, SECRET_KEY, ALGORITHM)
        return dict_info, int(dict_info.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")


def verificar_token_kivira(request: Request, token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao_kivira)):
    dict_info, id_usuario = _decodificar(token)

    # Token de meio de login (senha certa, 2FA ainda não) só serve nas rotas do 2FA
    if dict_info.get("escopo"):
        raise HTTPException(status_code=401, detail="Confirme o código do 2FA para entrar")

    # Token do "ver como" (POST /admin/alunos|professores/{id}/ver_como): o admin
    # olha a conta mas não altera nada nela — nem joga, nem edita atividade.
    if dict_info.get("visualizado_por") and request.method not in ("GET", "HEAD", "OPTIONS"):
        raise HTTPException(status_code=403, detail="Modo visualização: o admin não pode alterar nada por esta conta")

    usuario = session.query(Usuario).filter(Usuario.id==id_usuario).first()
    # Conta desativada cai na hora, mesmo com token ainda válido
    if not usuario or not usuario.ativo:
        raise HTTPException(status_code=401, detail="Acesso inválido")

    # Admin só entra com token que passou pelo 2FA. Isso também derruba tokens
    # de admin emitidos antes do 2FA existir.
    if usuario.tipo == "admin" and not dict_info.get("mfa"):
        raise HTTPException(status_code=401, detail="Admin precisa entrar com o 2FA")

    return usuario


# Token de meio de login: o admin acertou a senha e agora configura/confirma o 2FA.
def verificar_token_2fa(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao_kivira)):
    dict_info, id_usuario = _decodificar(token)
    if dict_info.get("escopo") != "2fa":
        raise HTTPException(status_code=401, detail="Token inválido para o 2FA")
    usuario = session.query(Usuario).filter(Usuario.id == id_usuario, Usuario.tipo == "admin").first()
    if not usuario or not usuario.ativo:
        raise HTTPException(status_code=401, detail="Acesso inválido")
    return usuario
