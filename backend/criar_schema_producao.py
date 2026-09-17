# Cria as tabelas em um banco de produção vazio, a partir dos models
# SQLAlchemy — não migra nenhum dado do banco de teste.
#
# Uso (rodar de dentro de backend/, com o venv ativado):
#   python criar_schema_producao.py
#
# Lê DATABASE_URL_PROD do .env; se quiser apontar pra outro banco sem
# mexer no .env, passe a URL como argumento:
#   python criar_schema_producao.py mysql+pymysql://usuario:senha@host:3306/banco

import sys

from sqlalchemy import create_engine

from database import Base
from core.config import DATABASE_URL_PROD

# Importar os módulos dos models registra as tabelas em Base.metadata
from models import (
    usuario,
    professor,
    aluno,
    atividade,
    turma,
    questao,
    opcao_questao,
    aluno_turma,
    avatar,
    log_auditoria,
)


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DATABASE_URL_PROD
    if not url:
        print("Defina DATABASE_URL_PROD no .env ou passe a URL como argumento.")
        sys.exit(1)

    engine = create_engine(
        url,
        connect_args={"ssl": {"check_hostname": False, "verify_mode": False}},
    )
    Base.metadata.create_all(bind=engine)
    print(f"Schema criado com sucesso em: ...@{url.split('@')[-1]}")


if __name__ == "__main__":
    main()
