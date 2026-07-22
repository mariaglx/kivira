from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, TIMESTAMP, Text, func
from sqlalchemy.dialects.mysql import YEAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Espelha tabela turma, que já existe no bd


class Turma(Base):
    __tablename__ = "turma"

    id: Mapped[int] = mapped_column(primary_key=True)
    professor_id: Mapped[int] = mapped_column(
        ForeignKey("professor.id", ondelete="CASCADE"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    ano_escolar: Mapped[str] = mapped_column(String(50), nullable=False)
    ano_letivo: Mapped[int] = mapped_column(YEAR, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    codigo_acesso: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    data_criacao: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now()
    )
    data_ultima_atualizacao: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), server_onupdate=func.now()
    )

    professor: Mapped["Professor"] = relationship(back_populates="turmas")