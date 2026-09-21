# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a atividade.

import secrets
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import insert
from models.atividade import Atividade
from models.professor import Professor
from models.usuario import Usuario
from models.aluno import Aluno
from models.aluno_turma import AlunoTurma
from models.turma import Turma
from models.questao import Questao
from models.opcao_questao import OpcaoQuestao
from models.sessao_jogo import SessaoJogo
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import admin_ou_professor
from schemas.atividade import AtividadeSchema, AtividadeUpdateSchema, SalvarQuestoesSchema, SalvarImagemPixabaySchema
from services.cloudinary_service import enviar_imagem_atividade, enviar_imagem_do_pixabay
from services.auditoria_service import registrar_log

atividade_router = APIRouter(prefix="/atividade", tags=["atividade"],dependencies=[Depends(verificar_token_kivira)])

@atividade_router.get("/")
async def atividade():
    return{"mensagem":"Você acessou a rota de atividades"}

# Lista as atividades criadas pelo professor logado. Usado pela tela de Atividades
# do professor pra substituir os dados mockados.

@atividade_router.get("/professor/minhas")
async def listar_atividades_do_professor(
    turma_id: int | None = None,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(verificar_token_kivira),
):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    query = session.query(Atividade).filter(Atividade.professor_id == professor.id)
    if turma_id is not None:
        query = query.filter(Atividade.turma_id == turma_id)
    atividades = query.all()

    # Antes: 1 query de Turma por atividade dentro do loop — 1 + N idas ao banco.
    # Agora é 1 query só, buscando de uma vez todas as turmas referenciadas.
    turma_ids = {a.turma_id for a in atividades if a.turma_id}
    nomes_por_turma = {}
    if turma_ids:
        nomes_por_turma = dict(
            session.query(Turma.id, Turma.nome).filter(Turma.id.in_(turma_ids)).all()
        )

    resultado = []
    for a in atividades:
        resultado.append({
            "id": a.id,
            "titulo": a.titulo,
            "disciplina": a.disciplina,
            "tipo_atividade": a.tipo_atividade,
            "dificuldade": a.dificuldade,
            "quantidade_blocos": a.quantidade_blocos,
            "imagem_atividade_url": a.imagem_atividade_url,
            "turma_id": a.turma_id,
            "turma_nome": nomes_por_turma.get(a.turma_id),
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

    # Quais dessas atividades o aluno já concluiu alguma vez — vira o selo
    # "Concluída" na tela dele em vez de ficar sem nenhuma marcação.
    atividade_ids = [a.id for a in atividades]
    atividades_concluidas = set()
    if atividade_ids:
        atividades_concluidas = {
            id_atividade
            for (id_atividade,) in session.query(SessaoJogo.atividade_id).filter(
                SessaoJogo.aluno_id == aluno.id,
                SessaoJogo.atividade_id.in_(atividade_ids),
                SessaoJogo.status == "concluido",
            ).distinct().all()
        }

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
            "concluida": a.id in atividades_concluidas,
        }
        for a in atividades
    ]

# Criar uma atividade — só admin e professor podem chegar aqui (RBAC via exigir_papel);
# alunos recebem 403 antes mesmo de rodar a lógica abaixo.

@atividade_router.post("/criar_atividade", dependencies=[Depends(admin_ou_professor)])
async def criar_atividade(atividade_schema: AtividadeSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()

    if usuario.tipo == "admin" and atividade_schema.professor_id is not None:
        professor_id = atividade_schema.professor_id
    elif professor:
        professor_id = professor.id
    else:
        raise HTTPException(status_code=401, detail="Você não tem autorização para criar atividades")

    while True:
        codigo = secrets.token_hex(4)
        existe = session.query(Atividade).filter(Atividade.codigo_atividade == codigo).first()
        if not existe:
            break

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
    nova_atividade.codigo_atividade = codigo
    nova_atividade.publicado = True  # salvou, já está publicada — sem passo de "publicar" separado

    session.add(nova_atividade)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="CRIAR_ATIVIDADE",
        entidade="atividade",
        entidade_id=nova_atividade.id,
        detalhes={"titulo": nova_atividade.titulo, "professor_id": professor_id},
    )

    return{
        "id": nova_atividade.id,
        "codigo_atividade": codigo,
        "mensagem": f"atividade '{nova_atividade.titulo}' cadastrada com sucesso",
    }

# Upload de imagem do computador do professor para usar na atividade (alternativa
# à busca no Pixabay) — precisa vir ANTES de "/{id_atividade}" abaixo, senão o
# FastAPI tentaria casar "upload_imagem" como id e devolveria 422.

@atividade_router.post("/upload_imagem")
async def upload_imagem_atividade(arquivo: UploadFile = File(...)):
    if not arquivo.content_type or not arquivo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Envie um arquivo de imagem")

    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    url = await enviar_imagem_atividade(conteudo)
    return {"url": url}

# Guarda no Cloudinary uma imagem escolhida na busca do Pixabay. Também precisa vir
# antes de "/{id_atividade}" pelo mesmo motivo da rota acima.

@atividade_router.post("/imagem_do_pixabay")
async def salvar_imagem_do_pixabay(dados: SalvarImagemPixabaySchema):
    url = await enviar_imagem_do_pixabay(dados.url)
    return {"url": url}

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
        "publicado": atividade.publicado,
        "codigo_atividade": atividade.codigo_atividade
    }

# Lista as questões (com as opções) de uma atividade específica — usado pelo
# modal "Ver questões" na tela de Atividades do professor

@atividade_router.get("/{id_atividade}/questoes")
async def listar_questoes_da_atividade(id_atividade: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    atividade = session.query(Atividade).filter(Atividade.id == id_atividade).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    # Três perfis chegam aqui: o admin, o professor dono da atividade (modal
    # "Ver questões") e o aluno que vai jogar. O aluno não tem linha em
    # `professor`, então a checagem que só olhava o dono devolvia 401 pra ele
    # sempre — e o botão "Jogar!" da home do aluno nunca funcionava.
    if usuario.tipo == "admin":
        autorizado = True

    elif usuario.tipo == "estudante":
        aluno = session.query(Aluno).filter(Aluno.usuario_id == usuario.id).first()

        matricula = None
        if aluno and atividade.turma_id:
            matricula = session.query(AlunoTurma).filter(
                AlunoTurma.aluno_id == aluno.id,
                AlunoTurma.turma_id == atividade.turma_id,
                AlunoTurma.ativo == 1,
            ).first()

        # Rascunho não publicado não vaza nem pra quem é da turma
        autorizado = bool(matricula and atividade.publicado)

    else:
        professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
        autorizado = bool(professor and professor.id == atividade.professor_id)

    if not autorizado:
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

# Salva todas as questões (+ respostas) de uma atividade numa tacada só. Substitui
# o antigo fluxo do front de "1 POST/PATCH por questão + 1 POST/PATCH por opção"
# (chegava a 24 requests sequenciais pros 12 blocos padrão, ~50s no fim a fim) —
# agora é 1 request só, sem depender de N ida-e-voltas de rede.

@atividade_router.put("/{id_atividade}/questoes", dependencies=[Depends(admin_ou_professor)])
async def salvar_questoes_da_atividade(
    id_atividade: int,
    payload: SalvarQuestoesSchema,
    session = Depends(pegar_sessao_kivira),
    usuario: Usuario = Depends(verificar_token_kivira),
):
    atividade = session.query(Atividade).filter(Atividade.id == id_atividade).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if payload.remover_questao_ids:
        session.query(Questao).filter(
            Questao.id.in_(payload.remover_questao_ids),
            Questao.atividade_id == id_atividade,
        ).delete(synchronize_session=False)

    # Busca de uma vez só (2 queries, IN) as questões/opções já existentes que vão
    # ser atualizadas — em vez de 1 SELECT por item dentro do loop.
    questao_ids_existentes = [item.questao_id for item in payload.questoes if item.questao_id]
    questoes_por_id = {
        q.id: q
        for q in session.query(Questao).filter(
            Questao.id.in_(questao_ids_existentes), Questao.atividade_id == id_atividade
        ).all()
    } if questao_ids_existentes else {}

    opcao_ids_existentes = [item.opcao_id for item in payload.questoes if item.opcao_id]
    opcoes_por_id = {
        o.id: o
        for o in session.query(OpcaoQuestao).filter(OpcaoQuestao.id.in_(opcao_ids_existentes)).all()
    } if opcao_ids_existentes else {}

    # resultado_por_ordem[ordem] guarda {"questao_id", "opcao_id"} conforme vão
    # sendo resolvidos — questões/opções existentes são atualizadas na hora (via
    # ORM, comitadas no final); as novas viram 1 INSERT em lote cada (ao invés de
    # 1 INSERT por linha): testado com 12 questões, foi de ~3s para ~0.2s.
    resultado_por_ordem = {}
    itens_novos_questao = []
    for item in payload.questoes:
        if item.questao_id:
            questao = questoes_por_id.get(item.questao_id)
            if not questao:
                raise HTTPException(status_code=404, detail=f"Questão {item.questao_id} não encontrada")
            questao.texto_questao = item.texto_questao
            questao.ordem = item.ordem
            questao.pontos = item.pontos
            resultado_por_ordem[item.ordem] = {"questao_id": questao.id}
        else:
            itens_novos_questao.append(item)

    if itens_novos_questao:
        linhas_questao = [
            {
                "atividade_id": id_atividade,
                "texto_questao": item.texto_questao,
                "tipo_questao": atividade.tipo_atividade,
                "ordem": item.ordem,
                "pontos": item.pontos,
                "imagem_apoio_url": None,
                "dica": None,
            }
            for item in itens_novos_questao
        ]
        # lastrowid = id da 1ª linha inserida; o InnoDB garante bloco contíguo de
        # auto_increment pra um único INSERT multi-linha, então id da linha N é
        # sempre lastrowid + (N-1) — não precisamos de RETURNING (MySQL não tem).
        primeiro_id = session.execute(insert(Questao.__table__), linhas_questao).lastrowid
        for i, item in enumerate(itens_novos_questao):
            resultado_por_ordem[item.ordem] = {"questao_id": primeiro_id + i}

    itens_novos_opcao = []
    for item in payload.questoes:
        questao_id = resultado_por_ordem[item.ordem]["questao_id"]
        if item.opcao_id:
            opcao = opcoes_por_id.get(item.opcao_id)
            if not opcao or opcao.questao_id != questao_id:
                raise HTTPException(status_code=404, detail=f"Opção da questão {item.ordem} não encontrada")
            opcao.texto_opcao = item.resposta_certa
            resultado_por_ordem[item.ordem]["opcao_id"] = opcao.id
        else:
            itens_novos_opcao.append(item)

    if itens_novos_opcao:
        linhas_opcao = [
            {
                "questao_id": resultado_por_ordem[item.ordem]["questao_id"],
                "texto_opcao": item.resposta_certa,
                "imagem_opcao_url": None,
                "correta": 1,
                "par_associacao_id": None,
                "ordem": 1,
            }
            for item in itens_novos_opcao
        ]
        primeiro_id_opcao = session.execute(insert(OpcaoQuestao.__table__), linhas_opcao).lastrowid
        for i, item in enumerate(itens_novos_opcao):
            resultado_por_ordem[item.ordem]["opcao_id"] = primeiro_id_opcao + i

    session.commit()

    registrar_log(
        session,
        usuario,
        acao="SALVAR_QUESTOES_ATIVIDADE",
        entidade="atividade",
        entidade_id=id_atividade,
        detalhes={"total_questoes": len(payload.questoes), "removidas": len(payload.remover_questao_ids or [])},
    )

    return {
        "mensagem": "Questões salvas com sucesso",
        "questoes": [
            {"ordem": ordem, **dados}
            for ordem, dados in resultado_por_ordem.items()
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
    # Salvar edição também publica (sem passo de "publicar" separado) — e de
    # brinde já corrige, na próxima edição, qualquer atividade antiga que
    # ficou travada em rascunho antes dessa decisão. Um PATCH explícito com
    # publicado=false ainda funciona, se um dia for preciso despublicar.
    atividade.publicado = True if atividade_schema.publicado is None else atividade_schema.publicado

    # Atividades criadas antes desse campo existir não têm código ainda —
    # gera um na primeira edição em vez de deixar travado pra sempre
    if not atividade.codigo_atividade:
        while True:
            codigo = secrets.token_hex(4)
            existe = session.query(Atividade).filter(Atividade.codigo_atividade == codigo).first()
            if not existe:
                break
        atividade.codigo_atividade = codigo

    session.commit()

    registrar_log(
        session,
        usuario,
        acao="ATUALIZAR_ATIVIDADE",
        entidade="atividade",
        entidade_id=atividade.id,
    )

    return {
        "mensagem": f"Atividade '{atividade.titulo}' atualizada com sucesso",
        "codigo_atividade": atividade.codigo_atividade,
    }

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
    id_atividade_excluida = atividade.id
    session.delete(atividade)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="EXCLUIR_ATIVIDADE",
        entidade="atividade",
        entidade_id=id_atividade_excluida,
        detalhes={"titulo": titulo_atividade},
    )

    return {"mensagem": f"Atividade '{titulo_atividade}' excluída com sucesso"}
