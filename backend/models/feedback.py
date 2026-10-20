from sqlalchemy import Column, DateTime, ForeignKey, Integer, SmallInteger, Text
from database import Base
from sqlalchemy import func


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id"), unique=True, nullable=False)
    facilidade_uso = Column("facilidade_uso", SmallInteger, nullable=False)
    autonomia_aluno = Column("autonomia_aluno", SmallInteger, nullable=False)
    alinhamento_conteudo = Column("alinhamento_conteudo", SmallInteger, nullable=False)
    usaria_nas_aulas = Column("usaria_nas_aulas", SmallInteger, nullable=False)
    comentario = Column("comentario", Text, nullable=False)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())
