from pydantic import BaseModel, Field # Aqui nós forçamos a tipagem de dados
from typing import Optional # Fala se o campo é opcional o preenchimento

class ProfessorSchema(BaseModel):
    email: str
    senha: str
    nome_completo: str
    apelido: Optional[str] = None
    escola: Optional[str] = None
    avatar_url: Optional[str] = None
    biografia: Optional[str] = None

class ProfessorUpdateSchema(BaseModel):
    nome_completo: Optional[str] = Field(default=None, examples=[None])
    apelido: Optional[str] = Field(default=None, examples=[None])
    escola: Optional[str] = Field(default=None, examples=[None])
    avatar_url: Optional[str] = Field(default=None, examples=[None])
    biografia: Optional[str] = Field(default=None, examples=[None])
