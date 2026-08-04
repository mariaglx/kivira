from sqlalchemy import create_engine , Column, String, Date, DateTime, SmallInteger, Boolean, Float, ForeignKey, Integer, Text, Enum
from database import Base
from sqlalchemy import func
from sqlalchemy.dialects.mysql import YEAR

class Turma(Base):
    __tablename__ = "turma"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    professor_id = Column("professor_id", Integer, ForeignKey("professor.id"), nullable=False)
    nome = Column("nome", String(255), nullable=False)
    ano_escolar = Column("ano_escolar", String(50), nullable=False)
    ano_letivo = Column("ano_letivo", YEAR, nullable=False)
    descricao = Column("descricao", Text)
    ativo = Column("ativo", Boolean, default=True)
    codigo_acesso = Column("codigo_acesso", String(8), nullable=False, unique=True)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())

    def __init__(self, nome, ano_escolar, ano_letivo, descricao, ativo=True):
        self.nome = nome
        self.ano_escolar = ano_escolar 
        self.ano_letivo = ano_letivo 
        self.descricao = descricao 
        self.ativo = ativo
