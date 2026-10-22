# Auditoria (login com IP, tentativas que falham, tela do admin) e o que o admin
# passou a poder fazer como professor. SQLite em memória.
# Rodar de dentro de backend/: python -m unittest discover tests
import os

os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL_PROD"] = "sqlite://"

import unittest

import bcrypt
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


class TestAuditoria(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tabelas = ["usuario", "avatar", "professor", "turma", "aluno", "aluno_turma", "atividade", "log_auditoria", "perfil_admin"]
        Base.metadata.create_all(engine, tables=[Base.metadata.tables[t] for t in tabelas])
        app.dependency_overrides[pegar_sessao_kivira] = sessao_teste
        cls.client = TestClient(app)

        senha = bcrypt.hashpw(b"senha123", bcrypt.gensalt()).decode()
        s = SessaoTeste()
        admin = Usuario(email="admin@k.com", senha_hash=senha, tipo="admin")
        prof_usuario = Usuario(email="prof@k.com", senha_hash=senha, tipo="professor")
        outro_usuario = Usuario(email="outro@k.com", senha_hash=senha, tipo="professor")
        aluno_usuario = Usuario(senha_hash=senha, tipo="estudante")
        s.add_all([admin, prof_usuario, outro_usuario, aluno_usuario])
        s.flush()
        professores = []
        for u, nome in ((prof_usuario, "Maria Prof"), (outro_usuario, "João Prof")):
            p = Professor(nome, None, None, None)
            p.usuario_id = u.id
            s.add(p)
            professores.append(p)
        s.flush()
        turma = Turma("3º A", "3º ano", 2026, None)
        turma.professor_id = professores[0].id
        turma.codigo_acesso = "ABC123"
        s.add(turma)
        aluno = Aluno("Ana Souza", "Ana", None)
        aluno.usuario_id = aluno_usuario.id
        aluno.username = "ana.souza"
        s.add(aluno)
        s.flush()
        s.add(AlunoTurma(turma_id=turma.id, aluno_id=aluno.id))
        s.commit()
        cls.aluno_id, cls.turma_id = aluno.id, turma.id
        cls.admin = {"Authorization": f"Bearer {criar_token(admin)}"}
        cls.outro_prof = {"Authorization": f"Bearer {criar_token(outro_usuario)}"}
        s.close()

        # Aluna entra de um celular; alguém erra a senha dela 3 vezes e tenta um login que não existe
        celular = {"X-Forwarded-For": "200.1.2.3, 10.0.0.1", "User-Agent": "Mozilla/5.0 (iPhone)"}
        cls.client.post("/auth_kivira/login_aluno", json={"username": "ana.souza", "senha": "senha123"}, headers=celular)
        for _ in range(3):
            cls.client.post("/auth_kivira/login_aluno", json={"username": "ana.souza", "senha": "chute"})
        cls.client.post("/auth_kivira/login", json={"email": "ninguem@k.com", "senha": "x"})

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def logs(self, **filtros):
        return self.client.get("/admin/logs-auditoria", params=filtros, headers=self.admin).json()

    def test_login_registra_quem_e_de_onde(self):
        login = self.logs(acao="LOGIN")["itens"][0]
        self.assertEqual(login["usuario"], {"nome": "Ana Souza", "identificador": "ana.souza", "turmas": ["3º A"], "aluno_id": self.aluno_id})
        self.assertEqual(login["detalhes"]["ip"], "200.1.2.3")
        self.assertEqual(login["detalhes"]["navegador"], "Mozilla/5.0 (iPhone)")
        self.assertTrue(login["data_criacao"].endswith("Z"))

    def test_tentativas_que_falham_viram_log(self):
        falhas = self.logs(acao="LOGIN_FALHOU")
        self.assertEqual(falhas["total"], 4)
        motivos = sorted(f["detalhes"]["motivo"] for f in falhas["itens"])
        self.assertEqual(motivos, ["senha_incorreta"] * 3 + ["usuario_inexistente"])
        desconhecido = next(f for f in falhas["itens"] if f["usuario"] is None)
        self.assertEqual(desconhecido["detalhes"]["identificador"], "ninguem@k.com")

    def test_busca_pelo_nome_da_crianca(self):
        self.assertEqual(self.logs(busca="souza")["total"], 4)  # 1 login + 3 senhas erradas
        self.assertEqual(self.logs(busca="ninguem")["total"], 1)

    def test_resumo_aponta_login_suspeito(self):
        resumo = self.client.get("/admin/logs-auditoria/resumo", headers=self.admin).json()
        self.assertEqual((resumo["acessos"], resumo["alunos"], resumo["falhas"]), (1, 1, 4))
        self.assertEqual(resumo["suspeitos"], [{"identificador": "ana.souza", "tentativas": 3}])

    def test_professor_nao_ve_auditoria(self):
        self.assertEqual(self.client.get("/admin/logs-auditoria", headers=self.outro_prof).status_code, 403)

    def test_admin_ve_turmas_de_todos_com_o_professor(self):
        turmas = self.client.get("/turma/", headers=self.admin).json()
        self.assertEqual([(t["nome"], t["professor_nome"]) for t in turmas], [("3º A", "Maria Prof")])
        self.assertEqual(self.client.get("/professor/dashboard/resumo", headers=self.admin).status_code, 200)

    def test_professor_nao_reseta_senha_de_aluno_de_outro(self):
        resposta = self.client.patch(f"/aluno/{self.aluno_id}/resetar_senha", headers=self.outro_prof)
        self.assertEqual(resposta.status_code, 401)
        self.assertEqual(self.client.patch(f"/aluno/{self.aluno_id}/resetar_senha", headers=self.admin).status_code, 200)


    def test_ver_como_aluno_e_so_leitura(self):
        resposta = self.client.post(f"/admin/alunos/{self.aluno_id}/ver_como", headers=self.admin)
        self.assertEqual(resposta.status_code, 200)
        como_aluno = {"Authorization": f"Bearer {resposta.json()['access_token']}"}
        self.assertEqual(self.client.get("/aluno/me", headers=como_aluno).json()["username"], "ana.souza")
        # não altera nada pela conta da criança
        self.assertEqual(self.client.patch(f"/aluno/{self.aluno_id}", json={"apelido": "x"}, headers=como_aluno).status_code, 403)
        self.assertEqual(self.logs(acao="VER_COMO_ALUNO")["total"], 1)
        # professor não consegue
        self.assertEqual(self.client.post(f"/admin/alunos/{self.aluno_id}/ver_como", headers=self.outro_prof).status_code, 403)

    def test_admin_escolhe_qualquer_avatar(self):
        from models.avatar import Avatar
        s = SessaoTeste()
        s.add_all([Avatar(f"Bicho {i}", f"bicho{i}.png", "animais") for i in range(12)])
        s.commit()
        s.close()
        # bicho11 é de nível 2 — aluno nível 1 não pega, admin pega
        self.assertEqual(self.client.patch("/admin/me", json={"avatar_url": "bicho11.png"}, headers=self.admin).status_code, 200)
        self.assertEqual(self.client.get("/admin/me", headers=self.admin).json()["avatar_url"], "bicho11.png")
        self.assertEqual(self.client.patch("/admin/me", json={"avatar_url": "nao-existe.png"}, headers=self.admin).status_code, 400)


if __name__ == "__main__":
    unittest.main()
