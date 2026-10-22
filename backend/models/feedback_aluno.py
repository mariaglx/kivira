# É onde criamos as classes do nosso banco de dados

from sqlalchemy import Column, DateTime, ForeignKey, Integer, SmallInteger
from database import Base
from sqlalchemy import func


class FeedbackAluno(Base):
    __tablename__ = "feedback_aluno"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id"), unique=True, nullable=False)
    diversao = Column("diversao", SmallInteger, nullable=False)
    autonomia = Column("autonomia", SmallInteger, nullable=False)
    jogar_de_novo = Column("jogar_de_novo", SmallInteger, nullable=False)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())
