from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated


# Todas as 5 são obrigatórias: as 4 objetivas de 1 a 5 e a descritiva com texto.
# StringConstraints apara os espaços ANTES de validar, senão " " passaria no min_length.
class FeedbackSchema(BaseModel):
    facilidade_uso: int = Field(ge=1, le=5)
    autonomia_aluno: int = Field(ge=1, le=5)
    alinhamento_conteudo: int = Field(ge=1, le=5)
    usaria_nas_aulas: int = Field(ge=1, le=5)
    comentario: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)
    ]
