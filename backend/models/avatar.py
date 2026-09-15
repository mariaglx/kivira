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

    # Aluno.avatar_url guarda o nome do arquivo direto (sem FK pra avatar.id) --
    # diferente de Professor, que tem avatar_id + relationship. Não declarar
    # uma relationship "alunos" aqui: sem FK correspondente em Aluno, o SQLAlchemy
    # falha ao configurar os mappers (NoForeignKeysError) na primeira query feita
    # em QUALQUER tabela do app, derrubando o backend inteiro com 500.
    professores = relationship("Professor", back_populates="avatar")


    def __init__(self, nome, arquivo, categoria):
        self.nome = nome
        self.arquivo = arquivo
        self.categoria = categoria