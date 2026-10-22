# Rota/End-point do questionário de feedback do professor: 4 objetivas (1 a 5) + 1 aberta.
from fastapi import APIRouter, Depends, HTTPException
from models.feedback import Feedback
from models.usuario import Usuario
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import exigir_papel, Papel
from schemas.feedback import FeedbackSchema
from services.auditoria_service import registrar_log

feedback_router = APIRouter(prefix="/feedback", tags=["feedback"], dependencies=[Depends(verificar_token_kivira)])


# Só professor responde: admin no meio da amostra desloca a média dos resultados.
@feedback_router.post("/")
def enviar_feedback(
    dados: FeedbackSchema,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(exigir_papel(Papel.PROFESSOR)),
):
    # O UNIQUE(usuario_id) no banco já barra a duplicata; conferir antes é pra
    # devolver 409 com mensagem clara em vez de estourar erro de integridade.
    # ponytail: dois POSTs realmente simultâneos ainda passariam os dois por aqui
    # e o segundo quebraria no commit — o botão desabilitado no front cobre isso.
    if session.query(Feedback.id).filter(Feedback.usuario_id == usuario.id).first():
        raise HTTPException(status_code=409, detail="Você já enviou seu feedback. Obrigado!")

    feedback = Feedback(
        usuario_id=usuario.id,
        facilidade_uso=dados.facilidade_uso,
        autonomia_aluno=dados.autonomia_aluno,
        alinhamento_conteudo=dados.alinhamento_conteudo,
        usaria_nas_aulas=dados.usaria_nas_aulas,
        comentario=dados.comentario,
    )
    session.add(feedback)
    session.commit()

    registrar_log(session, usuario, acao="ENVIAR_FEEDBACK", entidade="feedback", entidade_id=feedback.id)

    return {"mensagem": "Feedback enviado com sucesso"}
