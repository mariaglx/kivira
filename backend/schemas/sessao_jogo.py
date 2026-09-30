from pydantic import BaseModel
from typing import List, Optional

class IniciarSessaoSchema(BaseModel):
    atividade_id: int

# Uma linha por slot do tabuleiro no momento de "Virar o Tabuleiro". `ordem_slot`
# é o número do slot (ordem da questão); `ordem_peca` é a ordem da peça que o
# aluno encaixou nele (None se, por algum motivo, chegou vazio). O acerto é
# sempre calculado no servidor — o cliente não decide o próprio resultado.
class RespostaSlotSchema(BaseModel):
    ordem_slot: int
    ordem_peca: Optional[int] = None

class ConferirSessaoSchema(BaseModel):
    respostas: List[RespostaSlotSchema]
