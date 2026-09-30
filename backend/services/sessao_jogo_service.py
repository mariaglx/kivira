# Regras da partida (sessao_jogo): abandono, conferência de rodada, XP e nível.
# Fica em services/ (mesmo padrão de cloudinary_service.py/ollama_service.py) pra
# a rota de sessao_jogo ficar só orquestrando request/response.

import math
from datetime import datetime, timezone
from models.sessao_jogo import SessaoJogo
from models.sessao_jogo_questao import SessaoJogoQuestao


# `iniciado_em`/`finalizado_em` são gravados como o horário UTC "de parede" (é o
# que o server_default=func.now() do MySQL na Aiven produz). Se a duração fosse
# calculada com datetime.now() (hora local da máquina), a subtração ficaria
# negativa fora do fuso UTC — e tempo_gasto_seg é unsigned, não aceita negativo.
def _agora_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Teto do `smallint unsigned` de sessao_jogo.tempo_gasto_seg (18h12m). O banco roda
# com STRICT_ALL_TABLES, então passar disso é ERRO, não truncamento silencioso.
TEMPO_MAXIMO_SEG = 65535


def _duracao_segura(iniciado_em, agora):
    """Segundos entre o início e agora, limitados ao que a coluna aceita.

    O teto importa no abandono: a criança abre a atividade na sexta, fecha o
    navegador e só volta na segunda — aí a sessão velha é fechada com a duração
    real (dias), que estoura o smallint e derrubaria a rota com 500, impedindo
    ela de começar a partida nova. O piso em 0 protege contra relógio adiantado."""
    decorrido = int((agora - iniciado_em).total_seconds())
    return max(0, min(TEMPO_MAXIMO_SEG, decorrido))


def abandonar_sessoes_anteriores(session, aluno_id, atividade_id):
    """Marca como abandonada qualquer sessão em_andamento do mesmo aluno na mesma
    atividade — chamado ao iniciar uma nova, pra abandono virar dado em vez da
    sessão velha ficar "em andamento" pra sempre, sem ninguém nunca voltar.
    Não faz commit — quem chamou decide o momento."""
    sessoes_antigas = session.query(SessaoJogo).filter(
        SessaoJogo.aluno_id == aluno_id,
        SessaoJogo.atividade_id == atividade_id,
        SessaoJogo.status == "em_andamento",
    ).all()

    agora = _agora_utc()
    for sessao_antiga in sessoes_antigas:
        sessao_antiga.status = "abandonado"
        sessao_antiga.finalizado_em = agora
        sessao_antiga.tempo_gasto_seg = _duracao_segura(sessao_antiga.iniciado_em, agora)


def registrar_rodada(session, sessao, questoes_por_ordem, respostas):
    """
    Aplica o resultado de uma conferência ("Virar o Tabuleiro") na sessão:
    incrementa a rodada, grava/atualiza o detalhe por questão
    (sessao_jogo_questao) e recalcula os contadores "ao vivo" da sessão.
    Devolve (resultado_por_slot, tudo_certo): o mapa {ordem_slot: bool} pro
    frontend colorir o tabuleiro, e se a sessão já pode ser concluída.
    """
    sessao.rodadas_conferencia += 1
    rodada_atual = sessao.rodadas_conferencia

    linhas_existentes = {
        linha.questao_id: linha
        for linha in session.query(SessaoJogoQuestao).filter(SessaoJogoQuestao.sessao_id == sessao.id).all()
    }

    resultado_por_slot = {}
    acertos_da_rodada = 0

    for resposta in respostas:
        questao = questoes_por_ordem.get(resposta.ordem_slot)
        if not questao:
            continue  # ordem que não existe mais na atividade — ignora em vez de derrubar a conferência inteira

        acertou = resposta.ordem_peca is not None and resposta.ordem_peca == resposta.ordem_slot
        resultado_por_slot[resposta.ordem_slot] = acertou
        if acertou:
            acertos_da_rodada += 1

        linha = linhas_existentes.get(questao.id)
        if linha is None:
            linha = SessaoJogoQuestao(sessao_id=sessao.id, questao_id=questao.id)
            linha.acertou_primeira = acertou and rodada_atual == 1
            linha.rodada_acerto = rodada_atual if acertou else None
            session.add(linha)
            linhas_existentes[questao.id] = linha
        elif linha.rodada_acerto is None and acertou:
            # Só grava a rodada do acerto na primeira vez que ele acontece —
            # rodadas seguintes não sobrescrevem quem já tinha acertado.
            linha.rodada_acerto = rodada_atual

    if rodada_atual == 1:
        sessao.acertos_primeira = acertos_da_rodada

    total_questoes = len(questoes_por_ordem)
    corretas_ate_agora = sum(1 for linha in linhas_existentes.values() if linha.rodada_acerto is not None)
    sessao.respostas_corretas = corretas_ate_agora
    sessao.respostas_erradas = total_questoes - corretas_ate_agora

    tudo_certo = total_questoes > 0 and corretas_ate_agora == total_questoes
    return resultado_por_slot, tudo_certo


def _houve_conclusao_anterior(session, aluno_id, atividade_id, sessao_atual_id):
    """Essa atividade já foi concluída antes pelo mesmo aluno (em outra sessão)?
    Se sim, a sessão atual é um replay e rende só 25% do XP."""
    return session.query(SessaoJogo).filter(
        SessaoJogo.aluno_id == aluno_id,
        SessaoJogo.atividade_id == atividade_id,
        SessaoJogo.status == "concluido",
        SessaoJogo.id != sessao_atual_id,
    ).first() is not None


def concluir_sessao(session, sessao, aluno, questoes_por_ordem):
    """
    Fecha a sessão como concluída: soma o XP (pontos cheios quem acertou de
    primeira, metade arredondada pra cima quem só acertou depois de corrigir),
    aplica o desconto de 25% se for replay, credita em aluno.xp_total e
    recalcula aluno.nivel_atual. Não faz commit — quem chamou decide.
    Devolve (xp_ganho, eh_replay) pra rota informar o frontend.
    """
    linhas = session.query(SessaoJogoQuestao).filter(SessaoJogoQuestao.sessao_id == sessao.id).all()
    questoes_por_id = {q.id: q for q in questoes_por_ordem.values()}

    xp_bruto = 0
    for linha in linhas:
        questao = questoes_por_id.get(linha.questao_id)
        if not questao:
            continue
        xp_bruto += questao.pontos if linha.acertou_primeira else math.ceil(questao.pontos / 2)

    eh_replay = _houve_conclusao_anterior(session, sessao.aluno_id, sessao.atividade_id, sessao.id)
    # Divisão inteira de propósito: nunca credita mais do que os 25% prometidos
    xp_ganho = (xp_bruto * 25) // 100 if eh_replay else xp_bruto

    agora = _agora_utc()
    sessao.status = "concluido"
    sessao.finalizado_em = agora
    sessao.tempo_gasto_seg = _duracao_segura(sessao.iniciado_em, agora)
    sessao.pontuacao = xp_ganho
    sessao.respostas_corretas = len(questoes_por_ordem)
    sessao.respostas_erradas = 0

    aluno.xp_total += xp_ganho
    aluno.nivel_atual = (aluno.xp_total // 100) + 1

    return xp_ganho, eh_replay


def segundos_restantes(sessao, tempo_limite_seg):
    """Quanto falta da atividade cronometrada, contado a partir do `iniciado_em`
    gravado no banco — nunca do relógio do cliente, que pode estar errado (ou
    ser adiantado de propósito). `None` quando a atividade não tem limite."""
    if not tempo_limite_seg:
        return None
    decorrido = int((_agora_utc() - sessao.iniciado_em).total_seconds())
    return max(0, tempo_limite_seg - decorrido)


def encerrar_por_tempo(session, sessao):
    """Fecha a sessão quando o tempo da atividade acabou: mesma marcação de
    abandono (0 XP, nada creditado), porque a criança não chegou a completar o
    tabuleiro. Não faz commit — quem chamou decide."""
    agora = _agora_utc()
    sessao.status = "abandonado"
    sessao.finalizado_em = agora
    sessao.tempo_gasto_seg = _duracao_segura(sessao.iniciado_em, agora)
    sessao.pontuacao = 0


def reiniciar_sessao(session, sessao):
    """
    "Começar do zero": NÃO conta como abandono. Apaga o detalhe por questão
    dessa sessão (o "acertou de primeira" recomeça limpo a partir daqui) e zera
    os contadores da rodada — mas mantém `iniciado_em` (a duração da sentada
    continua real) e soma em `reinicios`. Não faz commit.
    """
    session.query(SessaoJogoQuestao).filter(SessaoJogoQuestao.sessao_id == sessao.id).delete(synchronize_session=False)
    sessao.reinicios += 1
    sessao.rodadas_conferencia = 0
    sessao.acertos_primeira = 0
    sessao.respostas_corretas = 0
    sessao.respostas_erradas = 0
