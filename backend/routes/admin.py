# Rotas exclusivas do Administrador: gestão de todos os usuários e visualização
# dos logs de auditoria globais do sistema.

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from models.usuario import Usuario
from models.log_auditoria import LogAuditoria
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import somente_admin
from schemas.log_auditoria import LogAuditoriaSchema
from services.auditoria_service import registrar_log

# dependencies=[Depends(somente_admin)] no prefixo protege TODAS as rotas deste
# router de uma vez só — nenhuma delas precisa repetir a checagem de papel.
admin_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(somente_admin)])


# Lista todos os usuários cadastrados no sistema (qualquer papel).
# Só o admin acessa — professor e aluno recebem 403 (garantido pelo somente_admin acima).

@admin_router.get("/usuarios")
async def listar_usuarios(
    tipo: Optional[str] = Query(default=None, description="Filtra por papel: admin, professor ou estudante"),
    session = Depends(pegar_sessao_kivira),
):
    query = session.query(Usuario)
    if tipo is not None:
        query = query.filter(Usuario.tipo == tipo)

    usuarios = query.order_by(Usuario.id).all()

    return [
        {
            "id": usuario.id,
            "email": usuario.email,
            "tipo": usuario.tipo,
            "data_criacao": usuario.data_criacao,
            "primeiro_acesso": usuario.primeiro_acesso,
        }
        for usuario in usuarios
    ]


# Logs de auditoria globais — quem fez o quê, em qualquer turma/atividade/usuário do
# sistema. Suporta filtro por usuário, papel, ação e entidade pra facilitar investigação.

@admin_router.get("/logs-auditoria", response_model=list[LogAuditoriaSchema])
async def listar_logs_auditoria(
    usuario_id: Optional[int] = Query(default=None),
    papel: Optional[str] = Query(default=None, description="admin, professor ou estudante"),
    acao: Optional[str] = Query(default=None, description="Ex: CRIAR_ATIVIDADE, EXCLUIR_ATIVIDADE"),
    entidade: Optional[str] = Query(default=None, description="Ex: atividade, professor, turma"),
    limite: int = Query(default=50, le=200),
    session = Depends(pegar_sessao_kivira),
):
    query = session.query(LogAuditoria)

    if usuario_id is not None:
        query = query.filter(LogAuditoria.usuario_id == usuario_id)
    if papel is not None:
        query = query.filter(LogAuditoria.papel_usuario == papel)
    if acao is not None:
        query = query.filter(LogAuditoria.acao == acao)
    if entidade is not None:
        query = query.filter(LogAuditoria.entidade == entidade)

    return (
        query.order_by(LogAuditoria.data_criacao.desc())
        .limit(limite)
        .all()
    )


# Promove um usuário existente (professor ou aluno) a admin. É assim que o sistema
# resolve o "e como criamos o primeiro admin?": o primeiro precisa ser inserido
# direto no banco (não tem quem promova o próprio primeiro admin), mas a partir
# daí um admin já cadastrado pode promover qualquer outro usuário por aqui.

@admin_router.post("/usuarios/{usuario_id}/promover-admin")
async def promover_para_admin(
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
