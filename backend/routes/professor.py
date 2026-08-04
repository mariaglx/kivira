# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado ao professor.

from fastapi import APIRouter, Depends, HTTPException
from models.usuario import Usuario
from models.professor import Professor 
from dependecies import pegar_sessao_kivira, verificar_token_kivira
import bcrypt 
from schemas.professor import ProfessorSchema, ProfessorUpdateSchema

professor_router = APIRouter(prefix="/professor", tags=["professor"])


@professor_router.get("/")
async def professor():
    return{"mensagem":"Você acessou a rota de professor"}

# Cria a conta de um professor

@professor_router.post("/criar_conta")
async def criar_conta(professor_schema: ProfessorSchema, session = Depends(pegar_sessao_kivira)):

    #Verifica se já existe algum usuário com esse e-mail cadastrado no bd
    usuario = session.query(Usuario).filter(Usuario.email == professor_schema.email).first() 

    if usuario: # Se existir, trás erro em tela

        raise HTTPException(status_code=400, detail="E-mail do usuário já cadastrado")
    
    else: 
        senha_criptografada = bcrypt.hashpw(professor_schema.senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        novo_usuario = Usuario(email=professor_schema.email, senha_hash=senha_criptografada,tipo="professor")
        session.add(novo_usuario)
        session.flush()

        novo_professor = Professor(professor_schema.nome_completo, professor_schema.apelido, professor_schema.escola, professor_schema.biografia)
        novo_professor.avatar_url = professor_schema.avatar_url
        novo_professor.usuario_id = novo_usuario.id
        session.add(novo_professor)
        session.commit()

        return {"mensagem":f"professor cadastrado com sucesso {professor_schema.email}"}

# Retorna os dados do professor. Selecionado pelo ID do professor

@professor_router.get("/{id_professor}")
async def buscar_professor(id_professor: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.id == id_professor).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    usuario_vinculado = session.query(Usuario).filter(Usuario.id == professor.usuario_id).first()

    return {
        "id": professor.id,
        "nome_completo": professor.nome_completo, 
        "apelido": professor.apelido, 
        "escola": professor.escola, 
        "biografia": professor.biografia, 
        "avatar_url": professor.avatar_url,
        "email": usuario_vinculado.email 
    }

# Edição dos dados do professor

@professor_router.patch("/{id_professor}")
async def editar_professor(id_professor: int, professor_schema: ProfessorUpdateSchema, session = Depends(pegar_sessao_kivira), 
usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.id == id_professor).first() 
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    if usuario.tipo != "admin" and usuario.id != professor.usuario_id:
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if professor_schema.nome_completo is not None:
        professor.nome_completo = professor_schema.nome_completo

    if professor_schema.apelido is not None:
        professor.apelido = professor_schema.apelido 

    if professor_schema.escola is not None: 
        professor.escola = professor_schema.escola 

    if professor_schema.avatar_url is not None: 
        professor.avatar_url = professor_schema.avatar_url 

    if professor_schema.biografia is not None: 
        professor.biografia = professor_schema.biografia

    session.commit()

    return {"mensagem": f"Professor '{professor.nome_completo}' atualizado com sucesso"}


# Deleta o cadastro de um professor selecionado pelo ID

@professor_router.delete("/{id_professor}")
async def deletar_professor(id_professor: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.id == id_professor).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    if usuario.tipo != "admin" and usuario.id != professor.usuario_id:
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    nome_professor = professor.nome_completo

    usuario_vinculado = session.query(Usuario).filter(Usuario.id == professor.usuario_id).first()
    session.delete(usuario_vinculado)
    session.commit()

    return{"mensagem": f"Professor '{nome_professor}' excluído com sucesso"}