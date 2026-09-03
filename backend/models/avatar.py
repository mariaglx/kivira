from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.orm import relationship
from database import Base

class Avatar(Base):
    __tablename__ = "avatar"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String(50), nullable=False)
    arquivo = Column("arquivo", String(100), nullable=False, unique=True)
    categoria = Column("categoria", String(30), nullable=False)
    ativo = Column("ativo", Boolean, nullable=False, default=True)

    professores = relationship("Professor",back_populates="avatar")
    alunos = relationship("Aluno", back_populates="avatar")


    def __init__(self, nome, arquivo, categoria):
        self.nome = nome
        self.arquivo = arquivo
        self.categoria = categoria