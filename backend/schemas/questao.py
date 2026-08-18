from pydantic import BaseModel, Field 
from typing import Optional 

class QuestaoSchema(BaseModel):
    atividade_id: int
    texto_questao: str
    tipo_questao: str
    ordem: Optional[int] = 1
    pontos: Optional[int] = 10
    imagem_apoio_url: Optional[str] = None #Será que deixar opcional a imagem pra cadastrar a atividade?
    dica: Optional[str] = None

class QuestaoUpdateSchema(BaseModel):
    texto_questao: Optional[str] = Field(default=None, examples=[None])
    tipo_questao: Optional[str] = Field(default=None, examples=[None])
    ordem: Optional[int] = Field(default=None, examples=[None])
    pontos: Optional[int] = Field(default=None, examples=[None])
    imagem_apoio_url: Optional[str] = Field(default=None, examples=[None])
    dica: Optional[str] = Field(default=None, examples=[None])