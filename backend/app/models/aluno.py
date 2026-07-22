from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, SmallInteger, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

#Espelha tabela aluno, que já existe no bd

class Aluno(Base):
    __tablename__ = "aluno"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    nome_completo: Mapped[str] = mapped_column(String(255), nullable=False)
    apelido: Mapped[str | None] = mapped_column(String(50))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    data_nascimento: Mapped[date | None] = mapped_column(Date)
    xp_total: Mapped[int] = mapped_column(default=0)
    nivel_atual: Mapped[int] = mapped_column(SmallInteger, default=1)
    data_criacao: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now()
    )
    data_ultima_atualizacao: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), server_onupdate=func.now()
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="aluno")