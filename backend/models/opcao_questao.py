# É onde criamos as classes do nosso banco de dados 

from sqlalchemy import create_engine , Column, String, Date, DateTime, SmallInteger, Boolean, Float, ForeignKey, Integer, Text
from database import Base
from sqlalchemy import func



class OpcaoQuestao(Base):
    __tablename__ = "opcao_questao"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    questao_id = Column("questao_id", Integer, ForeignKey("questao.id"), nullable=False)
    texto_opcao = Column("texto_opcao", String(500), nullable=False)
    imagem_opcao_url = Column("imagem_opcao_url", String(500))
    correta = Column("correta", Integer, nullable=False)
    par_associacao_id = Column("par_associacao_id", Integer)
    ordem = Column("ordem", Integer, nullable=False)

    def __init__(self, texto_opcao, correta, par_associacao_id,ordem):
        self.texto_opcao = texto_opcao
        self.correta = correta
        self.par_associacao_id = par_associacao_id 
        self.ordem = ordem

