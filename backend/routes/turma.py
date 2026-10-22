# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a turma.
from fastapi import APIRouter, Depends, HTTPException
from models.turma import Turma
from models.usuario import Usuario
from models.professor import Professor
from models.aluno_turma import AlunoTurma
from models.atividade import Atividade
from models.aluno import Aluno
from models.sessao_jogo import SessaoJogo
from models.questao import Questao
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import pode_gerenciar
from schemas.turma import TurmaSchema, TurmaUpdateSchema
from sqlalchemy import func
import secrets # Gerar o código de acesso de forma automática | Nativo Python
from services.auditoria_service import registrar_log
from services.relatorio_service import situacao_por_aluno_atividade, primeiras_respostas, porcentagem, SEM_SESSAO
from services.sessao_jogo_service import nivel_por_xp

turma_router = APIRouter(prefix="/turma", tags=["turma"], dependencies=[Depends(verificar_token_kivira)])

# Router separado e sem autenticação: o aluno ainda não tem token nesse ponto do fluxo
# (ele está na Home informando o código da turma pela primeira vez).
# Precisa ser registrado no main.py ANTES do turma_router, senão "/turma/verificar-codigo/ABC123"
# seria capturado por "/turma/{id_turma}" do router acima e falharia com 422.
turma_publico_router = APIRouter(prefix="/turma", tags=["turma"])

@turma_publico_router.get("/verificar-codigo/{codigo}")
def verificar_codigo_turma(codigo: str, session = Depends(pegar_sessao_kivira)):
    turma = session.query(Turma).filter(
        Turma.codigo_acesso == codigo.strip().lower(),
        Turma.ativo == True,
    ).first()

    if not turma:
        return {"existe": False}

    return {"existe": True, "turma_id": turma.id, "nome": turma.nome}


@turma_router.get("/")
def listar_turmas(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo == "admin":
        turmas = session.query(Turma).all()
    else:
        turmas = session.query(Turma).filter(Turma.professor_id == professor.id).all()

    # Nome do professor responsável: é o que o admin usa pra saber de quem é cada turma
    nome_professor = dict(
        session.query(Professor.id, Professor.nome_completo)
        .filter(Professor.id.in_({t.professor_id for t in turmas}))
        .all()
    ) if turmas else {}

    # Antes: 1 query de contagem por turma (x2, alunos + atividades) dentro do loop —
    # com N turmas isso virava 1 + 2N idas ao banco. Agora são só 3 no total,
    # não importa quantas turmas existam.
    turma_ids = [turma.id for turma in turmas]

    alunos_por_turma = dict(
        session.query(AlunoTurma.turma_id, func.count(AlunoTurma.id))
        .filter(AlunoTurma.turma_id.in_(turma_ids), AlunoTurma.ativo == 1)
        .group_by(AlunoTurma.turma_id)
        .all()
    ) if turma_ids else {}

    atividades_por_turma = dict(
        session.query(Atividade.turma_id, func.count(Atividade.id))
        .filter(Atividade.turma_id.in_(turma_ids))
        .group_by(Atividade.turma_id)
        .all()
    ) if turma_ids else {}

    return[
        {
            "id": turma.id,
            "nome": turma.nome,
            "ano_escolar": turma.ano_escolar,
            "ano_letivo": turma.ano_letivo,
            "descricao": turma.descricao,
            "ativo": turma.ativo,
            "professor_id": turma.professor_id,
            "professor_nome": nome_professor.get(turma.professor_id),
            "alunos_count": alunos_por_turma.get(turma.id, 0),
            "atividades_count": atividades_por_turma.get(turma.id, 0),
        }
        for turma in turmas
    ]


@turma_router.post("/criar")
def criar_turma(turma_schema: TurmaSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()

    if usuario.tipo == "admin" and turma_schema.professor_id is not None:
        professor_id = turma_schema.professor_id
    elif professor:
        professor_id = professor.id
    else:
        raise HTTPException(status_code=401, detail="Você não tem autorização para criar turmas")

    # Verifica se já existe uma turma com o mesmo nome criada pelo mesmo professor.
    turma_existente = session.query(Turma).filter(Turma.professor_id == professor_id, Turma.nome == turma_schema.nome).first()
    if turma_existente:
             raise HTTPException(status_code=400, detail="Você já tem uma turma com esse nome")

    while True:
        codigo = secrets.token_hex(4)
        existe = session.query(Turma).filter(Turma.codigo_acesso == codigo).first() # Verifica se o código de acesso gerado, já não foi gerado
        if not existe:                                                              # anteriormente
            break 

    nova_turma = Turma(
        turma_schema.nome, 
        turma_schema.ano_escolar, 
        turma_schema.ano_letivo,
        turma_schema.descricao, 
        turma_schema.ativo)
    nova_turma.codigo_acesso = codigo
    nova_turma.professor_id = professor_id

    session.add(nova_turma)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="CRIAR_TURMA",
        entidade="turma",
        entidade_id=nova_turma.id,
        detalhes={"nome": nova_turma.nome, "professor_id": professor_id},
    )

    return{"id": nova_turma.id, "mensagem": f"turma '{nova_turma.nome}' cadastrada com sucesso, codigo_acesso: {codigo}"}
    
# Retorna os dados da Turma a partir de um di

@turma_router.get("/{id_turma}")
def buscar_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    dados_turma = {
        "id": turma.id,
        "nome": turma.nome,
        "ano_escolar": turma.ano_escolar,
        "ano_letivo": turma.ano_letivo,
        "descricao": turma.descricao,
        "ativo": turma.ativo,
        "professor_id": turma.professor_id
    }

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo == "admin" or (professor and professor.id == turma.professor_id):
        dados_turma["codigo_acesso"] = turma.codigo_acesso

    return dados_turma

# Ranking da turma pro professor acompanhar: mesma ordenação que o aluno vê na
# tela dele (XP desc, desempate alfabético), só que com o número de atividades
# concluídas junto — é o dado que mostra quem está pra trás, não só quem pontua.
# Precisa vir ANTES de "/{id_turma}"? Não: "/{id_turma}/ranking" tem dois
# segmentos, então não colide com a rota de um segmento só.

@turma_router.get("/{id_turma}/ranking")
def ranking_da_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    matriculas = session.query(AlunoTurma).filter(
        AlunoTurma.turma_id == id_turma,
        AlunoTurma.ativo == 1,
    ).all()

    aluno_ids = [m.aluno_id for m in matriculas]
    if not aluno_ids:
        return {"turma_id": turma.id, "total_atividades": 0, "ranking": []}

    alunos = session.query(Aluno).filter(Aluno.id.in_(aluno_ids)).all()

    # Só as publicadas entram na conta — são as únicas que o aluno consegue jogar,
    # então é o denominador honesto do "X de Y atividades"
    atividade_ids = [
        id_atividade
        for (id_atividade,) in session.query(Atividade.id).filter(
            Atividade.turma_id == id_turma,
            Atividade.publicado == True,
        ).all()
    ]

    # COUNT(DISTINCT atividade_id) e não count(*): quem joga a mesma atividade de
    # novo gera várias sessões concluídas, mas continua sendo UMA atividade feita
    concluidas_por_aluno = {}
    if atividade_ids:
        concluidas_por_aluno = dict(
            session.query(SessaoJogo.aluno_id, func.count(func.distinct(SessaoJogo.atividade_id)))
            .filter(
                SessaoJogo.aluno_id.in_(aluno_ids),
                SessaoJogo.atividade_id.in_(atividade_ids),
                SessaoJogo.status == "concluido",
            )
            .group_by(SessaoJogo.aluno_id)
            .all()
        )

    ranking = [
        {
            "aluno_id": a.id,
            "nome": a.apelido or a.nome_completo,
            "avatar_url": a.avatar_url,
            "xp_total": a.xp_total or 0,
            "nivel_atual": nivel_por_xp(a.xp_total),
            "atividades_concluidas": concluidas_por_aluno.get(a.id, 0),
        }
        for a in alunos
    ]
    ranking.sort(key=lambda item: (-item["xp_total"], item["nome"].lower()))

    return {
        "turma_id": turma.id,
        "total_atividades": len(atividade_ids),
        "ranking": ranking,
    }

# Edita os dados da turma a partir de um id

@turma_router.patch("/{id_turma}")
def editar_turma(id_turma: int, turma_schema: TurmaUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if turma_schema.nome is not None:
        turma.nome = turma_schema.nome
    if turma_schema.ano_escolar is not None:
        turma.ano_escolar = turma_schema.ano_escolar
    if turma_schema.ano_letivo is not None:
        turma.ano_letivo = turma_schema.ano_letivo
    if turma_schema.descricao is not None:
        turma.descricao = turma_schema.descricao
    if turma_schema.ativo is not None:
        turma.ativo = turma_schema.ativo

    session.commit()

    registrar_log(
        session,
        usuario,
        acao="ATUALIZAR_TURMA",
        entidade="turma",
        entidade_id=turma.id,
    )

    return {"mensagem": f"Turma '{turma.nome}' atualizada com sucesso"}

# Faz a exclusão de uma turma a partir de um ID

@turma_router.delete("/{id_turma}")
def deletar_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    nome_turma = turma.nome
    id_turma_excluida = turma.id
    session.delete(turma)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="EXCLUIR_TURMA",
        entidade="turma",
        entidade_id=id_turma_excluida,
        detalhes={"nome": nome_turma},
    )

    return {"mensagem": f"Turma '{nome_turma}' excluída com sucesso"}

# Relatório da turma como um todo: quanto da turma concluiu cada atividade, a
# taxa de acerto de primeira, os alunos (com o desempenho de cada um) e as
# questões que a turma mais erra — o que puxar na próxima aula presencial.
@turma_router.get("/{id_turma}/relatorio")
def relatorio_da_turma(id_turma: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    turma = session.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=401, detail="Você não tem autorização para ver esse relatório")

    alunos = session.query(Aluno).join(AlunoTurma, AlunoTurma.aluno_id == Aluno.id).filter(
        AlunoTurma.turma_id == turma.id,
        AlunoTurma.ativo == 1,
    ).order_by(Aluno.nome_completo).all()
    aluno_ids = [a.id for a in alunos]

    atividades = session.query(Atividade).filter(
        Atividade.turma_id == turma.id,
        Atividade.publicado == True,
    ).order_by(Atividade.data_criacao.desc()).all()
    atividade_ids = [a.id for a in atividades]

    # Só sessões de quem está na turma hoje e das atividades dela
    sessoes = session.query(SessaoJogo).filter(
        SessaoJogo.atividade_id.in_(atividade_ids),
        SessaoJogo.aluno_id.in_(aluno_ids),
    ).order_by(SessaoJogo.id).all() if atividade_ids and aluno_ids else []
    situacao = situacao_por_aluno_atividade(sessoes)
    respostas = primeiras_respostas(session, sessoes)

    questoes = session.query(Questao).filter(Questao.atividade_id.in_(atividade_ids)).all() if atividade_ids else []
    atividade_da_questao = {q.id: q.atividade_id for q in questoes}
    total_questoes = {}
    for q in questoes:
        total_questoes[q.atividade_id] = total_questoes.get(q.atividade_id, 0) + 1

    respostas_por_aluno, respostas_por_atividade, respostas_por_questao = {}, {}, {}
    for (aluno_id, questao_id), acertou in respostas.items():
        respostas_por_aluno.setdefault(aluno_id, []).append(acertou)
        respostas_por_atividade.setdefault(atividade_da_questao.get(questao_id), []).append(acertou)
        respostas_por_questao.setdefault(questao_id, []).append(acertou)

    def concluiu(aluno_id, atividade_id):
        return situacao.get((aluno_id, atividade_id), SEM_SESSAO)["status"] == "concluido"

    relatorio_atividades = [
        {
            "atividade_id": a.id,
            "titulo": a.titulo,
            "disciplina": a.disciplina,
            "total_questoes": total_questoes.get(a.id, 0),
            "alunos_concluiram": sum(1 for aluno_id in aluno_ids if concluiu(aluno_id, a.id)),
            "taxa_acerto_primeira": porcentagem(respostas_por_atividade.get(a.id, [])),
        }
        for a in atividades
    ]

    relatorio_alunos = [
        {
            "aluno_id": a.id,
            "nome_completo": a.nome_completo,
            "apelido": a.apelido,
            "matricula": a.matricula,
            "avatar_url": a.avatar_url,
            "nivel_atual": nivel_por_xp(a.xp_total),
            "atividades_concluidas": sum(1 for atividade_id in atividade_ids if concluiu(a.id, atividade_id)),
            "taxa_acerto_primeira": porcentagem(respostas_por_aluno.get(a.id, [])),
        }
        for a in alunos
    ]

    titulo_atividade = {a.id: a.titulo for a in atividades}
    questoes_dificeis = sorted(
        (
            {
                "atividade_id": q.atividade_id,
                "atividade_titulo": titulo_atividade[q.atividade_id],
                "ordem": q.ordem,
                "texto_questao": q.texto_questao,
                "respostas": len(respostas_por_questao[q.id]),
                "taxa_acerto_primeira": porcentagem(respostas_por_questao[q.id]),
            }
            for q in questoes
            # Só entra quem alguém errou — questão 100% não é ponto de atenção
            if q.id in respostas_por_questao and not all(respostas_por_questao[q.id])
        ),
        key=lambda r: (r["taxa_acerto_primeira"], -r["respostas"]),
    )[:5]

    pares = len(aluno_ids) * len(atividade_ids)
    return {
        "turma": {
            "id": turma.id,
            "nome": turma.nome,
            "professor_nome": session.query(Professor.nome_completo).filter(Professor.id == turma.professor_id).scalar(),
            "ano_escolar": turma.ano_escolar,
            "ano_letivo": turma.ano_letivo,
            "codigo_acesso": turma.codigo_acesso,
        },
        "resumo": {
            "alunos": len(alunos),
            "atividades": len(atividades),
            "taxa_conclusao": round(100 * sum(a["alunos_concluiram"] for a in relatorio_atividades) / pares) if pares else None,
            "taxa_acerto_primeira": porcentagem(list(respostas.values())),
        },
        "atividades": relatorio_atividades,
        "alunos": relatorio_alunos,
        "questoes_dificeis": questoes_dificeis,
    }
