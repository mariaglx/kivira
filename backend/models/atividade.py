# É onde criamos as classes do nosso banco de dados 

from sqlalchemy import create_engine , Column, String, Date, DateTime, SmallInteger, Boolean, Float, ForeignKey, Integer, Text, Enum
from database import Base
from sqlalchemy import func


class Atividade(Base):
    __tablename__ = "atividade"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    professor_id = Column("professor_id", Integer, ForeignKey("professor.id"), nullable=False)
    turma_id = Column("turma_id", Integer, ForeignKey("turma.id"))
    titulo = Column("titulo", String(255), nullable=False)
    descricao = Column("descricao", Text)
    disciplina = Column("disciplina", String(100))
    tipo_atividade = Column("tipo_atividade", Enum("multipla_escolha", "associacao", "arrastar_soltar", name="tipo_atividade_enum"), nullable=False)
    dificuldade = Column("dificuldade", Enum("facil", "medio", "dificil", name="dificuldade_enum"), default="facil", nullable=False)
    imagem_atividade_url = Column("imagem_atividade_url", String(500))
    quantidade_blocos = Column("quantidade_blocos", Integer, default=12)
    tempo_limite_seg = Column("tempo_limite_seg", Integer)
    gerado_por_ia = Column("gerado_por_ia", Boolean, default=False)
    publicado = Column("publicado", Boolean, default=False)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
    data_ultima_atualizacao = Column("data_ultima_atualizacao", DateTime, server_default=func.now(), onupdate=func.now())
    
    def __init__(self, titulo, tipo_atividade, descricao, disciplina, dificuldade="facil" ):
        self.titulo = titulo
        self.tipo_atividade = tipo_atividade
        self.descricao = descricao 
        self.disciplina = disciplina 
        self.dificuldade = dificuldade

        