# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a matrícula de aluno em turma.
from fastapi import APIRouter, Depends, HTTPException
from models.aluno_turma import AlunoTurma
from models.turma import Turma
from models.aluno import Aluno
from models.usuario import Usuario
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import pode_gerenciar, admin_ou_professor
from schemas.aluno_turma import AlunoTurmaSchema, AlunoTurmaUpdateSchema
from services.auditoria_service import registrar_log

aluno_turma_router = APIRouter(prefix="/aluno_turma", tags=["aluno_turma"], dependencies=[Depends(admin_ou_professor)])


@aluno_turma_router.post("/criar")
def criar_matricula(aluno_turma_schema: AlunoTurmaSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == aluno_turma_schema.turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    aluno = session.query(Aluno).filter(Aluno.id == aluno_turma_schema.aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    if not pode_gerenciar(session, usuario, turma):
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

    registrar_log(
        session,
        usuario,
        acao="CRIAR_MATRICULA",
        entidade="aluno_turma",
        entidade_id=nova_matricula.id,
        detalhes={"turma_id": turma.id, "aluno_id": aluno.id},
    )

    return {"mensagem": "Aluno matriculado na turma com sucesso"}


@aluno_turma_router.get("/turma/{id_turma}")
def listar_alunos_da_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    matriculas = session.query(AlunoTurma).filter(AlunoTurma.turma_id == id_turma).all()

    # Antes: 1 query de Aluno por matrícula dentro do loop — 1 + N idas ao banco.
    # Agora é 1 query só, buscando de uma vez todos os alunos matriculados.
    aluno_ids = [m.aluno_id for m in matriculas]
    alunos_por_id = {}
    if aluno_ids:
        alunos_por_id = {
            aluno.id: aluno
            for aluno in session.query(Aluno).filter(Aluno.id.in_(aluno_ids)).all()
        }

    # Conta desativada continua na lista (o professor vê e pode reativar)
    conta_ativa = dict(session.query(Usuario.id, Usuario.ativo).filter(
        Usuario.id.in_([a.usuario_id for a in alunos_por_id.values()])
    ).all()) if alunos_por_id else {}

    resultado = []
    for matricula in matriculas:
        aluno = alunos_por_id.get(matricula.aluno_id)
        resultado.append({
            "matricula_id": matricula.id,
            "aluno_id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "apelido": aluno.apelido,
            "matricula": aluno.matricula,
            "avatar_url": aluno.avatar_url,
            "ativo": matricula.ativo,
            "conta_ativa": conta_ativa.get(aluno.usuario_id, True),
            "data_inscricao": matricula.data_inscricao
        })

    return resultado


@aluno_turma_router.get("/{id_matricula}")
def buscar_matricula(id_matricula: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    matricula = session.query(AlunoTurma).filter(AlunoTurma.id == id_matricula).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")
    if not pode_gerenciar(session, usuario, session.query(Turma).filter(Turma.id == matricula.turma_id).first()):
        raise HTTPException(status_code=403, detail="Você não tem permissão para ver essa matrícula")

    return {
        "id": matricula.id,
        "turma_id": matricula.turma_id,
        "aluno_id": matricula.aluno_id,
        "data_inscricao": matricula.data_inscricao,
        "ativo": matricula.ativo
    }


@aluno_turma_router.patch("/{id_matricula}")
def editar_matricula(id_matricula: int, aluno_turma_schema: AlunoTurmaUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    matricula = session.query(AlunoTurma).filter(AlunoTurma.id == id_matricula).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")

    turma = session.query(Turma).filter(Turma.id == matricula.turma_id).first()
    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if aluno_turma_schema.ativo is not None:
        matricula.ativo = aluno_turma_schema.ativo

    session.commit()

    registrar_log(
        session,
        usuario,
        acao="ATUALIZAR_MATRICULA",
        entidade="aluno_turma",
        entidade_id=matricula.id,
    )

    return {"mensagem": "Matrícula atualizada com sucesso"}


@aluno_turma_router.delete("/{id_matricula}")
def deletar_matricula(id_matricula: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    matricula = session.query(AlunoTurma).filter(AlunoTurma.id == id_matricula).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")

    turma = session.query(Turma).filter(Turma.id == matricula.turma_id).first()
    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    id_matricula_excluida = matricula.id
    turma_id, aluno_id = matricula.turma_id, matricula.aluno_id
    session.delete(matricula)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="EXCLUIR_MATRICULA",
        entidade="aluno_turma",
        entidade_id=id_matricula_excluida,
        detalhes={"turma_id": turma_id, "aluno_id": aluno_id},
    )

    return {"mensagem": "Matrícula excluída com sucesso"}
