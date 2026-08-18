# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a matrícula de aluno em turma.
from fastapi import APIRouter, Depends, HTTPException
from models.aluno_turma import AlunoTurma
from models.turma import Turma
from models.aluno import Aluno
from models.usuario import Usuario
from models.professor import Professor
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from schemas.aluno_turma import AlunoTurmaSchema, AlunoTurmaUpdateSchema

aluno_turma_router = APIRouter(prefix="/aluno_turma", tags=["aluno_turma"], dependencies=[Depends(verificar_token_kivira)])


@aluno_turma_router.post("/criar")
async def criar_matricula(aluno_turma_schema: AlunoTurmaSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == aluno_turma_schema.turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    aluno = session.query(Aluno).filter(Aluno.id == aluno_turma_schema.aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != turma.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    matricula_existente = session.query(AlunoTurma).filter(
        AlunoTurma.turma_id == aluno_turma_schema.turma_id,
        AlunoTurma.aluno_id == aluno_turma_schema.aluno_id
    ).first()
    if matricula_existente:
        raise HTTPException(status_code=400, detail="Esse aluno já está matriculado nessa turma")

    nova_matricula = AlunoTurma(
        turma_id=aluno_turma_schema.turma_id,
        aluno_id=aluno_turma_schema.aluno_id,
        ativo=aluno_turma_schema.ativo
    )
    session.add(nova_matricula)
    session.commit()

    return {"mensagem": "Aluno matriculado na turma com sucesso"}


@aluno_turma_router.get("/turma/{id_turma}")
async def listar_alunos_da_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != turma.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    matriculas = session.query(AlunoTurma).filter(AlunoTurma.turma_id == id_turma).all()

    resultado = []
    for matricula in matriculas:
        aluno = session.query(Aluno).filter(Aluno.id == matricula.aluno_id).first()
        resultado.append({
            "matricula_id": matricula.id,
            "aluno_id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "apelido": aluno.apelido,
            "avatar_url": aluno.avatar_url,
            "ativo": matricula.ativo,
            "data_inscricao": matricula.data_inscricao
        })

    return resultado


@aluno_turma_router.get("/{id_matricula}")
async def buscar_matricula(id_matricula: int, session = Depends(pegar_sessao_kivira)):
    matricula = session.query(AlunoTurma).filter(AlunoTurma.id == id_matricula).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")

    return {
        "id": matricula.id,
        "turma_id": matricula.turma_id,
        "aluno_id": matricula.aluno_id,
        "data_inscricao": matricula.data_inscricao,
        "ativo": matricula.ativo
    }


@aluno_turma_router.patch("/{id_matricula}")
async def editar_matricula(id_matricula: int, aluno_turma_schema: AlunoTurmaUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    matricula = session.query(AlunoTurma).filter(AlunoTurma.id == id_matricula).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")

    turma = session.query(Turma).filter(Turma.id == matricula.turma_id).first()
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or not turma or professor.id != turma.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if aluno_turma_schema.ativo is not None:
        matricula.ativo = aluno_turma_schema.ativo

    session.commit()

    return {"mensagem": "Matrícula atualizada com sucesso"}


@aluno_turma_router.delete("/{id_matricula}")
async def deletar_matricula(id_matricula: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    matricula = session.query(AlunoTurma).filter(AlunoTurma.id == id_matricula).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")

    turma = session.query(Turma).filter(Turma.id == matricula.turma_id).first()
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or not turma or professor.id != turma.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    session.delete(matricula)
    session.commit()

    return {"mensagem": "Matrícula excluída com sucesso"}
