# É onde criamos as classes do nosso banco de dados 

from sqlalchemy import create_engine , Column, String, Date, DateTime, SmallInteger, Boolean, Float, ForeignKey, Integer, Text
from database import Base
from sqlalchemy import func


class Professor(Base):
    __tablename__ = "professor"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id"), unique=True, nullable=False)
    nome_completo = Column("nome_completo", String(255), nullable=False)
    apelido = Column("apelido", String(50))
    escola = Column("escola", String (255))
    avatar_url = Column("avatar_url", String(500))
    biografia = Column("biografia", Text)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())

    def __init__(self, nome_completo, apelido, escola, biografia):
        self.nome_completo = nome_completo 
        self.apelido = apelido
        self.escola = escola 
        self.biografia = biografia