# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado ao aluno.

from fastapi import APIRouter, Depends, HTTPException
from models.usuario import Usuario
from models.aluno import Aluno
from dependecies import pegar_sessao_kivira, verificar_token_kivira
import bcrypt, unicodedata
from schemas.aluno import AlunoSchema, AlunoUpdateSchema, CadastrarAlunoSchema, PrimeiroAcessoSchema, ResetarSenhaSchema

aluno_router = APIRouter(prefix="/aluno", tags=["aluno"])

@aluno_router.get("/")
async def aluno():
    return{"mensagem": "Você acessou a rota de aluno"}

# Remoção de acentuação para criação do Username

def gerar_username(nome_completo):
    partes = nome_completo.strip().split()
    primeiro_nome = partes[0]
    ultimo_nome = partes[-1]

    base = f"{primeiro_nome}.{ultimo_nome}".lower() # Cria o Username nome.sobrenome
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")

    return base

# Verifica se já existe um usuário cadastrado com esse nome. Ex: nome.sobrenome 
# Se já existir, ele vai criar o nome.sobrenome1,nome.sobrenome2 etc.. 
def gerar_username_unico(nome_completo, session):
    base = gerar_username(nome_completo)
    username = base
    contador = 1

    while session.query(Aluno).filter(Aluno.username == username).first():
        contador += 1
        username = f"{base}{contador}"

    return username


# Cria um aluno

# Possivelmente vamos abandonar esse método por que criamos o de usuário
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


# Cadastra um aluno a partir do nome.sobrenome - Criado pelo professor
# Quem cadastrae é o professor
@aluno_router.post("/cadastrar")
async def cadastrar_aluno(aluno_schema: CadastrarAlunoSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):

    username = gerar_username_unico(aluno_schema.nome_completo, session)

    senha_criptografada = bcrypt.hashpw(aluno_schema.senha_temporaria.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    novo_usuario = Usuario(email=None, senha_hash=senha_criptografada, tipo="estudante")
    session.add(novo_usuario)
    session.flush()

    novo_aluno = Aluno(aluno_schema.nome_completo, None, None)
    novo_aluno.username = username 
    novo_aluno.usuario_id = novo_usuario.id
    session.add(novo_aluno)
    session.commit()

    return{
        "mensagem": f"Aluno '{novo_aluno.nome_completo}' cadastrado com sucesso",
        "username": username
    }


# Primeiro acesso do aluno ao sistema 

@aluno_router.post("/primeiro_acesso")
async def primeiro_acesso(dados: PrimeiroAcessoSchema, session = Depends(pegar_sessao_kivira)):

    aluno = session.query(Aluno).filter(Aluno.username == dados.username).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    usuario = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()

    if not usuario.primeiro_acesso:
        raise HTTPException(status_code=400, detail="Esse aluno já concluiu o primeiro acesso")

    if not bcrypt.checkpw(dados.senha_temporaria.encode("utf-8"), usuario.senha_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Senha temporária incorreta")

    if len(dados.emojis) != 3:
        raise HTTPException(status_code=400, detail="Escolha 3 emojis")

    senha_emoji = "".join(dados.emojis)
    usuario.senha_hash = bcrypt.hashpw(senha_emoji.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    usuario.primeiro_acesso = False
    session.commit()

    return {"mensagem": f"Conta de '{aluno.nome_completo}' ativada com sucesso"}

# Reseta a senha do Aluno caso necessário 

@aluno_router.patch("/{id_aluno}/resetar_senha")
async def resetar_senha_aluno(id_aluno: int, dados: ResetarSenhaSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):

    aluno = session.query(Aluno).filter(Aluno.id == id_aluno).first()
    if not aluno: 
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    if usuario.tipo not in ("professor", "admin"):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação")

    usuario_aluno = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()

    usuario_aluno.senha_hash = bcrypt.hashpw(dados.senha_temporaria.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    usuario_aluno.primeiro_acesso = True 
    session.commit()

    return {
        "mensagem": f"Senha de '{aluno.nome_completo}' redefinida com sucesso"
    }

