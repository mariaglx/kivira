from pydantic import BaseModel, Field # Aqui nós forçamos a tipagem de dados
from typing import Optional # Fala se o campo é opcional o preenchimento

class TurmaSchema(BaseModel):
    professor_id: int
    nome: str
    ano_escolar: str
    ano_letivo: int
    descricao: Optional[str] = None
    ativo: Optional[bool] = True

class TurmaUpdateSchema(BaseModel):
    nome: Optional[str] = Field(default=None, examples=[None])
    ano_escolar: Optional[str] = Field(default=None, examples=[None])
    ano_letivo: Optional[int] = Field(default=None, examples=[None])
    descricao: Optional[str] = Field(default=None, examples=[None])
    ativo: Optional[bool] = Field(default=None, examples=[None])
