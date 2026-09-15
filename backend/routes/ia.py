# Rota/End-point que o Front-end chama para gerar questões de atividade com IA (Ollama/llama3).

from fastapi import APIRouter, Depends
from dependecies import verificar_token_kivira
from schemas.ia_geracao import GerarQuestoesSchema, GerarQuestoesResponse
from services.ollama_service import gerar_questoes_com_ia

ia_router = APIRouter(prefix="/ia", tags=["ia"], dependencies=[Depends(verificar_token_kivira)])


@ia_router.post("/gerar_questoes", response_model=GerarQuestoesResponse)
async def gerar_questoes(dados: GerarQuestoesSchema):
    questoes_geradas = await gerar_questoes_com_ia(dados)
    return GerarQuestoesResponse(questoes_geradas=questoes_geradas)
