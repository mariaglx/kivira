#Valida os dados antes de realizar ações (Ex: Crud)

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.usuario import UsuarioOut


class AlunoBase(BaseModel):
    nome_completo: str = Field(min_length=1, max_length=255)
    apelido: str | None = Field(default=None, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=500)
    data_nascimento: date | None = None


class AlunoCreate(AlunoBase):
    email: EmailStr
    senha: str = Field(min_length=6)


class AlunoUpdate(BaseModel):
    nome_completo: str | None = Field(default=None, min_length=1, max_length=255)
    apelido: str | None = Field(default=None, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=500)
    data_nascimento: date | None = None


class AlunoOut(AlunoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    xp_total: int
    nivel_atual: int
    data_criacao: datetime
    data_ultima_atualizacao: datetime
    usuario: UsuarioOut