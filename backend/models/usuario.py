# É onde criamos as classes do nosso banco de dados 

from sqlalchemy import create_engine , Column, String, Integer, Boolean, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import declarative_base
from database import Base #criamos a conexão do nosso banco 
from sqlalchemy import func

class Usuario(Base):
    __tablename__ = "usuario"
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    email = Column("email", String(255), nullable=False, unique=True)
    senha_hash = Column("senha_hash", String(255), nullable=False)
    tipo = Column("tipo", Enum("admin", "professor", "estudante", name="tipo_usuario_enum"),nullable=False, default="estudante")
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())
