# Rotas exclusivas do Administrador: gestão de todos os usuários e visualização
# dos logs de auditoria globais do sistema.

import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from models.usuario import Usuario
from models.professor import Professor
from models.aluno import Aluno
from models.turma import Turma
from models.aluno_turma import AlunoTurma
from models.log_auditoria import LogAuditoria
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import somente_admin
from services.auditoria_service import registrar_log

# dependencies=[Depends(somente_admin)] no prefixo protege TODAS as rotas deste
# router de uma vez só — nenhuma delas precisa repetir a checagem de papel.
admin_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(somente_admin)])


def _pessoas(session, usuario_ids):
    """{usuario_id: {"nome", "identificador", "turmas"}} — o login é o e-mail, ou o
    usuário no caso do aluno (criança não tem e-mail). Usado em Usuários e nos logs."""
    if not usuario_ids:
        return {}
    pessoas = {
        u.id: {"nome": None, "identificador": u.email, "turmas": []}
        for u in session.query(Usuario).filter(Usuario.id.in_(usuario_ids)).all()
    }
    for p in session.query(Professor).filter(Professor.usuario_id.in_(usuario_ids)).all():
        pessoas[p.usuario_id]["nome"] = p.nome_completo

    alunos = session.query(Aluno).filter(Aluno.usuario_id.in_(usuario_ids)).all()
    usuario_do_aluno = {a.id: a.usuario_id for a in alunos}
    for a in alunos:
        pessoas[a.usuario_id]["nome"] = a.nome_completo
        pessoas[a.usuario_id]["identificador"] = a.username
    if alunos:
        for aluno_id, turma_nome in session.query(AlunoTurma.aluno_id, Turma.nome).join(
            Turma, Turma.id == AlunoTurma.turma_id
        ).filter(AlunoTurma.aluno_id.in_(usuario_do_aluno), AlunoTurma.ativo == 1).all():
            pessoas[usuario_do_aluno[aluno_id]]["turmas"].append(turma_nome)
    return pessoas


# Lista todos os usuários cadastrados no sistema (qualquer papel).
# Só o admin acessa — professor e aluno recebem 403 (garantido pelo somente_admin acima).

@admin_router.get("/usuarios")
def listar_usuarios(
    tipo: Optional[str] = Query(default=None, description="Filtra por papel: admin, professor ou estudante"),
    session = Depends(pegar_sessao_kivira),
):
    query = session.query(Usuario)
    if tipo is not None:
        query = query.filter(Usuario.tipo == tipo)

    usuarios = query.order_by(Usuario.id).all()
    pessoas = _pessoas(session, [u.id for u in usuarios])

    return [
        {
            "id": usuario.id,
            "email": usuario.email,
            "nome": pessoas[usuario.id]["nome"],
            "identificador": pessoas[usuario.id]["identificador"],
            "turmas": pessoas[usuario.id]["turmas"],
            "tipo": usuario.tipo,
            "data_criacao": usuario.data_criacao,
            "primeiro_acesso": usuario.primeiro_acesso,
        }
        for usuario in usuarios
    ]


# Professores pro admin escolher o responsável ao criar uma turma.

@admin_router.get("/professores")
def listar_professores(session = Depends(pegar_sessao_kivira)):
    professores = session.query(Professor).order_by(Professor.nome_completo).all()
    return [{"id": p.id, "nome_completo": p.nome_completo, "escola": p.escola} for p in professores]


# Logs de auditoria globais — quem fez o quê, de onde, em qualquer turma/atividade/
# usuário. Cada log já volta com o nome e o login de quem agiu (e as turmas, se for
# aluno), pra tela não mostrar só "#42". Filtros: papel, ações (separadas por
# vírgula), busca por nome/e-mail/usuário/IP e período (datas ISO em UTC).

def _detalhes(log):
    try:
        return json.loads(log.detalhes) if log.detalhes else {}
    except ValueError:
        return {"texto": log.detalhes}  # logs antigos que não eram JSON


def _sem_fuso(data):
    return data.astimezone(timezone.utc).replace(tzinfo=None) if data and data.tzinfo else data


@admin_router.get("/logs-auditoria")
def listar_logs_auditoria(
    usuario_id: Optional[int] = Query(default=None),
    papel: Optional[str] = Query(default=None, description="admin, professor ou estudante"),
    acao: Optional[str] = Query(default=None, description="Uma ou mais, separadas por vírgula. Ex: LOGIN,LOGIN_FALHOU"),
    entidade: Optional[str] = Query(default=None, description="Ex: atividade, professor, turma"),
    busca: Optional[str] = Query(default=None, description="Nome, e-mail, usuário do aluno ou IP"),
    desde: Optional[datetime] = Query(default=None),
    ate: Optional[datetime] = Query(default=None),
    limite: int = Query(default=50, le=200),
    deslocamento: int = Query(default=0, ge=0),
    session = Depends(pegar_sessao_kivira),
):
    query = session.query(LogAuditoria)

    if usuario_id is not None:
        query = query.filter(LogAuditoria.usuario_id == usuario_id)
    if papel:
        query = query.filter(LogAuditoria.papel_usuario == papel)
    if acao:
        query = query.filter(LogAuditoria.acao.in_([a.strip() for a in acao.split(",") if a.strip()]))
    if entidade:
        query = query.filter(LogAuditoria.entidade == entidade)
    if desde:
        query = query.filter(LogAuditoria.data_criacao >= _sem_fuso(desde))
    if ate:
        query = query.filter(LogAuditoria.data_criacao < _sem_fuso(ate))
    termo = (busca or "").strip()
    if termo:
        padrao = f"%{termo}%"
        ids = {u for (u,) in session.query(Usuario.id).filter(Usuario.email.ilike(padrao)).all()}
        ids |= {u for (u,) in session.query(Professor.usuario_id).filter(Professor.nome_completo.ilike(padrao)).all()}
        ids |= {u for (u,) in session.query(Aluno.usuario_id).filter(or_(
            Aluno.nome_completo.ilike(padrao), Aluno.apelido.ilike(padrao), Aluno.username.ilike(padrao),
        )).all()}
        # detalhes pega o que foi digitado num login que falhou e o IP
        query = query.filter(or_(LogAuditoria.usuario_id.in_(ids), LogAuditoria.detalhes.ilike(padrao)))

    total = query.count()
    logs = query.order_by(LogAuditoria.data_criacao.desc(), LogAuditoria.id.desc()).offset(deslocamento).limit(limite).all()
    pessoas = _pessoas(session, {log.usuario_id for log in logs if log.usuario_id})

    return {
        "total": total,
        "itens": [
            {
                "id": log.id,
                "usuario_id": log.usuario_id,
                "usuario": pessoas.get(log.usuario_id),
                "papel_usuario": log.papel_usuario,
                "acao": log.acao,
                "entidade": log.entidade,
                "entidade_id": log.entidade_id,
                "detalhes": _detalhes(log),
                # gravado em UTC: o "Z" faz o navegador converter pro fuso certo
                "data_criacao": f"{log.data_criacao.isoformat()}Z" if log.data_criacao else None,
            }
            for log in logs
        ],
    }


# Resumo das últimas 24h pro topo da tela de auditoria: quantos acessos, quantas
# pessoas e crianças diferentes entraram, quantas tentativas falharam e quais
# logins tiveram 3+ falhas (alguém pode estar tentando adivinhar a senha).
TENTATIVAS_SUSPEITAS = 3


@admin_router.get("/logs-auditoria/resumo")
def resumo_logs_auditoria(session = Depends(pegar_sessao_kivira)):
    desde = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
    logs = session.query(LogAuditoria).filter(
        LogAuditoria.acao.in_(["LOGIN", "LOGIN_FALHOU"]),
        LogAuditoria.data_criacao >= desde,
    ).all()

    logins = [log for log in logs if log.acao == "LOGIN"]
    falhas = [log for log in logs if log.acao == "LOGIN_FALHOU"]
    falhas_por_login = Counter(_detalhes(log).get("identificador") or "?" for log in falhas)

    return {
        "acessos": len(logins),
        "pessoas": len({log.usuario_id for log in logins}),
        "alunos": len({log.usuario_id for log in logins if log.papel_usuario == "estudante"}),
        "falhas": len(falhas),
        "suspeitos": [
            {"identificador": identificador, "tentativas": quantidade}
            for identificador, quantidade in falhas_por_login.most_common()
            if quantidade >= TENTATIVAS_SUSPEITAS
        ],
    }


# Promove um usuário existente (professor ou aluno) a admin. É assim que o sistema
# resolve o "e como criamos o primeiro admin?": o primeiro precisa ser inserido
# direto no banco (não tem quem promova o próprio primeiro admin), mas a partir
# daí um admin já cadastrado pode promover qualquer outro usuário por aqui.

@admin_router.post("/usuarios/{usuario_id}/promover-admin")
def promover_para_admin(
    usuario_id: int,
    session = Depends(pegar_sessao_kivira),
    usuario_logado: Usuario = Depends(verificar_token_kivira),
):
    usuario_alvo = session.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario_alvo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if usuario_alvo.tipo == "admin":
        raise HTTPException(status_code=400, detail="Este usuário já é admin")

    papel_anterior = usuario_alvo.tipo
    usuario_alvo.tipo = "admin"
    session.commit()

    registrar_log(
        session,
        usuario_logado,
        acao="PROMOVER_ADMIN",
        entidade="usuario",
        entidade_id=usuario_alvo.id,
        detalhes={"papel_anterior": papel_anterior, "email": usuario_alvo.email},
    )

    return {"mensagem": f"Usuário '{usuario_alvo.email}' agora é admin"}
