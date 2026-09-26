# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a opcao_questao.
from fastapi import APIRouter, Depends, HTTPException
from models.opcao_questao import OpcaoQuestao
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from core.rbac import pode_gerenciar
from schemas.opcao_questao import OpcaoQuestaoSchema, OpcaoQuestaoUpdateSchema
from models.usuario import Usuario
from models.questao import Questao
from models.atividade import Atividade
from services.auditoria_service import registrar_log

opcao_questao_router = APIRouter(prefix="/opcao_questao", tags=["opcao_questao"], dependencies=[Depends(verificar_token_kivira)])

@opcao_questao_router.post("/criar")
def criar_opcao_questao(opcao_questao_schema: OpcaoQuestaoSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    questao = session.query(Questao).filter(Questao.id == opcao_questao_schema.questao_id).first() 
    if not questao:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    atividade = session.query(Atividade).filter(Atividade.id == questao.atividade_id).first()
    if not pode_gerenciar(session, usuario, atividade):
        raise HTTPException(status_code=401, detail="Você não possuí autorização para fazer essa alteração")
    nova_opcao_questao = OpcaoQuestao(
        opcao_questao_schema.texto_opcao,
        opcao_questao_schema.correta,
        opcao_questao_schema.par_associacao_id,
        opcao_questao_schema.ordem
    )
    nova_opcao_questao.questao_id = opcao_questao_schema.questao_id
    session.add(nova_opcao_questao)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="CRIAR_OPCAO_QUESTAO",
        entidade="opcao_questao",
        entidade_id=nova_opcao_questao.id,
        detalhes={"questao_id": nova_opcao_questao.questao_id},
    )

    return{"id": nova_opcao_questao.id, "mensagem":"Opção de questão cadastrada com sucesso"}


@opcao_questao_router.get("/{id_opcao_questao}")
def buscar_opcao_questao(id_opcao_questao: int, session = Depends(pegar_sessao_kivira)):
    opcao_questao = session.query(OpcaoQuestao).filter(OpcaoQuestao.id == id_opcao_questao).first()
    if not opcao_questao:
        raise HTTPException(status_code=404, detail="Opção de questão não encontrada")

    return {
        "id": opcao_questao.id,
        "questao_id": opcao_questao.questao_id,
        "texto_opcao": opcao_questao.texto_opcao,
        "imagem_opcao_url": opcao_questao.imagem_opcao_url,
        "correta": opcao_questao.correta,
        "par_associacao_id": opcao_questao.par_associacao_id,
        "ordem": opcao_questao.ordem
    }


@opcao_questao_router.patch("/{id_opcao_questao}")
def editar_opcao_questao(id_opcao_questao: int, opcao_questao_schema: OpcaoQuestaoUpdateSchema, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    opcao_questao = session.query(OpcaoQuestao).filter(OpcaoQuestao.id == id_opcao_questao).first()
    if not opcao_questao:
        raise HTTPException(status_code=404, detail="Opção de questão não encontrada")

    questao = session.query(Questao).filter(Questao.id == opcao_questao.questao_id).first()
    atividade = session.query(Atividade).filter(Atividade.id == questao.atividade_id).first() if questao else None
    if not pode_gerenciar(session, usuario, atividade):
        raise HTTPException(status_code=401, detail="Você não possuí autorização para fazer essa alteração")

    if opcao_questao_schema.texto_opcao is not None:
        opcao_questao.texto_opcao = opcao_questao_schema.texto_opcao
    if opcao_questao_schema.imagem_opcao_url is not None:
        opcao_questao.imagem_opcao_url = opcao_questao_schema.imagem_opcao_url
    if opcao_questao_schema.par_associacao_id is not None:
        opcao_questao.par_associacao_id = opcao_questao_schema.par_associacao_id
    if opcao_questao_schema.ordem is not None:
        opcao_questao.ordem = opcao_questao_schema.ordem

    session.commit()

    registrar_log(
        session,
        usuario,
        acao="ATUALIZAR_OPCAO_QUESTAO",
        entidade="opcao_questao",
        entidade_id=opcao_questao.id,
    )

    return {"mensagem": "Opção de questão atualizada com sucesso"}


@opcao_questao_router.delete("/{id_opcao_questao}")
def deletar_opcao_questao(id_opcao_questao: int, session = Depends(pegar_sessao_kivira), usuario: Usuario = Depends(verificar_token_kivira)):
    opcao_questao = session.query(OpcaoQuestao).filter(OpcaoQuestao.id == id_opcao_questao).first()
    if not opcao_questao:
        raise HTTPException(status_code=404, detail="Opção de questão não encontrada")

    questao = session.query(Questao).filter(Questao.id == opcao_questao.questao_id).first()
    atividade = session.query(Atividade).filter(Atividade.id == questao.atividade_id).first() if questao else None
    if not pode_gerenciar(session, usuario, atividade):
        raise HTTPException(status_code=401, detail="Você não possuí autorização para fazer essa alteração")

    id_opcao_excluida = opcao_questao.id
    session.delete(opcao_questao)
    session.commit()

    registrar_log(
        session,
        usuario,
        acao="EXCLUIR_OPCAO_QUESTAO",
        entidade="opcao_questao",
        entidade_id=id_opcao_excluida,
    )

    return {"mensagem": "Opção de questão excluída com sucesso"}