# Rota/End-point do feedback do aluno: 3 perguntas, sem texto livre.
from fastapi import APIRouter, Depends, HTTPException
from models.feedback_aluno import FeedbackAluno
from models.usuario import Usuario
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import somente_aluno
from schemas.feedback_aluno import FeedbackAlunoSchema
from services.auditoria_service import registrar_log

feedback_aluno_router = APIRouter(prefix="/feedback_aluno", tags=["feedback_aluno"], dependencies=[Depends(verificar_token_kivira)])


@feedback_aluno_router.post("/")
def enviar_feedback_aluno(
    dados: FeedbackAlunoSchema,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(somente_aluno),
):
    # Criança clica repetido muito mais que adulto, então a checagem antes do
    # insert importa ainda mais aqui do que no questionário do professor.
    if session.query(FeedbackAluno.id).filter(FeedbackAluno.usuario_id == usuario.id).first():
        raise HTTPException(status_code=409, detail="Você já respondeu. Obrigado!")

    feedback = FeedbackAluno(
        usuario_id=usuario.id,
        diversao=dados.diversao,
        autonomia=dados.autonomia,
        jogar_de_novo=dados.jogar_de_novo,
    )
    session.add(feedback)
    session.commit()

    registrar_log(session, usuario, acao="ENVIAR_FEEDBACK_ALUNO", entidade="feedback_aluno", entidade_id=feedback.id)

    return {"mensagem": "Feedback enviado com sucesso"}
