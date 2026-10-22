# Recalcula aluno.nivel_atual de todo mundo pela curva nova de nível
# (services/sessao_jogo_service.py: nivel_por_xp). Rodar UMA vez depois do deploy
# da curva nova — antes dela era 1 nível a cada 100 XP, então o nível salvo dos
# alunos que já jogaram está maior do que deveria. O XP não muda.
#
# Uso (de dentro de backend/, com o venv ativado e o .env apontando pro banco):
#   python recalcular_niveis.py

from database import sessao_local
from models import usuario  # noqa: F401 — registra a tabela da FK de aluno
from models.aluno import Aluno
from services.sessao_jogo_service import nivel_por_xp


def main():
    session = sessao_local()
    alterados = 0
    for aluno in session.query(Aluno).all():
        nivel = nivel_por_xp(aluno.xp_total)
        if aluno.nivel_atual != nivel:
            aluno.nivel_atual = nivel
            alterados += 1
    session.commit()
    session.close()
    print(f"{alterados} aluno(s) com nível atualizado.")


if __name__ == "__main__":
    main()
