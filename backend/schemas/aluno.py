from pydantic import BaseModel, Field # Aqui nós forçamos a tipagem de dados
from typing import Optional, List # Fala se o campo é opcional o preenchimento
from datetime import date

class AlunoSchema(BaseModel):
    email: str
    senha: str
    nome_completo: str
    apelido: Optional[str] = None
    avatar_url: Optional[str] = None
    data_nascimento: Optional[date] = None

class AlunoUpdateSchema(BaseModel):
    nome_completo: Optional[str] = Field(default=None, examples=[None])
    apelido: Optional[str] = Field(default=None, examples=[None])
    avatar_url: Optional[str] = Field(default=None, examples=[None])
    data_nascimento: Optional[date] = Field(default=None, examples=[None])

class CadastrarAlunoSchema(BaseModel):
    nome_completo: str
    # Quando informado, o aluno já é matriculado direto nessa turma (criação
    # feita de dentro da tela da turma) — sem ele, fica só cadastrado, sem turma
    turma_id: Optional[int] = None

class PrimeiroAcessoSchema(BaseModel):
    username: str 
    senha_temporaria: str
    emojis: List[str]

