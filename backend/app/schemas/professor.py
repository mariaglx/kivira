#Valida os dados antes de realizar ações (Ex: Crud)

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.usuario import UsuarioOut


class ProfessorBase(BaseModel):
    nome_completo: str = Field(min_length=1, max_length=255)
    apelido: str | None = Field(default=None, max_length=50)
    escola: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=500)
    biografia: str | None = None


class ProfessorCreate(ProfessorBase):
    email: EmailStr
    senha: str = Field(min_length=6)


class ProfessorUpdate(BaseModel):
    nome_completo: str | None = Field(default=None, min_length=1, max_length=255)
    apelido: str | None = Field(default=None, max_length=50)
    escola: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=500)
    biografia: str | None = None


class ProfessorOut(ProfessorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    data_criacao: datetime
    data_ultima_atualizacao: datetime
    usuario: UsuarioOut