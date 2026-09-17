# Copia os dados da tabela `avatar` do banco de teste pro de produção.
#
# `avatar` é dado de referência (lista fixa de avatares disponíveis pra
# professor/aluno escolher), não dado de usuário — por isso, diferente de
# professor/aluno/turma etc., ela precisa ser migrada junto com o schema.
# `criar_schema_producao.py` só cria as tabelas vazias, então essa tabela
# fica sem linhas no banco novo até rodar este script.
#
# Uso (de dentro de backend/, com o venv ativado):
#   python copiar_avatares.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.config import DATABASE_URL_TEST, DATABASE_URL_PROD

# Precisa importar todos os models, não só Avatar: o relationship
# Avatar.professores referencia "Professor" pelo nome, e o SQLAlchemy só
# resolve essa string se a classe já estiver registrada no mesmo Base.
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
from models.avatar import Avatar

SSL_ARGS = {"ssl": {"check_hostname": False, "verify_mode": False}}


def main():
    if not DATABASE_URL_TEST or not DATABASE_URL_PROD:
        print("Defina DATABASE_URL_TEST e DATABASE_URL_PROD no .env.")
        return

    engine_teste = create_engine(DATABASE_URL_TEST, connect_args=SSL_ARGS)
    engine_prod = create_engine(DATABASE_URL_PROD, connect_args=SSL_ARGS)

    session_teste = sessionmaker(bind=engine_teste)()
    session_prod = sessionmaker(bind=engine_prod)()

    avatares_teste = session_teste.query(Avatar).all()
    if not avatares_teste:
        print("Nenhum avatar encontrado no banco de teste.")
        return

    ja_existentes = {arquivo for (arquivo,) in session_prod.query(Avatar.arquivo).all()}

    novos = 0
    for avatar in avatares_teste:
        if avatar.arquivo in ja_existentes:
            continue
        copia = Avatar(nome=avatar.nome, arquivo=avatar.arquivo, categoria=avatar.categoria)
        copia.ativo = avatar.ativo
        session_prod.add(copia)
        novos += 1

    session_prod.commit()
    print(f"{novos} avatar(es) copiados para produção (de {len(avatares_teste)} no banco de teste).")

    session_teste.close()
    session_prod.close()


if __name__ == "__main__":
    main()
