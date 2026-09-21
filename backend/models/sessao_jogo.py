# É onde criamos as classes do nosso banco de dados

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Enum
from database import Base
from sqlalchemy import func

# Registra uma partida do aluno numa atividade (estilo LUK): a sessão nasce quando
# o tabuleiro abre, é atualizada a cada "Virar o Tabuleiro" e fecha quando o aluno
# acerta tudo (concluido) ou desiste (abandonado). Os totais gravados são uma
# fotografia do momento do jogo — não mudam se a atividade for editada depois.
class SessaoJogo(Base):
    __tablename__ = "sessao_jogo"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    atividade_id = Column("atividade_id", Integer, ForeignKey("atividade.id"), nullable=False)
    aluno_id = Column("aluno_id", Integer, ForeignKey("aluno.id"), nullable=False)
    # Snapshot da turma no momento da partida (a atividade pode trocar de turma depois,
    # o histórico não deve mudar junto)
    turma_id = Column("turma_id", Integer, ForeignKey("turma.id"))
    status = Column("status", Enum("em_andamento", "concluido", "abandonado", name="status_sessao_enum"), nullable=False, default="em_andamento")
    pontuacao = Column("pontuacao", Integer, nullable=False, default=0)  # XP ganho na sessão
    respostas_corretas = Column("respostas_corretas", Integer, nullable=False, default=0)
    respostas_erradas = Column("respostas_erradas", Integer, nullable=False, default=0)
    rodadas_conferencia = Column("rodadas_conferencia", Integer, nullable=False, default=0)
    reinicios = Column("reinicios", Integer, nullable=False, default=0)
    acertos_primeira = Column("acertos_primeira", Integer, nullable=False, default=0)
    tempo_gasto_seg = Column("tempo_gasto_seg", Integer)
    iniciado_em = Column("iniciado_em", DateTime, server_default=func.now())
    finalizado_em = Column("finalizado_em", DateTime)

    def __init__(self, atividade_id, aluno_id, turma_id):
        self.atividade_id = atividade_id
        self.aluno_id = aluno_id
        self.turma_id = turma_id
