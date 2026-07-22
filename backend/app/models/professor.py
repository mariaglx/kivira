from datetime import datetime

from sqlalchemy import ForeignKey, String, TIMESTAMP, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

#Espelha tabela professor, que já existe no bd

class Professor(Base):
    __tablename__ = "professor"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    nome_completo: Mapped[str] = mapped_column(String(255), nullable=False)
    apelido: Mapped[str | None] = mapped_column(String(50))
    escola: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    biografia: Mapped[str | None] = mapped_column(Text)
    data_criacao: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now()
    )
    data_ultima_atualizacao: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), server_onupdate=func.now()
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="professor")
    turmas: Mapped[list["Turma"]] = relationship(back_populates="professor", cascade="all, delete-orphan")