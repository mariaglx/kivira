# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado ao professor.

from fastapi import APIRouter, Depends, HTTPException
from models.usuario import Usuario
from models.professor import Professor
from models.turma import Turma
from models.atividade import Atividade
from models.aluno_turma import AlunoTurma
from dependecies import pegar_sessao_kivira, verificar_token_kivira
import bcrypt
from schemas.professor import ProfessorSchema, ProfessorUpdateSchema, AlterarSenhaProfessorSchema

professor_router = APIRouter(prefix="/professor", tags=["professor"])


@professor_router.get("/")
async def professor():
    return{"mensagem":"Você acessou a rota de professor"}

# Perfil do professor autenticado. Precisa vir ANTES de "/{id_professor}"
# (mesmo motivo do "/aluno/me": um path literal de um segmento só é
# capturado por "/{id_professor}" se for registrado depois dele)

@professor_router.get("/me")
async def meu_perfil_professor(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    return {
        "id": professor.id,
        "nome_completo": professor.nome_completo,
        "apelido": professor.apelido,
        "escola": professor.escola,
        "biografia": professor.biografia,
        "avatar_url": professor.avatar_url,
        "email": usuario.email,
    }

# Altera a senha do próprio professor logado (precisa confirmar a senha atual)

@professor_router.patch("/me/senha")
async def alterar_minha_senha(dados: AlterarSenhaProfessorSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    if not bcrypt.checkpw(dados.senha_atual.encode("utf-8"), usuario.senha_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")

    if len(dados.senha_nova) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter pelo menos 6 caracteres")

    usuario.senha_hash = bcrypt.hashpw(dados.senha_nova.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    session.commit()

    return {"mensagem": "Senha atualizada com sucesso"}

# Resumo usado no Dashboard: métricas gerais + últimas turmas do professor logado

@professor_router.get("/dashboard/resumo")
async def resumo_dashboard_professor(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    turmas = session.query(Turma).filter(Turma.professor_id == professor.id).all()
    turma_ids = [turma.id for turma in turmas]

    total_atividades = session.query(Atividade).filter(Atividade.professor_id == professor.id).count()
    total_alunos = 0
    if turma_ids:
        total_alunos = session.query(AlunoTurma).filter(
            AlunoTurma.turma_id.in_(turma_ids),
            AlunoTurma.ativo == 1,
        ).count()

    turmas_recentes = []
    for turma in sorted(turmas, key=lambda t: t.id, reverse=True)[:5]:
        turmas_recentes.append({
            "id": turma.id,
            "nome": turma.nome,
            "ano_escolar": turma.ano_escolar,
            "alunos_count": session.query(AlunoTurma).filter(
                AlunoTurma.turma_id == turma.id, AlunoTurma.ativo == 1
            ).count(),
            "atividades_count": session.query(Atividade).filter(
                Atividade.turma_id == turma.id
            ).count(),
            "status": "Ativa" if turma.ativo else "Pausada",
        })

    return {
        "professor": {
            "nome": professor.apelido or professor.nome_completo,
            "avatar_url": professor.avatar_url,
        },
        "metricas": {
            "total_turmas": len(turmas),
            "total_atividades": total_atividades,
            "total_alunos": total_alunos,
        },
        "turmas_recentes": turmas_recentes,
    }

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