from sqlalchemy.orm import sessionmaker, Session
from database import engine
from models.usuario import Usuario
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from main import SECRET_KEY, ALGORITHM, oauth2_schema


# Conexão com o Kivira || Aqui nós vamos criar a conexão com o bd.
# Essa ponte que se abre com o nosso bd, ela fecha em 2 situações.
# 1 - A ação que solicitamos é concluída || 2 - Dá algum erro. (Não fica sessão pendurada).

def pegar_sessao_kivira():
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
    finally:
        session.close()


def verificar_token_kivira(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao_kivira)):
    try:
        dict_info = jwt.decode(token, SECRET_KEY, ALGORITHM)
        id_usuario = int(dict_info.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    usuario = session.query(Usuario).filter(Usuario.id==id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso inválido")

    return usuario
