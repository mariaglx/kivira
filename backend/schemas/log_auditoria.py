from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LogAuditoriaSchema(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    papel_usuario: str
    acao: str
    entidade: str
    entidade_id: Optional[int] = None
    detalhes: Optional[str] = None
    data_criacao: Optional[datetime] = None

    class Config:
        from_attributes = True
