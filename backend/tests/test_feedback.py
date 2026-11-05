# Resumo dos questionários de feedback (só o admin vê). SQLite em memória.
# Rodar de dentro de backend/: python -m unittest discover tests
import os

os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL_PROD"] = "sqlite://"

import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.mysql import YEAR
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from dependecies import pegar_sessao_kivira
from main import app
from models.aluno import Aluno
from models.aluno_turma import AlunoTurma
from models.feedback import Feedback
from models.feedback_aluno import FeedbackAluno
from models.professor import Professor
from models.turma import Turma
from models.usuario import Usuario
from routes.auth import criar_token

engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
SessaoTeste = sessionmaker(bind=engine)


@compiles(YEAR, "sqlite")
def _year_no_sqlite(tipo, compilador, **kw):
    return "INTEGER"


def sessao_teste():
    session = SessaoTeste()
    try:
        yield session
    finally:
        session.close()


class TestResumoFeedback(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tabelas = ["usuario", "avatar", "professor", "turma", "aluno", "aluno_turma", "feedback", "feedback_aluno"]
        Base.metadata.create_all(engine, tables=[Base.metadata.tables[t] for t in tabelas])
        app.dependency_overrides[pegar_sessao_kivira] = sessao_teste
        cls.client = TestClient(app)

        s = SessaoTeste()
        admin = Usuario(email="admin@k.com", senha_hash="x", tipo="admin")
        respondeu, nao_respondeu = (Usuario(email=f"{n}@k.com", senha_hash="x", tipo="professor") for n in ("p1", "p2"))
        alunos_usuarios = [Usuario(senha_hash="x", tipo="estudante") for _ in range(3)]
        s.add_all([admin, respondeu, nao_respondeu, *alunos_usuarios])
        s.flush()
        professores = []
        for u, nome in ((respondeu, "Maria Prof"), (nao_respondeu, "João Prof")):
            p = Professor(nome, nome.split()[0], None, None)
            p.usuario_id = u.id
            s.add(p)
            professores.append(p)
        s.flush()
        s.add(Feedback(usuario_id=respondeu.id, facilidade_uso=4, autonomia_aluno=5,
                       alinhamento_conteudo=3, usaria_nas_aulas=5, comentario="Gostei"))

        turma = Turma("3º A", "3º ano", 2026, None)
        turma.professor_id = professores[0].id
        turma.codigo_acesso = "ABC123"
        s.add(turma)
        alunos = []
        for u, nome in zip(alunos_usuarios, ("Ana", "Bia", "Caio")):
            a = Aluno(nome, None, None)
            a.usuario_id = u.id
            alunos.append(a)
        s.add_all(alunos)
        s.flush()
        for a in alunos:
            s.add(AlunoTurma(turma_id=turma.id, aluno_id=a.id))
        # Ana e Bia responderam; Caio não
        s.add(FeedbackAluno(usuario_id=alunos_usuarios[0].id, diversao=5, autonomia=3, jogar_de_novo=3))
        s.add(FeedbackAluno(usuario_id=alunos_usuarios[1].id, diversao=4, autonomia=2, jogar_de_novo=3))
        s.commit()

        cls.admin = {"Authorization": f"Bearer {criar_token(admin, extras={'mfa': True})}"}
        cls.professor = {"Authorization": f"Bearer {criar_token(respondeu)}"}
        s.close()

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_professor_nao_ve_as_respostas(self):
        self.assertEqual(self.client.get("/feedback/resumo", headers=self.professor).status_code, 403)

    def test_resumo_dos_professores(self):
        professores = self.client.get("/feedback/resumo", headers=self.admin).json()["professores"]
        self.assertEqual((professores["total"], professores["respostas"]), (2, 1))
        self.assertEqual(professores["distribuicao"]["facilidade_uso"], [0, 0, 0, 1, 0])
        self.assertEqual(professores["distribuicao"]["alinhamento_conteudo"], [0, 0, 1, 0, 0])
        comentario = professores["comentarios"][0]
        self.assertEqual((comentario["texto"], comentario["apelido"], comentario["nome_completo"]), ("Gostei", "Maria", "Maria Prof"))

    def test_resumo_dos_alunos(self):
        alunos = self.client.get("/feedback/resumo", headers=self.admin).json()["alunos"]
        self.assertEqual((alunos["total"], alunos["respostas"]), (3, 2))
        self.assertEqual(alunos["distribuicao"]["diversao"], [0, 0, 0, 1, 1])
        self.assertEqual(alunos["distribuicao"]["autonomia"], [0, 1, 1])
        self.assertEqual(alunos["por_turma"], [{"turma": "3º A", "total": 3, "respostas": 2}])


if __name__ == "__main__":
    unittest.main()
