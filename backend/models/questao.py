# É onde criamos as classes do nosso banco de dados 
from sqlalchemy import create_engine , Column, String, Date, DateTime, SmallInteger, Boolean, Float, ForeignKey, Integer, Text, Enum
from database import Base
from sqlalchemy import func

# Criação da questão
class Questao(Base):
    __tablename__ = "questao"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    atividade_id = Column("atividade_id",  Integer,ForeignKey("atividade.id"), nullable=False)
    texto_questao = Column("texto_questao", Text, nullable=False)
    tipo_questao = Column("tipo_questao", Enum("multipla_escolha", "associacao", "arrastar_soltar", name="tipo_questao_enum"), nullable=False)
    ordem = Column("ordem", Integer, nullable=False)
    pontos = Column("pontos", Integer, nullable=False)
    imagem_apoio_url = Column("imagem_apoio_url", String(500))
    dica = Column("dica", Text)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())

    def __init__(self, texto_questao, ordem, pontos, imagem_apoio_url, dica, tipo_questao = "arrastar_soltar"):
       self.texto_questao = texto_questao
       self.tipo_questao =tipo_questao
       self.ordem = ordem 
       self.pontos = pontos
       self.imagem_apoio_url = imagem_apoio_url
       self.dica = dica

# Futuramente adicionar a edição