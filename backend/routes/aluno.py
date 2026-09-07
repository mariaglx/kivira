# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado ao aluno.

from fastapi import APIRouter, Depends, HTTPException
from models.usuario import Usuario
from models.aluno import Aluno
from models.turma import Turma
from models.aluno_turma import AlunoTurma
from models.professor import Professor
from dependecies import pegar_sessao_kivira, verificar_token_kivira
import bcrypt, secrets, unicodedata
from schemas.aluno import AlunoSchema, AlunoUpdateSchema, CadastrarAlunoSchema, PrimeiroAcessoSchema

aluno_router = APIRouter(prefix="/aluno", tags=["aluno"])

@aluno_router.get("/")
async def aluno():
    return{"mensagem": "Você acessou a rota de aluno"}

# Perfil do aluno autenticado (usado pelo front pra saber quem é o "eu" sem precisar guardar o id manualmente)
# Precisa vir ANTES de "/{id_aluno}" pra não ser capturado por aquela rota

@aluno_router.get("/me")
async def meu_perfil_aluno(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    aluno = session.query(Aluno).filter(Aluno.usuario_id == usuario.id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    return {
        "id": aluno.id,
        "nome_completo": aluno.nome_completo,
        "apelido": aluno.apelido,
        "avatar_url": aluno.avatar_url,
        "xp_total": aluno.xp_total,
        "nivel_atual": aluno.nivel_atual,
        "username": aluno.username,
    }

# Usado na Home pública: depois que o código da turma foi validado, o front pede o username
# do aluno e essa rota diz se ele precisa passar pelo primeiro acesso ou não.
# Também precisa vir ANTES de "/{id_aluno}"

@aluno_router.get("/status-acesso")
async def status_acesso_aluno(username: str, codigo_turma: str, session = Depends(pegar_sessao_kivira)):
    aluno = session.query(Aluno).filter(Aluno.username == username).first()
    turma = session.query(Turma).filter(Turma.codigo_acesso == codigo_turma.strip().lower()).first()

    matricula = None
    if aluno and turma:
        matricula = session.query(AlunoTurma).filter(
            AlunoTurma.aluno_id == aluno.id,
            AlunoTurma.turma_id == turma.id,
            AlunoTurma.ativo == 1,
        ).first()

    # Mensagem genérica de propósito: evita confirmar pra quem está tentando adivinhar
    # se um username existe sem saber o código certo da turma
    if not aluno or not turma or not matricula:
        raise HTTPException(status_code=404, detail="Usuário não encontrado nessa turma")

    usuario = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()

    return {
        "primeiro_acesso": usuario.primeiro_acesso,
        "avatar_url": aluno.avatar_url,
    }

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

# Senha temporária de primeiro acesso: só dígitos (nada de letra maiúscula/
# minúscula ou símbolo confuso pra criança digitar), gerada pelo sistema —
# o professor nunca escolhe essa senha, só entrega ela pro aluno
def gerar_senha_temporaria():
    return "".join(secrets.choice("0123456789") for _ in range(6))


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
# Quem cadastra é o professor. A senha de primeiro acesso é gerada pelo próprio
# sistema (não é o professor quem escolhe) e só aparece nessa resposta — o
# professor precisa anotar/repassar pro aluno nesse momento, não dá pra recuperar depois.
@aluno_router.post("/cadastrar")
async def cadastrar_aluno(aluno_schema: CadastrarAlunoSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):

    username = gerar_username_unico(aluno_schema.nome_completo, session)
    senha_temporaria = gerar_senha_temporaria()

    senha_criptografada = bcrypt.hashpw(senha_temporaria.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    novo_usuario = Usuario(email=None, senha_hash=senha_criptografada, tipo="estudante")
    session.add(novo_usuario)
    session.flush()

    novo_aluno = Aluno(aluno_schema.nome_completo, None, None)
    novo_aluno.username = username
    novo_aluno.usuario_id = novo_usuario.id
    session.add(novo_aluno)
    session.flush()

    if aluno_schema.turma_id is not None:
        turma = session.query(Turma).filter(Turma.id == aluno_schema.turma_id).first()
        if not turma:
            raise HTTPException(status_code=404, detail="Turma não encontrada")

        professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
        if usuario.tipo != "admin" and (not professor or professor.id != turma.professor_id):
            raise HTTPException(status_code=401, detail="Você não tem autorização para matricular alunos nessa turma")

        session.add(AlunoTurma(turma_id=turma.id, aluno_id=novo_aluno.id))

    session.commit()

    return{
        "id": novo_aluno.id,
        "mensagem": f"Aluno '{novo_aluno.nome_completo}' cadastrado com sucesso",
        "username": username,
        "senha_temporaria": senha_temporaria,
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
async def resetar_senha_aluno(id_aluno: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):

    aluno = session.query(Aluno).filter(Aluno.id == id_aluno).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    if usuario.tipo not in ("professor", "admin"):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação")

    usuario_aluno = session.query(Usuario).filter(Usuario.id == aluno.usuario_id).first()

    # Igual o cadastro: o professor nunca escolhe a senha, o sistema gera sozinho
    senha_temporaria = gerar_senha_temporaria()
    usuario_aluno.senha_hash = bcrypt.hashpw(senha_temporaria.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    usuario_aluno.primeiro_acesso = True
    session.commit()

    return {
        "mensagem": f"Senha de '{aluno.nome_completo}' redefinida com sucesso",
        "username": aluno.username,
        "senha_temporaria": senha_temporaria,
    }

