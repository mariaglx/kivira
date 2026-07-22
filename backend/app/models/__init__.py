#Importa todas as classes por meio dessa, para garantir os relacionamentos entre elas e acesso das classes

from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.aluno import Aluno
from app.models.turma import Turma

__all__ = ["Usuario", "Professor", "Aluno", "Turma"]