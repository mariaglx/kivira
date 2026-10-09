# Rota/End-point que o Front-end chama para gerar questões via IA (Gemini ou Ollama).
import sys
from pathlib import Path
# Adiciona a pasta raiz (kivira) ao caminho de buscas do Python
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from backend.dependecies import verificar_token_kivira, pegar_sessao_kivira

from fastapi import APIRouter, Depends, HTTPException
from core.rbac import admin_ou_professor, pode_gerenciar
from models.turma import Turma
from schemas.ia_geracao import GerarQuestoesSchema, GerarQuestoesResponse
from services.gemini_service import gerar_questoes_com_ia

ia_router = APIRouter(prefix="/ia", tags=["ia"], dependencies=[Depends(verificar_token_kivira)])


@ia_router.post("/gerar_questoes", response_model=GerarQuestoesResponse)
async def gerar_questoes(
    dados: GerarQuestoesSchema,
    session=Depends(pegar_sessao_kivira),
    usuario=Depends(admin_ou_professor),
):
    turma = session.query(Turma).filter(Turma.id == dados.turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    if not pode_gerenciar(session, usuario, turma):
        raise HTTPException(status_code=403, detail="Você não tem autorização para usar essa turma")

    # A série/ano é a da turma escolhida pelo professor, não um campo digitado
    questoes_geradas = await gerar_questoes_com_ia(dados, turma.ano_escolar)
    return GerarQuestoesResponse(questoes_geradas=questoes_geradas)
