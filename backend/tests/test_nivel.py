# Curva de nível e desbloqueio de avatar por nível. SQLite em memória.
# Rodar de dentro de backend/: python -m unittest discover tests
import os

os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL_PROD"] = "sqlite://"

import unittest
from types import SimpleNamespace

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from dependecies import pegar_sessao_kivira
from main import app
from models.aluno import Aluno
from models.avatar import Avatar
from models.usuario import Usuario
from routes.auth import criar_token
from routes.avatar import niveis_dos_avatares
from services.sessao_jogo_service import nivel_por_xp

engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
SessaoTeste = sessionmaker(bind=engine)


def sessao_teste():
    session = SessaoTeste()
    try:
        yield session
    finally:
        session.close()


class TestCurvaDeNivel(unittest.TestCase):
    def test_cada_nivel_custa_mais(self):
        # 100 pro 2, +200 pro 3, +300 pro 4...
        self.assertEqual([nivel_por_xp(xp) for xp in (None, 0, 99, 100, 299, 300, 599, 600, 1000)], [1, 1, 1, 2, 2, 3, 3, 4, 5])

    def test_avatares_intercalam_categorias(self):
        avatares = [SimpleNamespace(id=i, arquivo=f"{cat}{i}.png", categoria=cat) for i, cat in enumerate("aaaaaaaaabbbbbbbbb")]
        niveis = niveis_dos_avatares(avatares)
        # 10 primeiros (5 de cada categoria) no nível 1, depois 4 por nível
        self.assertEqual(sum(1 for n in niveis.values() if n == 1), 10)
        self.assertEqual(sorted(niveis.values())[10:], [2, 2, 2, 2, 3, 3, 3, 3])
        self.assertEqual(niveis["a0.png"], 1)
        self.assertEqual(niveis["b9.png"], 1)


class TestTrocaDeAvatar(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tabelas = ["usuario", "avatar", "aluno", "log_auditoria"]
        Base.metadata.create_all(engine, tables=[Base.metadata.tables[t] for t in tabelas])
        app.dependency_overrides[pegar_sessao_kivira] = sessao_teste
        cls.client = TestClient(app)

        s = SessaoTeste()
        s.add_all([Avatar(f"Bicho {i}", f"bicho{i}.png", "animais") for i in range(12)])
        usuario = Usuario(senha_hash="x", tipo="estudante")
        s.add(usuario)
        s.flush()
        aluno = Aluno("Ana", None, None)
        aluno.usuario_id = usuario.id
        aluno.xp_total = 0
        s.add(aluno)
        s.commit()
        cls.aluno_id, cls.token = aluno.id, criar_token(usuario)
        s.close()

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def trocar(self, arquivo):
        return self.client.patch(f"/aluno/{self.aluno_id}", json={"avatar_url": arquivo}, headers={"Authorization": f"Bearer {self.token}"})

    def test_lista_informa_nivel_minimo(self):
        niveis = [a["nivel_minimo"] for a in self.client.get("/avatar/").json()]
        self.assertEqual(niveis, [1] * 10 + [2, 2])

    def test_nivel_1_nao_pega_bichinho_bloqueado(self):
        self.assertEqual(self.trocar("bicho0.png").status_code, 200)
        resposta = self.trocar("bicho11.png")
        self.assertEqual(resposta.status_code, 403)
        self.assertIn("nível 2", resposta.json()["detail"])
        self.assertEqual(self.trocar("nao-existe.png").status_code, 400)


if __name__ == "__main__":
    unittest.main()
