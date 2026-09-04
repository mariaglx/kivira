# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a atividade.

from fastapi import APIRouter, Depends, HTTPException
from models.atividade import Atividade
from models.professor import Professor
from models.usuario import Usuario
from models.aluno import Aluno
from models.aluno_turma import AlunoTurma
from models.turma import Turma
from models.questao import Questao
from models.opcao_questao import OpcaoQuestao
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from schemas.atividade import AtividadeSchema, AtividadeUpdateSchema

atividade_router = APIRouter(prefix="/atividade", tags=["atividade"],dependencies=[Depends(verificar_token_kivira)])

@atividade_router.get("/")
async def atividade():
    return{"mensagem":"Você acessou a rota de atividades"}

# Lista as atividades criadas pelo professor logado. Usado pela tela de Atividades
# do professor pra substituir os dados mockados.

@atividade_router.get("/professor/minhas")
async def listar_atividades_do_professor(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    atividades = session.query(Atividade).filter(Atividade.professor_id == professor.id).all()

    resultado = []
    for a in atividades:
        turma = session.query(Turma).filter(Turma.id == a.turma_id).first() if a.turma_id else None
        resultado.append({
            "id": a.id,
            "titulo": a.titulo,
            "disciplina": a.disciplina,
            "tipo_atividade": a.tipo_atividade,
            "dificuldade": a.dificuldade,
            "quantidade_blocos": a.quantidade_blocos,
            "turma_id": a.turma_id,
            "turma_nome": turma.nome if turma else None,
            "publicado": a.publicado,
        })

    return resultado

# Lista as atividades publicadas das turmas em que o aluno logado está matriculado.
# Usado pela Home do aluno pra substituir os dados mockados.

@atividade_router.get("/aluno/minhas")
async def listar_atividades_do_aluno(session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    if usuario.tipo != "estudante":
        raise HTTPException(status_code=401, detail="Rota exclusiva para alunos")

    aluno = session.query(Aluno).filter(Aluno.usuario_id == usuario.id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    turma_ids = [
        matricula.turma_id
        for matricula in session.query(AlunoTurma).filter(
            AlunoTurma.aluno_id == aluno.id,
            AlunoTurma.ativo == 1,
        ).all()
    ]

    atividades = []
    if turma_ids:
        atividades = session.query(Atividade).filter(
            Atividade.turma_id.in_(turma_ids),
            Atividade.publicado == True,
        ).all()

    return [
        {
            "id": a.id,
            "titulo": a.titulo,
            "descricao": a.descricao,
            "disciplina": a.disciplina,
            "tipo_atividade": a.tipo_atividade,
            "dificuldade": a.dificuldade,
            "imagem_atividade_url": a.imagem_atividade_url,
            "quantidade_blocos": a.quantidade_blocos,
            "turma_id": a.turma_id,
        }
        for a in atividades
    ]

# Criar uma atividade

@atividade_router.post("/criar_atividade")
async def criar_atividade(atividade_schema: AtividadeSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()

    if usuario.tipo == "admin" and atividade_schema.professor_id is not None:
        professor_id = atividade_schema.professor_id
    elif professor:
        professor_id = professor.id
    else:
        raise HTTPException(status_code=401, detail="Você não tem autorização para criar atividades")

    nova_atividade = Atividade(
        atividade_schema.titulo,
        atividade_schema.tipo_atividade,
        atividade_schema.descricao,
        atividade_schema.disciplina,
        atividade_schema.dificuldade
    )
    nova_atividade.professor_id = professor_id
    nova_atividade.turma_id = atividade_schema.turma_id
    nova_atividade.imagem_atividade_url = atividade_schema.imagem_atividade_url
    nova_atividade.quantidade_blocos = atividade_schema.quantidade_blocos
    nova_atividade.tempo_limite_seg = atividade_schema.tempo_limite_seg

    session.add(nova_atividade)
    session.commit()

    return{"id": nova_atividade.id, "mensagem": f"atividade '{nova_atividade.titulo}' cadastrada com sucesso"}

# Retorna os dados de uma atividade a partir do ID dela

@atividade_router.get("/{id_atividade}")
async def buscar_atividade(id_atividade: int, session = Depends(pegar_sessao_kivira)):
    atividade = session.query(Atividade).filter(Atividade.id == id_atividade).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    return {
        "id": atividade.id,
        "titulo": atividade.titulo,
        "descricao": atividade.descricao,
        "disciplina": atividade.disciplina,
        "tipo_atividade": atividade.tipo_atividade,
        "dificuldade": atividade.dificuldade,
        "imagem_atividade_url": atividade.imagem_atividade_url,
        "quantidade_blocos": atividade.quantidade_blocos,
        "tempo_limite_seg": atividade.tempo_limite_seg,
        "professor_id": atividade.professor_id,
        "turma_id": atividade.turma_id,
        "publicado": atividade.publicado
    }

# Lista as questões (com as opções) de uma atividade específica — usado pelo
# modal "Ver questões" na tela de Atividades do professor

@atividade_router.get("/{id_atividade}/questoes")
async def listar_questoes_da_atividade(id_atividade: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    atividade = session.query(Atividade).filter(Atividade.id == id_atividade).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para ver essas questões")

    questoes = session.query(Questao).filter(Questao.atividade_id == id_atividade).order_by(Questao.ordem).all()

    opcoes_por_questao = {}
    questao_ids = [q.id for q in questoes]
    if questao_ids:
        todas_opcoes = session.query(OpcaoQuestao).filter(
            OpcaoQuestao.questao_id.in_(questao_ids)
        ).order_by(OpcaoQuestao.ordem).all()
        for opcao in todas_opcoes:
            opcoes_por_questao.setdefault(opcao.questao_id, []).append(opcao)

    return {
        "atividade_id": atividade.id,
        "titulo": atividade.titulo,
        "questoes": [
            {
                "id": q.id,
                "texto_questao": q.texto_questao,
                "ordem": q.ordem,
                "pontos": q.pontos,
                "opcoes": [
                    {
                        "id": o.id,
                        "texto_opcao": o.texto_opcao,
                        "correta": bool(o.correta),
                    }
                    for o in opcoes_por_questao.get(q.id, [])
                ],
            }
            for q in questoes
        ],
    }

# Edita as informações de uma atividade a partir do ID dela

@atividade_router.patch("/{id_atividade}")
async def editar_atividade(id_atividade: int, atividade_schema: AtividadeUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    atividade = session.query(Atividade).filter(Atividade.id == id_atividade).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if atividade_schema.titulo is not None:
        atividade.titulo = atividade_schema.titulo
    if atividade_schema.descricao is not None:
        atividade.descricao = atividade_schema.descricao
    if atividade_schema.disciplina is not None:
        atividade.disciplina = atividade_schema.disciplina
    if atividade_schema.tipo_atividade is not None:
        atividade.tipo_atividade = atividade_schema.tipo_atividade
    if atividade_schema.dificuldade is not None:
        atividade.dificuldade = atividade_schema.dificuldade
    if atividade_schema.imagem_atividade_url is not None:
        atividade.imagem_atividade_url = atividade_schema.imagem_atividade_url
    if atividade_schema.quantidade_blocos is not None:
        atividade.quantidade_blocos = atividade_schema.quantidade_blocos
    if atividade_schema.tempo_limite_seg is not None:
        atividade.tempo_limite_seg = atividade_schema.tempo_limite_seg
    if atividade_schema.turma_id is not None:
        atividade.turma_id = atividade_schema.turma_id
    if atividade_schema.publicado is not None:
        atividade.publicado = atividade_schema.publicado

    session.commit()

    return {"mensagem": f"Atividade '{atividade.titulo}' atualizada com sucesso"}

# Deleta uma atividade a partir do id dela

@atividade_router.delete("/{id_atividade}")
async def deletar_atividade(id_atividade: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    atividade = session.query(Atividade).filter(Atividade.id == id_atividade).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    titulo_atividade = atividade.titulo
    session.delete(atividade)
    session.commit()

    return {"mensagem": f"Atividade '{titulo_atividade}' excluída com sucesso"}
