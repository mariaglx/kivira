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
