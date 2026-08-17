from pydantic import BaseModel, Field
from typing import Optional

class AtividadeSchema(BaseModel):
    professor_id: int
    titulo: str
    tipo_atividade: str
    turma_id: Optional[int] = None
    descricao: Optional[str] = None
    disciplina: Optional[str] = None
    dificuldade: Optional[str] = "facil"
    imagem_atividade_url: Optional[str] = None
    quantidade_blocos: Optional[int] = 12
    tempo_limite_seg: Optional[int] = None

class AtividadeUpdateSchema(BaseModel):
    titulo: Optional[str] = Field(default=None, examples=[None])
    descricao: Optional[str] = Field(default=None, examples=[None])
    disciplina: Optional[str] = Field(default=None, examples=[None])
    tipo_atividade: Optional[str] = Field(default=None, examples=[None])
    dificuldade: Optional[str] = Field(default=None, examples=[None])
    imagem_atividade_url: Optional[str] = Field(default=None, examples=[None])
    quantidade_blocos: Optional[int] = Field(default=None, examples=[None])
    tempo_limite_seg: Optional[int] = Field(default=None, examples=[None])
    turma_id: Optional[int] = Field(default=None, examples=[None])
    publicado: Optional[bool] = Field(default=None, examples=[None])
