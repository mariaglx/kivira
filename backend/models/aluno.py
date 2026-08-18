# É onde criamos as classes do nosso banco de dados 

from sqlalchemy import create_engine , Column, String, Date, DateTime, SmallInteger, Boolean, Float, ForeignKey, Integer
from database import Base
from sqlalchemy import func


class Aluno(Base):
    __tablename__ = "aluno"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id"), unique=True)
    nome_completo = Column("nome_completo", String(255), nullable=False)
    apelido = Column("apelido", String(50))
    avatar_url = Column("avatar_url", String(500))
    data_nascimento = Column("data_nascimento", Date)
    xp_total = Column("xp_total", Integer, default=0)
    nivel_atual = Column("nivel_atual", Integer, default=1)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())
    username = Column("username", String(100), unique=True)

    def __init__(self, nome_completo, apelido, data_nascimento):
        self.nome_completo = nome_completo 
        self.apelido = apelido
        self.data_nascimento = data_nascimento