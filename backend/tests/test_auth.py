# Testes do login: rodam num SQLite em memória, sem tocar no banco do Aiven.
# Rodar de dentro de backend/: python -m unittest discover tests
import os

# Precisa vir antes de importar o app: database.py cria o engine na importação.
os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL_PROD"] = "sqlite://"

import unittest
from datetime import datetime, timezone

import bcrypt
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.config import SECRET_KEY, ALGORITHM
from database import Base
from dependecies import pegar_sessao_kivira
from main import app
from models.aluno import Aluno
from models.usuario import Usuario

engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
SessaoTeste = sessionmaker(bind=engine)


def sessao_teste():
    session = SessaoTeste()
    try:
        yield session
    finally:
        session.close()


def horas_de_validade(token):
    exp = jwt.decode(token, SECRET_KEY, ALGORITHM)["exp"]
    return (datetime.fromtimestamp(exp, timezone.utc) - datetime.now(timezone.utc)).total_seconds() / 3600


class TestLogin(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Só as tabelas do login: outras usam tipos exclusivos do MySQL (YEAR).
        tabelas = ["usuario", "aluno", "log_auditoria"]
        Base.metadata.create_all(engine, tables=[Base.metadata.tables[t] for t in tabelas])
        app.dependency_overrides[pegar_sessao_kivira] = sessao_teste
        cls.client = TestClient(app)

        senha = bcrypt.hashpw(b"senha123", bcrypt.gensalt()).decode()
        session = SessaoTeste()
        session.add(Usuario(email="prof@kivira.com", senha_hash=senha, tipo="professor"))
        aluno_usuario = Usuario(senha_hash=senha, tipo="estudante")
        session.add(aluno_usuario)
        session.flush()
        aluno = Aluno(nome_completo="Aluno Teste", apelido="teste", data_nascimento=None)
        aluno.usuario_id = aluno_usuario.id
        aluno.username = "aluno.teste"
        session.add(aluno)
        session.commit()
        session.close()

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_login_professor_dura_24h(self):
        resposta = self.client.post("/auth_kivira/login", json={"email": "prof@kivira.com", "senha": "senha123"})
        self.assertEqual(resposta.status_code, 200)
        dados = resposta.json()
        self.assertNotIn("refresh_token", dados)
        self.assertEqual(dados["tipo_usuario"], "professor")
        self.assertAlmostEqual(horas_de_validade(dados["access_token"]), 24, delta=0.1)

    def test_login_aluno_dura_4h(self):
        resposta = self.client.post("/auth_kivira/login_aluno", json={"username": "aluno.teste", "senha": "senha123"})
        self.assertEqual(resposta.status_code, 200)
        dados = resposta.json()
        self.assertNotIn("refresh_token", dados)
        self.assertAlmostEqual(horas_de_validade(dados["access_token"]), 4, delta=0.1)

    def test_senha_errada_nao_loga(self):
        resposta = self.client.post("/auth_kivira/login", json={"email": "prof@kivira.com", "senha": "errada"})
        self.assertEqual(resposta.status_code, 400)

    def test_token_libera_rota_protegida(self):
        token = self.client.post("/auth_kivira/login", json={"email": "prof@kivira.com", "senha": "senha123"}).json()["access_token"]
        self.assertEqual(self.client.post("/auth_kivira/logout").status_code, 401)
        resposta = self.client.post("/auth_kivira/logout", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resposta.status_code, 200)


if __name__ == "__main__":
    unittest.main()
