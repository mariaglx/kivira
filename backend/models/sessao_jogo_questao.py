# É onde criamos as classes do nosso banco de dados

from sqlalchemy import Column, Boolean, ForeignKey, Integer, UniqueConstraint
from database import Base

# Detalhe por questão de uma partida: guarda se o aluno acertou já na primeira
# conferência e em qual rodada acertou (NULL = nunca acertou). É daqui que sai o
# relatório do professor tipo "a questão 7 todo mundo erra".
class SessaoJogoQuestao(Base):
    __tablename__ = "sessao_jogo_questao"
    __table_args__ = (UniqueConstraint("sessao_id", "questao_id", name="uq_sessao_questao"),)

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    sessao_id = Column("sessao_id", Integer, ForeignKey("sessao_jogo.id"), nullable=False)
    # id REAL da questão no banco (o tabuleiro casa peça/slot pela ordem, mas quem
    # converte ordem -> id é o backend na hora de gravar)
    questao_id = Column("questao_id", Integer, ForeignKey("questao.id"), nullable=False)
    acertou_primeira = Column("acertou_primeira", Boolean, nullable=False, default=False)
    rodada_acerto = Column("rodada_acerto", Integer)

    def __init__(self, sessao_id, questao_id):
        self.sessao_id = sessao_id
        self.questao_id = questao_id
