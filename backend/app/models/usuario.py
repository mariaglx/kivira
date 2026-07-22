import enum 
from datetime import datetime

from sqlalchemy import Enum, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

#Mapeando as tabelas do banco de dados | Como as tabelas são escritas no bd.


class TipoUsuario(str, enum.Enum):
    admin = "admin"
    professor = "professor"
    estudante = "estudante"

class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[TipoUsuario] = mapped_column(Enum(TipoUsuario), nullable=False, default=TipoUsuario.estudante)
    data_criacao: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    data_ultima_atualizacao: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    professor: Mapped["Professor"] = relationship(back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    aluno: Mapped["Aluno"] = relationship(back_populates = "usuario", cascade="all, delete-orphan", uselist=False)

