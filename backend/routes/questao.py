# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a questão.
from fastapi import APIRouter, Depends, HTTPException
from models.questao import Questao
from dependecies import pegar_sessao_kivira, verificar_token_kivira
import bcrypt 
from schemas.questao import QuestaoSchema, QuestaoUpdateSchema
from models.usuario import Usuario
from models.atividade import Atividade
from models.professor import Professor

questao_router = APIRouter(prefix="/questao", tags=["questao"], dependencies=[Depends(verificar_token_kivira)])

@questao_router.post("/criar")
async def criar_questao(questao_schema: QuestaoSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    atividade = session.query(Atividade).filter(Atividade.id == questao_schema.atividade_id).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    nova_questao = Questao(
        questao_schema.texto_questao,
        questao_schema.ordem,
        questao_schema.pontos,
        questao_schema.imagem_apoio_url,
        questao_schema.dica,
        tipo_questao=questao_schema.tipo_questao
    )
    nova_questao.atividade_id = questao_schema.atividade_id
    session.add(nova_questao)
    session.commit()

    return {"mensagem": "Questão cadastrada com sucesso"}


@questao_router.get("/{id_questao}")
async def buscar_questao(id_questao: int, session = Depends(pegar_sessao_kivira)):
    questao = session.query(Questao).filter(Questao.id == id_questao).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    return {
        "id": questao.id,
        "atividade_id": questao.atividade_id,
        "texto_questao": questao.texto_questao,
        "tipo_questao": questao.tipo_questao,
        "ordem": questao.ordem,
        "pontos": questao.pontos,
        "imagem_apoio_url": questao.imagem_apoio_url,
        "dica": questao.dica
    }


@questao_router.patch("/{id_questao}")
async def editar_questao(id_questao: int, questao_schema: QuestaoUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    questao = session.query(Questao).filter(Questao.id == id_questao).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    atividade = session.query(Atividade).filter(Atividade.id == questao.atividade_id).first()
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or not atividade or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    if questao_schema.texto_questao is not None:
        questao.texto_questao = questao_schema.texto_questao
    if questao_schema.tipo_questao is not None:
        questao.tipo_questao = questao_schema.tipo_questao
    if questao_schema.ordem is not None:
        questao.ordem = questao_schema.ordem
    if questao_schema.pontos is not None:
        questao.pontos = questao_schema.pontos
    if questao_schema.imagem_apoio_url is not None:
        questao.imagem_apoio_url = questao_schema.imagem_apoio_url
    if questao_schema.dica is not None:
        questao.dica = questao_schema.dica

    session.commit()

    return {"mensagem": "Questão atualizada com sucesso"}


@questao_router.delete("/{id_questao}")
async def deletar_questao(id_questao: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    questao = session.query(Questao).filter(Questao.id == id_questao).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    atividade = session.query(Atividade).filter(Atividade.id == questao.atividade_id).first()
    professor = session.query(Professor).filter(Professor.usuario_id == usuario.id).first()
    if usuario.tipo != "admin" and (not professor or not atividade or professor.id != atividade.professor_id):
        raise HTTPException(status_code=401, detail="Você não tem autorização para fazer essa operação!")

    session.delete(questao)
    session.commit()

    return {"mensagem": "Questão excluída com sucesso"}

