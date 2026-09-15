# É onde criamos as classes do nosso banco de dados

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Enum
from sqlalchemy.dialects.mysql import INTEGER as MysqlInteger
from database import Base
from sqlalchemy import func


class LogAuditoria(Base):
    __tablename__ = "log_auditoria"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    # unsigned pra bater com usuario.id, que no banco é INTEGER UNSIGNED
    # (o model Usuario não declara isso, mas o schema real no Aiven é assim)
    #
    # ondelete="SET NULL" (+ nullable) de propósito: se o usuário for excluído depois,
    # o log tem que sobreviver — é exatamente o registro que auditoria existe pra
    # preservar. CASCADE apagaria a prova de uma ação só porque a conta sumiu, e
    # RESTRICT (o padrão) impede excluir QUALQUER usuário que já tenha feito algo
    # logado, quebrando as rotas DELETE /professor e /aluno existentes.
    usuario_id = Column("usuario_id", ForeignKey("usuario.id", ondelete="SET NULL"), nullable=True)
    # Papel do usuário no momento da ação (não o papel atual dele) — se o usuário
    # mudar de papel ou for removido depois, o log continua contando a história certa.
    papel_usuario = Column("papel_usuario", Enum("admin", "professor", "estudante", name="tipo_usuario_enum"), nullable=False)
    acao = Column("acao", String(100), nullable=False)
    entidade = Column("entidade", String(100), nullable=False)
    entidade_id = Column("entidade_id", Integer, nullable=True)
    detalhes = Column("detalhes", Text, nullable=True)
    data_criacao = Column("data_criacao", DateTime, server_default=func.now())
