# Rota que o Front-end chama para buscar imagens no Pixabay ao montar uma atividade.

from typing import Optional

from fastapi import APIRouter, Depends, Query
from core.rbac import admin_ou_professor
from schemas.pixabay import BuscarImagensPixabayResponse
from services.pixabay_service import buscar_imagens_pixabay

pixabay_router = APIRouter(
    prefix="/pixabay", tags=["pixabay"], dependencies=[Depends(admin_ou_professor)]
)


@pixabay_router.get("/buscar", response_model=BuscarImagensPixabayResponse)
async def buscar_imagens(
    termo: str = Query(min_length=1),
    pagina: int = Query(default=1, ge=1),
    tipo_imagem: str = Query(default="illustration"),
    cor: Optional[str] = Query(default=None),
):
    return await buscar_imagens_pixabay(termo, pagina, tipo_imagem, cor)
