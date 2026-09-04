from pydantic import BaseModel, Field
from typing import Optional


# Uma questão já preenchida manualmente pelo professor, usada como exemplo de padrão para a IA
class QuestaoExistenteSchema(BaseModel):
    texto_questao: str
    resposta_certa: str


class GerarQuestoesSchema(BaseModel):
    serie_ano: str
    disciplina: str
    titulo: str
    dificuldade: str = "facil"
    descricao: Optional[str] = None
    quantidade_total: int = Field(gt=0, le=24)
    questoes_existentes: list[QuestaoExistenteSchema] = []


# Par (pergunta, resposta) devolvido pela IA — sem imagem ou posição de tabuleiro
class PerguntaRespostaIA(BaseModel):
    texto_questao: str
    resposta_certa: str


class GerarQuestoesResponse(BaseModel):
    questoes_geradas: list[PerguntaRespostaIA]
