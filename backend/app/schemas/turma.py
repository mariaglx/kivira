#Valida os dados antes de realizar ações (Ex: Crud)

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TurmaBase(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    ano_escolar: str = Field(min_length=1, max_length=50)
    ano_letivo: int
    descricao: str | None = None


class TurmaCreate(TurmaBase):
    # TEMPORÁRIO: sem login/JWT ainda, o professor_id precisa ser informado
    # na mão. Quando tiver autenticação, isso deve vir do token, não do body.
    professor_id: int


class TurmaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    ano_escolar: str | None = Field(default=None, min_length=1, max_length=50)
    ano_letivo: int | None = None
    descricao: str | None = None
    ativo: bool | None = None


class TurmaOut(TurmaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    professor_id: int
    ativo: bool
    codigo_acesso: str
    data_criacao: datetime
    data_ultima_atualizacao: datetime