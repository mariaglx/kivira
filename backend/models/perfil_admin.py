# Perfil do admin: hoje só o avatar. Admin não tem linha em professor nem em
# aluno, então o bichinho dele mora aqui. Tabela nova: em produção, rodar
# criar_schema_producao.py de novo (create_all só cria as que faltam).

from sqlalchemy import Column, ForeignKey, Integer, String
from database import Base


class PerfilAdmin(Base):
    __tablename__ = "perfil_admin"

    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True)
    avatar_url = Column("avatar_url", String(100))
