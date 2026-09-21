# Rotas de sessao_jogo: registram a partida do aluno no tabuleiro estilo LUK —
# inicia, confere cada "Virar o Tabuleiro" (o acerto é sempre calculado aqui,
# nunca confiado ao cliente) e conclui creditando XP. A pré-visualização do
# professor não passa por aqui: a rota inteira é restrita a papel estudante.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from models.sessao_jogo import SessaoJogo
from models.atividade import Atividade
from models.aluno import Aluno
from models.aluno_turma import AlunoTurma
from models.questao import Questao
from models.turma import Turma
from models.usuario import Usuario
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import somente_aluno
from schemas.sessao_jogo import IniciarSessaoSchema, ConferirSessaoSchema
from services.sessao_jogo_service import (
    abandonar_sessoes_anteriores,
    registrar_rodada,
    concluir_sessao,
    reiniciar_sessao,
    segundos_restantes,
    encerrar_por_tempo,
)
from services.auditoria_service import registrar_log

sessao_jogo_router = APIRouter(
    prefix="/sessao_jogo",
    tags=["sessao_jogo"],
    dependencies=[Depends(somente_aluno)],
)


def _buscar_aluno_do_token(session, usuario):
    aluno = session.query(Aluno).filter(Aluno.usuario_id == usuario.id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return aluno


def _buscar_sessao_do_aluno(session, id_sessao, aluno):
    sessao = session.query(SessaoJogo).filter(SessaoJogo.id == id_sessao).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if sessao.aluno_id != aluno.id:
        raise HTTPException(status_code=401, detail="Essa sessão não pertence a você")
    return sessao


def _questoes_por_ordem(session, atividade_id):
    questoes = session.query(Questao).filter(Questao.atividade_id == atividade_id).all()
    return {q.ordem: q for q in questoes}


# Abre uma partida nova. Se o aluno já tinha uma sessão em_andamento na mesma
# atividade (saiu sem terminar), ela é marcada abandonada agora — é assim que
# abandono vira dado, sem precisar de job noturno nenhum.
@sessao_jogo_router.post("/iniciar")
async def iniciar_sessao(
    payload: IniciarSessaoSchema,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(verificar_token_kivira),
):
    aluno = _buscar_aluno_do_token(session, usuario)

    atividade = session.query(Atividade).filter(Atividade.id == payload.atividade_id).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    # Mesma checagem de autorização já usada em GET /atividade/{id}/questoes pro
    # aluno: precisa de matrícula ativa na turma da atividade, e ela publicada
    # (rascunho não vaza nem pra quem é da turma).
    matricula = None
    if atividade.turma_id:
        matricula = session.query(AlunoTurma).filter(
            AlunoTurma.aluno_id == aluno.id,
            AlunoTurma.turma_id == atividade.turma_id,
            AlunoTurma.ativo == 1,
        ).first()
    if not (matricula and atividade.publicado):
        raise HTTPException(status_code=401, detail="Você não tem autorização para jogar essa atividade")

    total_questoes = session.query(Questao).filter(Questao.atividade_id == atividade.id).count()
    if total_questoes == 0:
        raise HTTPException(status_code=400, detail="Essa atividade ainda não tem questões")

    abandonar_sessoes_anteriores(session, aluno.id, atividade.id)

    nova_sessao = SessaoJogo(
        atividade_id=atividade.id,
        aluno_id=aluno.id,
        turma_id=atividade.turma_id,  # snapshot: congelado mesmo se a atividade mudar de turma depois
    )
    session.add(nova_sessao)
    session.commit()

    return {
        "sessao_id": nova_sessao.id,
        "status": nova_sessao.status,
        "total_questoes": total_questoes,
        # O relógio é do servidor: o cliente recebe quanto falta e só conta pra
        # baixo na tela. `None` = atividade sem limite (o cronômetro conta pra cima).
        "tempo_limite_seg": atividade.tempo_limite_seg,
        "segundos_restantes": segundos_restantes(nova_sessao, atividade.tempo_limite_seg),
    }


# Chamada a cada "Virar o Tabuleiro". O cliente manda o que encaixou em cada
# slot; o servidor confere, grava o detalhe por questão e, se tudo estiver
# certo, conclui a sessão e credita o XP na mesma transação.
@sessao_jogo_router.post("/{id_sessao}/conferir")
async def conferir_sessao(
    id_sessao: int,
    payload: ConferirSessaoSchema,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(verificar_token_kivira),
):
    aluno = _buscar_aluno_do_token(session, usuario)
    sessao = _buscar_sessao_do_aluno(session, id_sessao, aluno)

    if sessao.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Essa sessão já foi encerrada")

    questoes_por_ordem = _questoes_por_ordem(session, sessao.atividade_id)
    if not questoes_por_ordem:
        raise HTTPException(status_code=404, detail="A atividade dessa sessão não tem questões")

    resultado_por_slot, tudo_certo = registrar_rodada(session, sessao, questoes_por_ordem, payload.respostas)

    xp_ganho = None
    eh_replay = None
    if tudo_certo:
        xp_ganho, eh_replay = concluir_sessao(session, sessao, aluno, questoes_por_ordem)

    session.commit()

    if tudo_certo:
        registrar_log(
            session,
            usuario,
            acao="CONCLUIR_SESSAO_JOGO",
            entidade="sessao_jogo",
            entidade_id=sessao.id,
            detalhes={"xp_ganho": xp_ganho, "replay": eh_replay, "rodadas": sessao.rodadas_conferencia},
        )

    return {
        "resultado_por_slot": resultado_por_slot,
        "rodadas_conferencia": sessao.rodadas_conferencia,
        "concluida": tudo_certo,
        "xp_ganho": xp_ganho,
        "xp_total_aluno": aluno.xp_total if tudo_certo else None,
        "nivel_atual_aluno": aluno.nivel_atual if tudo_certo else None,
    }


# Chamada pelo cliente quando o cronômetro dele zera. O servidor NÃO confia
# nesse aviso: recalcula o tempo pelo `iniciado_em` do banco e só encerra se
# tiver acabado de verdade — senão um relógio adiantado (ou adulterado)
# encerraria a partida de outra criança antes da hora.
@sessao_jogo_router.post("/{id_sessao}/tempo_esgotado")
async def encerrar_sessao_por_tempo(
    id_sessao: int,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(verificar_token_kivira),
):
    aluno = _buscar_aluno_do_token(session, usuario)
    sessao = _buscar_sessao_do_aluno(session, id_sessao, aluno)

    if sessao.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Essa sessão já foi encerrada")

    atividade = session.query(Atividade).filter(Atividade.id == sessao.atividade_id).first()
    if not atividade or not atividade.tempo_limite_seg:
        raise HTTPException(status_code=400, detail="Essa atividade não tem tempo limite")

    if segundos_restantes(sessao, atividade.tempo_limite_seg) > 0:
        raise HTTPException(status_code=400, detail="Ainda há tempo nessa partida")

    encerrar_por_tempo(session, sessao)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="ENCERRAR_SESSAO_POR_TEMPO",
        entidade="sessao_jogo",
        entidade_id=sessao.id,
        detalhes={"acertos": sessao.respostas_corretas, "tempo_limite_seg": atividade.tempo_limite_seg},
    )

    return {
        "status": sessao.status,
        "acertos": sessao.respostas_corretas,
        "total_questoes": session.query(Questao).filter(Questao.atividade_id == sessao.atividade_id).count(),
    }


# "Começar do zero": NÃO conta como abandono, é a mesma sessão continuando.
@sessao_jogo_router.post("/{id_sessao}/reiniciar")
async def reiniciar_sessao_jogo(
    id_sessao: int,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(verificar_token_kivira),
):
    aluno = _buscar_aluno_do_token(session, usuario)
    sessao = _buscar_sessao_do_aluno(session, id_sessao, aluno)

    if sessao.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Essa sessão já foi encerrada")

    reiniciar_sessao(session, sessao)
    session.commit()

    return {"mensagem": "Sessão reiniciada", "reinicios": sessao.reinicios}


# Histórico do aluno: uma entrada por atividade já concluída (agrupando as
# partidas), não uma por sessão — quem quiser o detalhe de cada tentativa
# encontra em "tentativas". Sessões abandonadas ou em andamento não aparecem
# aqui, só o que o aluno realmente terminou.
@sessao_jogo_router.get("/minhas")
async def meu_historico(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    aluno = _buscar_aluno_do_token(session, usuario)

    sessoes = session.query(SessaoJogo).filter(
        SessaoJogo.aluno_id == aluno.id,
        SessaoJogo.status == "concluido",
    ).order_by(SessaoJogo.finalizado_em.desc()).all()

    if not sessoes:
        return []

    atividade_ids = {s.atividade_id for s in sessoes}
    atividades_por_id = {
        a.id: a
        for a in session.query(Atividade).filter(Atividade.id.in_(atividade_ids)).all()
    }

    # Quantas questões cada atividade tem HOJE — usado como denominador do
    # "X/Y" em vez do que a sessão gravou, pra não divergir se a atividade
    # ganhou/perdeu questões depois de jogada.
    total_questoes_por_atividade = dict(
        session.query(Questao.atividade_id, func.count(Questao.id))
        .filter(Questao.atividade_id.in_(atividade_ids))
        .group_by(Questao.atividade_id)
        .all()
    )

    turma_ids = {s.turma_id for s in sessoes if s.turma_id}
    turma_nome_por_id = dict(
        session.query(Turma.id, Turma.nome).filter(Turma.id.in_(turma_ids)).all()
    ) if turma_ids else {}

    por_atividade = {}
    for s in sessoes:
        por_atividade.setdefault(s.atividade_id, []).append(s)

    resultado = []
    for id_atividade, tentativas in por_atividade.items():
        atividade = atividades_por_id.get(id_atividade)
        if not atividade:
            continue  # defensivo: FK é CASCADE, então isso não deveria acontecer na prática

        mais_recente = tentativas[0]  # já vem ordenado desc pela query principal

        resultado.append({
            "atividade_id": id_atividade,
            "atividade_titulo": atividade.titulo,
            "disciplina": atividade.disciplina,
            "imagem_atividade_url": atividade.imagem_atividade_url,
            "turma_id": mais_recente.turma_id,
            "turma_nome": turma_nome_por_id.get(mais_recente.turma_id),
            "total_questoes": total_questoes_por_atividade.get(id_atividade, mais_recente.respostas_corretas),
            "vezes_jogada": len(tentativas),
            "melhor_acertos_primeira": max(t.acertos_primeira for t in tentativas),
            "xp_total_ganho": sum(t.pontuacao for t in tentativas),
            "ultima_vez": mais_recente.finalizado_em,
            "tentativas": [
                {
                    "sessao_id": t.id,
                    "data": t.finalizado_em,
                    "acertos_primeira": t.acertos_primeira,
                    "xp_ganho": t.pontuacao,
                    "tempo_gasto_seg": t.tempo_gasto_seg,
                    "rodadas_conferencia": t.rodadas_conferencia,
                    "reinicios": t.reinicios,
                }
                for t in tentativas
            ],
        })

    resultado.sort(key=lambda r: r["ultima_vez"], reverse=True)
    return resultado
