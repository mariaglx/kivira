# É onde criamos as classes do nosso banco de dados

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, SmallInteger
from database import Base
from sqlalchemy import func


# Registra cada partida jogada (uma "virada de tabuleiro") — é o que faltava
# pra Historico.jsx parar de ser um placeholder e pro XP do aluno ter de onde
# vir. A tabela já existia no banco (criada fora do SQLAlchemy); esse model só
# espelha as colunas que já estão lá.
class SessaoJogo(Base):
    __tablename__ = "sessao_jogo"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    atividade_id = Column("atividade_id", Integer, ForeignKey("atividade.id", ondelete="CASCADE"), nullable=False)
    aluno_id = Column("aluno_id", Integer, ForeignKey("aluno.id", ondelete="CASCADE"), nullable=False)
    turma_id = Column("turma_id", Integer, ForeignKey("turma.id", ondelete="SET NULL"))
    status = Column("status", Enum("em_andamento", "concluido", "abandonado", name="status_sessao_enum"), default="em_andamento", nullable=False)
    pontuacao = Column("pontuacao", Integer, default=0, nullable=False)
    respostas_corretas = Column("respostas_corretas", SmallInteger, default=0, nullable=False)
    respostas_erradas = Column("respostas_erradas", SmallInteger, default=0, nullable=False)
    # Quantas vezes o aluno virou o tabuleiro pra conferir (ver `tentativas`
    # em useJogo.js) — é o que define a quantidade de estrelas ganhas.
    rodadas_conferencia = Column("rodadas_conferencia", SmallInteger, default=0, nullable=False)
    reinicios = Column("reinicios", SmallInteger, default=0, nullable=False)
    acertos_primeira = Column("acertos_primeira", SmallInteger, default=0, nullable=False)
    tempo_gasto_seg = Column("tempo_gasto_seg", SmallInteger)
    iniciado_em = Column("iniciado_em", DateTime, server_default=func.now(), nullable=False)
    finalizado_em = Column("finalizado_em", DateTime)
