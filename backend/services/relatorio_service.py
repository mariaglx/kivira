# Regras compartilhadas pelos relatórios do professor (atividade, aluno e turma),
# todos montados a partir de sessao_jogo/sessao_jogo_questao.

from models.sessao_jogo_questao import SessaoJogoQuestao


def situacao_por_aluno_atividade(sessoes):
    """{(aluno_id, atividade_id): {"status", "tentativas", "primeira"}} a partir
    das sessões em ordem de id. `primeira` é a primeira sessão concluída — é ela
    que entra nas médias, porque replay já é com a resposta decorada."""
    por_par = {}
    for s in sessoes:
        por_par.setdefault((s.aluno_id, s.atividade_id), []).append(s)

    situacao = {}
    for par, do_par in por_par.items():
        primeira = next((s for s in do_par if s.status == "concluido"), None)
        if primeira:
            status = "concluido"
        elif any(s.status == "em_andamento" for s in do_par):
            status = "em_andamento"
        else:
            status = "abandonado"
        situacao[par] = {"status": status, "tentativas": len(do_par), "primeira": primeira}
    return situacao


SEM_SESSAO = {"status": "nao_iniciado", "tentativas": 0, "primeira": None}


def primeiras_respostas(session, sessoes):
    """{(aluno_id, questao_id): acertou_primeira} — a primeira vez que cada aluno
    respondeu cada questão, concluída a partida ou não: é ali que aparece a
    dúvida real."""
    if not sessoes:
        return {}
    aluno_por_sessao = {s.id: s.aluno_id for s in sessoes}
    linhas = session.query(SessaoJogoQuestao).filter(
        SessaoJogoQuestao.sessao_id.in_(aluno_por_sessao)
    ).order_by(SessaoJogoQuestao.sessao_id).all()

    respostas = {}
    for linha in linhas:
        respostas.setdefault((aluno_por_sessao[linha.sessao_id], linha.questao_id), linha.acertou_primeira)
    return respostas


def media(valores):
    valores = [v for v in valores if v is not None]
    return round(sum(valores) / len(valores), 1) if valores else None


def porcentagem(acertos):
    """% de True numa lista de bool; None se a lista estiver vazia."""
    return round(100 * sum(acertos) / len(acertos)) if acertos else None


def estatisticas_turmas(session, turma_ids):
    """{turma_id: {...}} com o que as listas do professor mostram de cada turma:
    entregas feitas/possíveis (aluno x atividade publicada), alunos que ainda não
    jogaram nada, até 3 avatares e quantos responderam o feedback. 4 queries no
    total, não importa quantas turmas."""
    from models.aluno import Aluno
    from models.aluno_turma import AlunoTurma
    from models.atividade import Atividade
    from models.feedback_aluno import FeedbackAluno
    from models.sessao_jogo import SessaoJogo
    from sqlalchemy import func

    if not turma_ids:
        return {}
    matriculas = session.query(AlunoTurma.turma_id, Aluno.id, Aluno.avatar_url, Aluno.usuario_id, func.coalesce(Aluno.apelido, Aluno.nome_completo)).join(
        Aluno, Aluno.id == AlunoTurma.aluno_id
    ).filter(AlunoTurma.turma_id.in_(turma_ids), AlunoTurma.ativo == 1).order_by(Aluno.nome_completo).all()
    atividades = session.query(Atividade.id, Atividade.turma_id).filter(
        Atividade.turma_id.in_(turma_ids), Atividade.publicado == True
    ).all()
    turma_da_atividade = dict(atividades)
    sessoes = session.query(SessaoJogo).filter(
        SessaoJogo.atividade_id.in_(turma_da_atividade)
    ).order_by(SessaoJogo.id).all() if atividades else []
    situacao = situacao_por_aluno_atividade(sessoes)
    usuarios = [m[3] for m in matriculas if m[3]]
    responderam = {
        u for (u,) in session.query(FeedbackAluno.usuario_id).filter(FeedbackAluno.usuario_id.in_(usuarios))
    } if usuarios else set()

    stats = {t: {"atividades_publicadas": 0, "entregas": 0, "total_entregas": 0, "alunos_parados": 0,
                 "avatares": [], "feedback_respondido": 0} for t in turma_ids}
    for turma_id in turma_da_atividade.values():
        stats[turma_id]["atividades_publicadas"] += 1
    for turma_id, aluno_id, avatar, usuario_id, nome in matriculas:
        st = stats[turma_id]
        if len(st["avatares"]) < 3:
            st["avatares"].append({"avatar_url": avatar, "nome": nome})
        st["feedback_respondido"] += usuario_id in responderam
        da_turma = [a for a, t in turma_da_atividade.items() if t == turma_id]
        st["total_entregas"] += len(da_turma)
        st["entregas"] += sum(situacao.get((aluno_id, a), SEM_SESSAO)["status"] == "concluido" for a in da_turma)
        # "Parado" = tem atividade pra jogar e não abriu nenhuma
        if da_turma and not any((aluno_id, a) in situacao for a in da_turma):
            st["alunos_parados"] += 1
    return stats
