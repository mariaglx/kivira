# É onde criamos as classes do nosso banco de dados 

from sqlalchemy import create_engine , Column, DateTime, ForeignKey, Integer, UniqueConstraint
from database import Base
from sqlalchemy import func

class AlunoTurma(Base):
    __tablename__ = "aluno_turma"
    __table_args__ = (UniqueConstraint("turma_id", "aluno_id", name="uq_turma_aluno"),)


    id = Column("id", Integer, primary_key=True, autoincrement=True)
    turma_id = Column("turma_id", Integer, ForeignKey("turma.id"), nullable=False)
    aluno_id = Column("aluno_id", Integer, ForeignKey("aluno.id"), nullable=False)
    data_inscricao = Column("data_inscricao", DateTime, server_default=func.now())
    ativo = Column("ativo", Integer, nullable=False, default=1)

