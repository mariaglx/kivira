from fastapi import APIRouter, Depends
from models.avatar import Avatar
from dependecies import pegar_sessao_kivira

avatar_router = APIRouter(prefix="/avatar", tags=["avatar"])

@avatar_router.get("/")
async def listar_avatares(session = Depends(pegar_sessao_kivira)):
    avatares = session.query(Avatar).filter(Avatar.ativo == True).all()

    return[
        {
            "id": avatar.id, 
            "nome": avatar.nome, 
            "arquivo": avatar.arquivo, 
            "categoria": avatar.categoria
        }

        for avatar in avatares
    ]

