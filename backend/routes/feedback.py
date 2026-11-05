# Rota/End-point do questionário de feedback do professor: 4 objetivas (1 a 5) + 1 aberta.
# Também o resumo dos dois questionários (professor e aluno) pro dashboard do admin.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from models.feedback import Feedback
from models.feedback_aluno import FeedbackAluno
from models.professor import Professor
from models.aluno import Aluno
from models.turma import Turma
from models.aluno_turma import AlunoTurma
from models.usuario import Usuario
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import exigir_papel, Papel, somente_admin
from schemas.feedback import FeedbackSchema
from services.auditoria_service import registrar_log

feedback_router = APIRouter(prefix="/feedback", tags=["feedback"], dependencies=[Depends(verificar_token_kivira)])

# Tamanho da escala de cada pergunta (as notas vão de 1 até esse valor)
ESCALAS_PROFESSOR = {"facilidade_uso": 5, "autonomia_aluno": 5, "alinhamento_conteudo": 5, "usaria_nas_aulas": 5}
ESCALAS_ALUNO = {"diversao": 5, "autonomia": 3, "jogar_de_novo": 3}


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


def data_utc(data):
    # gravado em UTC: o "Z" faz o navegador converter pro fuso certo
    return f"{data.isoformat()}Z" if data else None


def resumir(respostas, escalas, total):
    """Quantas pessoas deram cada nota, por pergunta: distribuicao[campo][nota - 1]."""
    distribuicao = {campo: [0] * tamanho for campo, tamanho in escalas.items()}
    for resposta in respostas:
        for campo in escalas:
            distribuicao[campo][getattr(resposta, campo) - 1] += 1
    ultimo = max((r.data_criacao for r in respostas if r.data_criacao), default=None)
    return {"total": total, "respostas": len(respostas), "ultimo_envio": data_utc(ultimo), "distribuicao": distribuicao}


# Só o admin vê as respostas. O professor só fica sabendo SE cada aluno
# respondeu, pelo relatório da turma.
# ponytail: carrega todas as respostas na memória — são uma por usuário, então
# só vira problema com dezenas de milhares; aí troca por GROUP BY por campo.
@feedback_router.get("/resumo", dependencies=[Depends(somente_admin)])
def resumo_feedback(session = Depends(pegar_sessao_kivira)):
    respostas_professores = (
        session.query(Feedback, Professor)
        .outerjoin(Professor, Professor.usuario_id == Feedback.usuario_id)
        .order_by(Feedback.data_criacao.desc(), Feedback.id.desc())
        .all()
    )
    professores = resumir([f for f, _ in respostas_professores], ESCALAS_PROFESSOR, session.query(Professor).count())
    professores["comentarios"] = [
        {
            "texto": f.comentario,
            "data": data_utc(f.data_criacao),
            "apelido": p.apelido if p else None,
            "nome_completo": p.nome_completo if p else None,
        }
        for f, p in respostas_professores
    ]

    alunos = resumir(session.query(FeedbackAluno).all(), ESCALAS_ALUNO, session.query(Aluno).count())
    por_turma = (
        session.query(Turma.nome, func.count(AlunoTurma.id), func.count(FeedbackAluno.id))
        .join(AlunoTurma, (AlunoTurma.turma_id == Turma.id) & (AlunoTurma.ativo == 1))
        .join(Aluno, Aluno.id == AlunoTurma.aluno_id)
        .outerjoin(FeedbackAluno, FeedbackAluno.usuario_id == Aluno.usuario_id)
        .group_by(Turma.id, Turma.nome)
        .order_by(Turma.nome)
        .all()
    )
    alunos["por_turma"] = [{"turma": nome, "total": total, "respostas": respostas} for nome, total, respostas in por_turma]

    return {"professores": professores, "alunos": alunos}
