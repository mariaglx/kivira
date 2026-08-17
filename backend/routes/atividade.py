# Rota/End-point que o Front-end vai chamar necessitar de algo relacionado a atividade.

from fastapi import APIRouter, Depends, HTTPException 
from models.atividade import Atividade 
from models.professor import Professor
from models.usuario import Usuario
from dependecies import pegar_sessao_kivira, verificar_token_kivira
from schemas.atividade import AtividadeSchema, AtividadeUpdateSchema

atividade_router = APIRouter(prefix="/atividade", tags=["atividade"],dependencies=[Depends(verificar_token_kivira)])

@atividade_router.get("/")
async def atividade():
    return{"mensagem":"Você acessou a rota de atividades"}

# Criar uma atividade

@atividade_router.post("/criar_atividade")
async def criar_atividade(atividade_schema: AtividadeSchema, session = Depends(pegar_sessao_kivira)):
    nova_atividade = Atividade(
        atividade_schema.titulo,
        atividade_schema.tipo_atividade,
        atividade_schema.descricao, 
        atividade_schema.disciplina, 
        atividade_schema.dificuldade
    )
    nova_atividade.professor_id = atividade_schema.professor_id 
    nova_atividade.turma_id = atividade_schema.turma_id
    nova_atividade.imagem_atividade_url = atividade_schema.imagem_atividade_url 
    nova_atividade.quantidade_blocos = atividade_schema.quantidade_blocos 
    nova_atividade.tempo_limite_seg = atividade_schema.tempo_limite_seg 

    session.add(nova_atividade)
    session.commit()

    return{"mensagem": f"atividade '{nova_atividade.titulo}' cadastrada com sucesso"}

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
