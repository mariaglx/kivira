from pydantic import BaseModel, Field # Aqui nós forçamos a tipagem de dados
from typing import Optional # Fala se o campo é opcional o preenchimento

class TurmaSchema(BaseModel):
    # Só é considerado quando quem está criando é admin (professores comuns têm o
    # professor_id derivado do próprio token, não do que o cliente manda)
    professor_id: Optional[int] = None
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
