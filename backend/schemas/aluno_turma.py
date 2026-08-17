from pydantic import BaseModel, Field # Aqui nós forçamos a tipagem de dados
from typing import Optional, List # Fala se o campo é opcional o preenchimento
from datetime import date

class AlunoTurmaSchema(BaseModel):
    turma_id : int 
    aluno_id: int 
    ativo: Optional[int] = 1

class AlunoTurmaUpdateSchema(BaseModel):
    ativo: Optional[int] = Field(default=None, examples=[None])