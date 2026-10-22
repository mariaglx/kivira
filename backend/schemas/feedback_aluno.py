from pydantic import BaseModel, Field


# Faixas diferentes de propósito: diversão é o Smileyometer de 5 carinhas;
# autonomia e jogar_de_novo são de 3 pontos, que é o que criança dessa idade
# discrimina com confiança em conceito mais abstrato que "gostei".
class FeedbackAlunoSchema(BaseModel):
    diversao: int = Field(ge=1, le=5)
    autonomia: int = Field(ge=1, le=3)
    jogar_de_novo: int = Field(ge=1, le=3)
