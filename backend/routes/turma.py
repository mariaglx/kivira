# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a turma.
from fastapi import APIRouter, Depends, HTTPException
from models.turma import Turma
from models.usuario import Usuario
from models.professor import Professor
from models.aluno_turma import AlunoTurma
from models.atividade import Atividade
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import pode_gerenciar
from schemas.turma import TurmaSchema, TurmaUpdateSchema
from sqlalchemy import func
import secrets # Gerar o código de acesso de forma automática | Nativo Python
from services.auditoria_service import registrar_log

turma_router = APIRouter(prefix="/turma", tags=["turma"], dependencies=[Depends(verificar_token_kivira)])

# Router separado e sem autenticação: o aluno ainda não tem token nesse ponto do fluxo
# (ele está na Home informando o código da turma pela primeira vez).
# Precisa ser registrado no main.py ANTES do turma_router, senão "/turma/verificar-codigo/ABC123"
# seria capturado por "/turma/{id_turma}" do router acima e falharia com 422.
turma_publico_router = APIRouter(prefix="/turma", tags=["turma"])

@turma_publico_router.get("/verificar-codigo/{codigo}")
def verificar_codigo_turma(codigo: str, session = Depends(pegar_sessao_kivira)):
    turma = session.query(Turma).filter(
        Turma.codigo_acesso == codigo.strip().lower(),
        Turma.ativo == True,
    ).first()

    if not turma:
        return {"existe": False}

    return {"existe": True, "turma_id": turma.id, "nome": turma.nome}


@turma_router.get("/")
def listar_turmas(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo == "admin":
        turmas = session.query(Turma).all()
    else:
        turmas = session.query(Turma).filter(Turma.professor_id == professor.id).all()

    # Antes: 1 query de contagem por turma (x2, alunos + atividades) dentro do loop —
    # com N turmas isso virava 1 + 2N idas ao banco. Agora são só 3 no total,
    # não importa quantas turmas existam.
    turma_ids = [turma.id for turma in turmas]

    alunos_por_turma = dict(
        session.query(AlunoTurma.turma_id, func.count(AlunoTurma.id))
        .filter(AlunoTurma.turma_id.in_(turma_ids), AlunoTurma.ativo == 1)
        .group_by(AlunoTurma.turma_id)
        .all()
    ) if turma_ids else {}

    atividades_por_turma = dict(
        session.query(Atividade.turma_id, func.count(Atividade.id))
        .filter(Atividade.turma_id.in_(turma_ids))
        .group_by(Atividade.turma_id)
        .all()
    ) if turma_ids else {}

    return[
        {
            "id": turma.id,
            "nome": turma.nome,
            "ano_escolar": turma.ano_escolar,
            "ano_letivo": turma.ano_letivo,
            "descricao": turma.descricao,
            "ativo": turma.ativo,
            "professor_id": turma.professor_id,
            "alunos_count": alunos_por_turma.get(turma.id, 0),
            "atividades_count": atividades_por_turma.get(turma.id, 0),
        }
        for turma in turmas
    ]


@turma_router.post("/criar")
def criar_turma(turma_schema: TurmaSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()

    if usuario.tipo == "admin" and turma_schema.professor_id is not None:
        professor_id = turma_schema.professor_id
    elif professor:
        professor_id = professor.id
    else:
        raise HTTPException(status_code=401, detail="Você não tem autorização para criar turmas")

    # Verifica se já existe uma turma com o mesmo nome criada pelo mesmo professor.
    turma_existente = session.query(Turma).filter(Turma.professor_id == professor_id, Turma.nome == turma_schema.nome).first()
    if turma_existente:
             raise HTTPException(status_code=400, detail="Você já tem uma turma com esse nome")

    while True:
        codigo = secrets.token_hex(4)
        existe = session.query(Turma).filter(Turma.codigo_acesso == codigo).first() # Verifica se o código de acesso gerado, já não foi gerado
        if not existe:                                                              # anteriormente
            break 

    nova_turma = Turma(
        turma_schema.nome, 
        turma_schema.ano_escolar, 
        turma_schema.ano_letivo,
        turma_schema.descricao, 
        turma_schema.ativo)
    nova_turma.codigo_acesso = codigo
    nova_turma.professor_id = professor_id

    session.add(nova_turma)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="CRIAR_TURMA",
        entidade="turma",
        entidade_id=nova_turma.id,
        detalhes={"nome": nova_turma.nome, "professor_id": professor_id},
    )

    return{"id": nova_turma.id, "mensagem": f"turma '{nova_turma.nome}' cadastrada com sucesso, codigo_acesso: {codigo}"}
    
# Retorna os dados da Turma a partir de um di

@turma_router.get("/{id_turma}")
def buscar_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    dados_turma = {
        "id": turma.id,
        "nome": turma.nome,
        "ano_escolar": turma.ano_escolar,
        "ano_letivo": turma.ano_letivo,
        "descricao": turma.descricao,
        "ativo": turma.ativo,
        "professor_id": turma.professor_id
    }

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo == "admin" or (professor and professor.id == turma.professor_id):
        dados_turma["codigo_acesso"] = turma.codigo_acesso

    return dados_turma

# Edita os dados da turma a partir de um id

@turma_router.patch("/{id_turma}")
def editar_turma(id_turma: int, turma_schema: TurmaUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if turma_schema.nome is not None:
        turma.nome = turma_schema.nome
    if turma_schema.ano_escolar is not None:
        turma.ano_escolar = turma_schema.ano_escolar
    if turma_schema.ano_letivo is not None:
        turma.ano_letivo = turma_schema.ano_letivo
    if turma_schema.descricao is not None:
        turma.descricao = turma_schema.descricao
    if turma_schema.ativo is not None:
        turma.ativo = turma_schema.ativo

    session.commit()

    registrar_log(
        session,
        usuario,
        acao="ATUALIZAR_TURMA",
        entidade="turma",
        entidade_id=turma.id,
    )

    return {"mensagem": f"Turma '{turma.nome}' atualizada com sucesso"}

# Faz a exclusão de uma turma a partir de um ID

@turma_router.delete("/{id_turma}")
def deletar_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    nome_turma = turma.nome
    id_turma_excluida = turma.id
    session.delete(turma)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="EXCLUIR_TURMA",
        entidade="turma",
        entidade_id=id_turma_excluida,
        detalhes={"nome": nome_turma},
    )

    return {"mensagem": f"Turma '{nome_turma}' excluída com sucesso"}