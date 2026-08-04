# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado ao aluno.

from fastapi import APIRouter, Depends, HTTPException
from models.usuario import Usuario
from models.aluno import Aluno
from dependecies import pegar_sessao_kivira, verificar_token_kivira
import bcrypt 
from schemas.aluno import AlunoSchema, AlunoUpdateSchema

aluno_router = APIRouter(prefix="/aluno", tags=["aluno"])

@aluno_router.get("/")
async def aluno():
    return{"mensagem": "Você acessou a rota de aluno"}

# Cria um aluno

@aluno_router.post("/criar_conta")
async def criar_conta(aluno_schema: AlunoSchema, session = Depends(pegar_sessao_kivira)):

    usuario = session.query(Usuario).filter(Usuario.email == aluno_schema.email).first()

    if usuario:

        raise HTTPException(status_code=400, detail="E-mail do usuário já cadastrado")
    else: 
        senha_criptografada = bcrypt.hashpw(aluno_schema.senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        novo_usuario = Usuario(email=aluno_schema.email, senha_hash=senha_criptografada, tipo="estudante")
        session.add(novo_usuario)
        session.flush()

        novo_aluno = Aluno(aluno_schema.nome_completo, aluno_schema.apelido, aluno_schema.data_nascimento)
        novo_aluno.avatar_url = aluno_schema.avatar_url
        novo_aluno.usuario_id = novo_usuario.id
        session.add(novo_aluno)
        session.commit()

        return {"mensagem": f"aluno cadastrado com sucesso {aluno_schema.email}"}

# Retorna os dados de um aluno já cadastrado a partir do ID

@aluno_router.get("/{id_aluno}")
async def buscar_aluno(id_aluno: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    aluno = session.query(Aluno).filter(Aluno.id == id_aluno).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    usuario_vinculado = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()

    return {
        "id": aluno.id,
        "nome_completo": aluno.nome_completo, 
        "apelido": aluno.apelido, 
        "avatar_url": aluno.avatar_url, 
        "data_nascimento": aluno.data_nascimento, 
        "xp_total": aluno.xp_total, 
        "nivel_atual": aluno.nivel_atual,
        "email": usuario_vinculado.email 
    }


# Edição dos dados do aluno

@aluno_router.patch("/{id_aluno}")
async def editar_aluno(id_aluno: int, aluno_schema: AlunoUpdateSchema, session = Depends(pegar_sessao_kivira), 
usuario: Usuario = Depends(verificar_token_kivira)):
    aluno = session.query(Aluno).filter(Aluno.id == id_aluno).first() 
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado!")

    if usuario.tipo != "admin" and usuario.id != aluno.usuario_id:
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if aluno_schema.nome_completo is not None: 
        aluno.nome_completo = aluno_schema.nome_completo
    
    if aluno_schema.apelido is not None: 
        aluno.apelido = aluno_schema.apelido

    if aluno_schema.avatar_url is not None: 
        aluno.avatar_url = aluno_schema.avatar_url

    if aluno_schema.data_nascimento is not None: 
        aluno.data_nascimento = aluno_schema.data_nascimento    

    session.commit()

    return {"mensagem": f"Aluno '{aluno.nome_completo}' atualizado com sucesso"}

# Faz a exclusão de um aluno a partir do ID

@aluno_router.delete("/{id_aluno}")
async def deletar_aluno(id_aluno: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    aluno = session.query(Aluno).filter(Aluno.id == id_aluno).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    if usuario.tipo != "admin" and usuario.id != aluno.usuario_id:
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    nome_aluno = aluno.nome_completo

    usuario_vinculado = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()
    session.delete(usuario_vinculado)
    session.commit()

    return{"mensagem": f"Aluno '{nome_aluno}' excluído com sucesso"}




