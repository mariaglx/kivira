# 2FA (TOTP, app autenticador) do admin. Tabela nova: em produção, rodar
# criar_schema_producao.py de novo (create_all só cria as que faltam).
# Admin perdeu o celular? Apagar a linha dele aqui e ele configura de novo
# no próximo login: DELETE FROM dois_fatores WHERE usuario_id = <id>;

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from database import Base


class DoisFatores(Base):
    __tablename__ = "dois_fatores"

    usuario_id = Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True)
    # ponytail: segredo em texto puro no banco (como em muitos apps); cifrar com uma chave do .env se o banco deixar de ser confiável
    segredo = Column("segredo", String(32), nullable=False)
    # Só vira True depois que o admin digita o 1º código certo (prova que escaneou o QR)
    ativo = Column("ativo", Boolean, nullable=False, default=False)
    # Último passo de 30s já usado: o mesmo código não serve duas vezes
    ultimo_passo = Column("ultimo_passo", Integer)
    falhas = Column("falhas", Integer, nullable=False, default=0)
    bloqueado_ate = Column("bloqueado_ate", DateTime)
