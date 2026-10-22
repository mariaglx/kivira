# É onde criamos as classes do nosso banco de dados

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, SmallInteger
from database import Base
from sqlalchemy import func


class FeedbackAluno(Base):
    __tablename__ = "feedback_aluno"
    __table_args__ = (
        CheckConstraint(
            "diversao BETWEEN 1 AND 5 AND autonomia BETWEEN 1 AND 3"
            " AND jogar_de_novo BETWEEN 1 AND 3",
            name="ck_feedback_aluno_notas",
        ),
    )

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id"), unique=True, nullable=False)
    diversao = Column("diversao", SmallInteger, nullable=False)
    autonomia = Column("autonomia", SmallInteger, nullable=False)
    jogar_de_novo = Column("jogar_de_novo", SmallInteger, nullable=False)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())
