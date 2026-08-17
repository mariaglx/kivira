from pydantic import BaseModel, Field 
from typing import Optional

class OpcaoQuestaoSchema(BaseModel):
    questao_id: int
    texto_opcao: str
    imagem_opcao_url: Optional[str] = None
    correta: Optional[int] = 0
    par_associacao_id: Optional[int] = None
    ordem: Optional[int] = 1

class OpcaoQuestaoUpdateSchema(BaseModel):

    texto_opcao: Optional[str] = Field(default=None, examples=[None])
    imagem_opcao_url: Optional[str] = Field(default=None, examples=[None])
    par_associacao_id: Optional[int] = Field(default=None, examples=[None])
    ordem: Optional[int] = Field(default=None, examples=[None])    

