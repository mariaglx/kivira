# Conquistas do aluno: títulos por nível e feitos por desempenho.
#
# Não existe tabela `conquista` no banco de propósito — tudo aqui é *derivado*
# do que já está gravado (xp_total do aluno e as linhas de sessao_jogo). Guardar
# também geraria o problema clássico de cache: mudar a curva de XP ou o critério
# de um feito deixaria as linhas antigas mentindo. Derivar custa uma consulta e
# nunca sai de sincronia.
#
# Se um dia a conquista precisar de dado que não dá pra reconstruir (a *data* em
# que foi desbloqueada, por exemplo, pra mostrar "conquistado em 12/03"), aí sim
# entra uma tabela `aluno_conquista` só com (aluno_id, codigo, data) — o catálogo
# continua aqui.

from models.sessao_jogo import SessaoJogo
from services.sessao_jogo_service import nivel_por_xp


# Títulos por nível: o aluno carrega o mais alto que alcançou, mas todos os
# anteriores continuam desbloqueados (igual Discord, que mostra o histórico).
# `nivel` é o mínimo pra desbloquear. Espelha a curva de xp_para_nivel:
# nível 2 = 100 XP, 3 = 300, 5 = 1000, 8 = 2800.
CONQUISTAS_NIVEL = [
    {"codigo": "iniciante", "nome": "Iniciante", "emoji": "🌱", "nivel": 1,
     "descricao": "Chegou ao Kivira"},
    {"codigo": "aprendiz", "nome": "Aprendiz", "emoji": "⭐", "nivel": 2,
     "descricao": "Chegou ao nível 2"},
    {"codigo": "explorador", "nome": "Explorador", "emoji": "🧭", "nivel": 3,
     "descricao": "Chegou ao nível 3"},
    {"codigo": "veterano", "nome": "Veterano", "emoji": "🔥", "nivel": 5,
     "descricao": "Chegou ao nível 5"},
    {"codigo": "mestre", "nome": "Mestre", "emoji": "👑", "nivel": 8,
     "descricao": "Chegou ao nível 8"},
]


# Feitos: dependem do que o aluno fez, não de quanto XP juntou. `regra` recebe o
# dict de estatisticas_do_aluno e devolve bool.
#
# Ordem importa: é a ordem em que aparecem na tela, então cada trio vai do mais
# fácil pro mais difícil (estreia → maratonista → incansável).
CONQUISTAS_FEITO = [
    {"codigo": "primeira_partida", "nome": "Estreia", "emoji": "🎲",
     "descricao": "Terminou a primeira atividade",
     "regra": lambda e: e["atividades_concluidas"] >= 1},
    {"codigo": "maratonista", "nome": "Maratonista", "emoji": "🏃",
     "descricao": "Terminou 10 atividades",
     "regra": lambda e: e["atividades_concluidas"] >= 10},
    {"codigo": "incansavel", "nome": "Incansável", "emoji": "🚀",
     "descricao": "Terminou 25 atividades",
     "regra": lambda e: e["atividades_concluidas"] >= 25},
    {"codigo": "sem_errar", "nome": "Tiro certo", "emoji": "🎯",
     "descricao": "Terminou uma atividade sem errar nenhuma",
     "regra": lambda e: e["atividades_perfeitas"] >= 1},
    {"codigo": "cinco_perfeitas", "nome": "Impecável", "emoji": "💎",
     "descricao": "Terminou 5 atividades sem errar nenhuma",
     "regra": lambda e: e["atividades_perfeitas"] >= 5},
    {"codigo": "cem_acertos", "nome": "Cem acertos", "emoji": "💯",
     "descricao": "Acertou 100 perguntas de primeira",
     "regra": lambda e: e["acertos_primeira"] >= 100},
    {"codigo": "presenca", "nome": "Presença", "emoji": "📅",
     "descricao": "Jogou em 5 dias diferentes",
     "regra": lambda e: e["dias_jogados"] >= 5},
    {"codigo": "rotina", "nome": "Rotina", "emoji": "🗓️",
     "descricao": "Jogou em 15 dias diferentes",
     "regra": lambda e: e["dias_jogados"] >= 15},
    {"codigo": "hora_cheia", "nome": "Hora cheia", "emoji": "⏰",
     "descricao": "Somou 1 hora de jogo",
     "regra": lambda e: e["tempo_total_seg"] >= 3600},
]


def estatisticas_do_aluno(session, aluno_id):
    """Os números que os feitos olham, numa consulta só.

    Puxa todas as sessões (não só as concluídas) porque `dias_jogados` conta
    presença: a criança que abriu a atividade e desistiu ainda assim usou o
    Kivira naquele dia.

    Os demais números olham só a PRIMEIRA conclusão de cada atividade, mesma
    regra que relatorio_service.situacao_por_aluno_atividade usa nas médias do
    professor: replay é com a resposta decorada, então contaria acerto que não
    mede aprendizado nenhum. Isso também impede jogar a mesma atividade 5 vezes
    e levar o "Impecável"."""
    sessoes = session.query(SessaoJogo).filter(SessaoJogo.aluno_id == aluno_id).all()

    # ordem de id = ordem cronológica; a primeira concluída de cada atividade é
    # a que vale
    primeiras = {}
    for s in sorted(sessoes, key=lambda s: s.id):
        if s.status == "concluido":
            primeiras.setdefault(s.atividade_id, s)
    valem = list(primeiras.values())

    return {
        "atividades_concluidas": len(valem),
        # "sem errar" é acertar tudo de primeira. Não dá pra olhar
        # `respostas_erradas`: o creditar_conclusao zera esse campo em TODA
        # conclusão (a partida só termina com o tabuleiro todo certo), então
        # a conta por ali daria "perfeita" pra qualquer partida terminada.
        "atividades_perfeitas": sum(
            1 for s in valem
            if s.respostas_corretas and s.acertos_primeira == s.respostas_corretas
        ),
        "acertos_primeira": sum(s.acertos_primeira or 0 for s in valem),
        "tempo_total_seg": sum(s.tempo_gasto_seg or 0 for s in valem),
        "dias_jogados": len({s.iniciado_em.date() for s in sessoes if s.iniciado_em}),
    }


def conquistas_do_aluno(session, aluno_id, xp_total):
    """Catálogo inteiro com `desbloqueada` em cada item.

    Devolve as bloqueadas também, de propósito: ver o que falta é o que dá
    vontade de continuar jogando (mesmo motivo dos bichinhos com cadeado em
    ProximosAvatares.jsx). O front decide se mostra em cinza ou esconde."""
    nivel = nivel_por_xp(xp_total)
    estatisticas = estatisticas_do_aluno(session, aluno_id)

    conquistas = [
        {
            "codigo": c["codigo"],
            "nome": c["nome"],
            "emoji": c["emoji"],
            "descricao": c["descricao"],
            "desbloqueada": nivel >= c["nivel"],
        }
        for c in CONQUISTAS_NIVEL
    ] + [
        {
            "codigo": c["codigo"],
            "nome": c["nome"],
            "emoji": c["emoji"],
            "descricao": c["descricao"],
            "desbloqueada": c["regra"](estatisticas),
        }
        for c in CONQUISTAS_FEITO
    ]

    return conquistas, estatisticas
