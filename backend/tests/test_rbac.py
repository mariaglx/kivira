# 2FA do admin, promoção a admin, "ver como professor" e o que cada papel NÃO
# pode acessar. SQLite em memória.
# Rodar de dentro de backend/: python -m unittest discover tests
import os

os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL_PROD"] = "sqlite://"

import time
import unittest

import bcrypt
import pyotp
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
from models.atividade import Atividade
from models.dois_fatores import DoisFatores
from models.opcao_questao import OpcaoQuestao
from models.professor import Professor
from models.questao import Questao
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


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


class TestRbac(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tabelas = ["usuario", "avatar", "professor", "turma", "aluno", "aluno_turma", "atividade",
                   "questao", "opcao_questao", "log_auditoria", "perfil_admin", "dois_fatores", "feedback", "feedback_aluno", "sessao_jogo"]
        Base.metadata.create_all(engine, tables=[Base.metadata.tables[t] for t in tabelas])
        app.dependency_overrides[pegar_sessao_kivira] = sessao_teste
        cls.client = TestClient(app)

        senha = bcrypt.hashpw(b"senha123", bcrypt.gensalt()).decode()
        s = SessaoTeste()
        usuarios = {
            nome: Usuario(email=None if tipo == "estudante" else f"{nome}@k.com", senha_hash=senha, tipo=tipo)
            for nome, tipo in (("admin", "admin"), ("novo_admin", "admin"), ("travado", "admin"),
                               ("prof", "professor"), ("outro", "professor"), ("prof3", "professor"),
                               ("aluno", "estudante"), ("aluno2", "estudante"), ("aluno3", "estudante"))
        }
        s.add_all(usuarios.values())
        s.flush()
        prof = Professor("Maria Prof", None, None, None)
        prof.usuario_id = usuarios["prof"].id
        outro = Professor("João Prof", None, None, None)
        outro.usuario_id = usuarios["outro"].id
        prof3 = Professor("Lia Prof", None, None, None)
        prof3.usuario_id = usuarios["prof3"].id
        s.add_all([prof, outro, prof3])
        s.flush()
        turma = Turma("3º A", "3º ano", 2026, None)
        turma.professor_id, turma.codigo_acesso = prof.id, "ABC123"
        atividade = Atividade("Somas", "multipla_escolha", None, None)
        atividade.professor_id = prof.id
        s.add_all([turma, atividade])
        s.flush()
        questao = Questao("1+1?", 1, 10, None, None, "multipla_escolha")
        questao.atividade_id = atividade.id
        s.add(questao)
        s.flush()
        opcao = OpcaoQuestao("2", 1, None, 1)
        opcao.questao_id = questao.id
        s.add(opcao)
        alunos = []
        for chave, username in (("aluno", "ana"), ("aluno2", "bia"), ("aluno3", "cia")):
            a = Aluno(username, None, None)
            a.usuario_id, a.username = usuarios[chave].id, username
            s.add(a)
            alunos.append(a)
        s.flush()
        # "cia" é da turma da Maria Prof (é quem a gente desativa nos testes)
        s.add(AlunoTurma(turma_id=turma.id, aluno_id=alunos[2].id))
        # "admin" e "travado" já com 2FA ativo; "novo_admin" ainda vai configurar
        cls.segredo = pyotp.random_base32()
        s.add(DoisFatores(usuario_id=usuarios["admin"].id, segredo=cls.segredo, ativo=True, falhas=0))
        s.add(DoisFatores(usuario_id=usuarios["travado"].id, segredo=pyotp.random_base32(), ativo=True, falhas=0))
        s.commit()

        cls.ids = {k: u.id for k, u in usuarios.items()}
        cls.prof_id, cls.opcao_id, cls.questao_id, cls.turma_id = prof.id, opcao.id, questao.id, turma.id
        cls.aluno_id, cls.aluno2_id, cls.aluno3_id = alunos[0].id, alunos[1].id, alunos[2].id
        cls.prof3_id = prof3.id
        cls.atividade_id = atividade.id
        cls.prof3 = bearer(criar_token(usuarios["prof3"]))
        cls.admin = bearer(criar_token(usuarios["admin"], extras={"mfa": True}))
        cls.admin_sem_mfa = bearer(criar_token(usuarios["admin"]))
        cls.prof = bearer(criar_token(usuarios["prof"]))
        cls.outro = bearer(criar_token(usuarios["outro"]))
        cls.aluno = bearer(criar_token(usuarios["aluno"]))
        s.close()

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def login(self, email):
        return self.client.post("/auth_kivira/login", json={"email": email, "senha": "senha123"}).json()

    # --- 2FA ---

    def test_admin_configura_2fa_no_primeiro_login(self):
        dados = self.login("novo_admin@k.com")
        self.assertTrue(dados["requer_2fa"])
        self.assertFalse(dados["configurado"])
        self.assertNotIn("access_token", dados)
        meio = bearer(dados["token_2fa"])
        # token de meio de login não abre nada além do 2FA
        self.assertEqual(self.client.get("/admin/usuarios", headers=meio).status_code, 401)

        config = self.client.post("/auth_kivira/2fa/configurar", headers=meio).json()
        self.assertTrue(config["qr_code"].startswith("data:image/svg+xml"))
        self.assertEqual(self.client.post("/auth_kivira/2fa/verificar", json={"codigo": "000000"}, headers=meio).status_code, 400)

        codigo = pyotp.TOTP(config["segredo"]).now()
        resposta = self.client.post("/auth_kivira/2fa/verificar", json={"codigo": codigo}, headers=meio)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(self.client.get("/admin/usuarios", headers=bearer(resposta.json()["access_token"])).status_code, 200)

        # já ativo: a senha sozinha não troca o 2FA, e o mesmo código não vale de novo
        meio = bearer(self.login("novo_admin@k.com")["token_2fa"])
        self.assertEqual(self.client.post("/auth_kivira/2fa/configurar", headers=meio).status_code, 400)
        repetido = self.client.post("/auth_kivira/2fa/verificar", json={"codigo": codigo}, headers=meio)
        self.assertEqual(repetido.status_code, 400)
        self.assertIn("já foi usado", repetido.json()["detail"])

    def test_token_de_admin_sem_2fa_e_recusado(self):
        self.assertEqual(self.client.get("/admin/usuarios", headers=self.admin_sem_mfa).status_code, 401)
        self.assertEqual(self.client.get("/turma/", headers=self.admin_sem_mfa).status_code, 401)

    def test_cinco_codigos_errados_bloqueiam(self):
        meio = bearer(self.login("travado@k.com")["token_2fa"])
        for _ in range(5):
            self.assertEqual(self.client.post("/auth_kivira/2fa/verificar", json={"codigo": "000000"}, headers=meio).status_code, 400)
        self.assertEqual(self.client.post("/auth_kivira/2fa/verificar", json={"codigo": "000000"}, headers=meio).status_code, 429)

    def test_swagger_de_admin_pede_codigo(self):
        # outro teste pode já ter gasto um código deste admin (anti-reuso): zera
        s = SessaoTeste()
        s.get(DoisFatores, self.ids["admin"]).ultimo_passo = None
        s.commit()
        s.close()
        form = {"username": "admin@k.com", "password": "senha123"}
        self.assertEqual(self.client.post("/auth_kivira/login_form", data=form).status_code, 400)
        codigo = pyotp.TOTP(self.segredo).at(time.time() - 30)
        self.assertEqual(self.client.post("/auth_kivira/login_form", data={**form, "client_secret": codigo}).status_code, 200)

    # --- promoção ---

    def test_so_professor_vira_admin_e_com_codigo(self):
        url = "/admin/usuarios/{}/promover-admin"
        codigo = pyotp.TOTP(self.segredo).at(time.time() + 30)
        self.assertEqual(self.client.post(url.format(self.ids["aluno2"]), json={"codigo": codigo}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.post(url.format(self.ids["outro"]), json={"codigo": "000000"}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.post(url.format(self.ids["outro"]), json={"codigo": codigo}, headers=self.admin).status_code, 200)

    # --- ver como professor ---

    def test_ver_como_professor_e_so_leitura(self):
        resposta = self.client.post(f"/admin/professores/{self.prof_id}/ver_como", headers=self.admin)
        self.assertEqual(resposta.status_code, 200)
        como_prof = bearer(resposta.json()["access_token"])
        self.assertEqual(self.client.get("/turma/", headers=como_prof).status_code, 200)
        criar = self.client.post("/turma/criar", json={"nome": "X", "ano_escolar": "1", "ano_letivo": 2026}, headers=como_prof)
        self.assertEqual(criar.status_code, 403)
        self.assertEqual(self.client.post(f"/admin/professores/{self.prof_id}/ver_como", headers=self.prof).status_code, 403)

    # --- o que cada papel não acessa ---

    def test_aluno_fora_das_rotas_de_professor(self):
        for url in (
            "/turma/",
            f"/opcao_questao/{self.opcao_id}",  # devolvia o gabarito ("correta")
            f"/questao/{self.questao_id}",
            f"/aluno/{self.aluno2_id}",
            f"/professor/{self.prof_id}",
            "/aluno/professor/meus?busca=a",
            "/admin/usuarios",
        ):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url, headers=self.aluno).status_code, 403)
        self.assertEqual(self.client.post("/aluno/cadastrar", json={"nome_completo": "X"}, headers=self.aluno).status_code, 403)
        self.assertEqual(self.client.get(f"/aluno/{self.aluno_id}", headers=self.aluno).status_code, 200)

    # --- desativar em vez de apagar ---

    def test_conta_nao_e_apagada(self):
        self.assertEqual(self.client.delete(f"/aluno/{self.aluno3_id}", headers=self.admin).status_code, 405)
        self.assertEqual(self.client.delete(f"/professor/{self.prof3_id}", headers=self.admin).status_code, 405)

    def test_turma_nao_e_apagada(self):
        self.assertEqual(self.client.delete(f"/turma/{self.turma_id}", headers=self.admin).status_code, 405)

    def test_professor_desativa_e_reativa_aluno_da_turma(self):
        url = f"/aluno/{self.aluno3_id}/ativo"
        login = {"username": "cia", "senha": "senha123"}
        token_antigo = bearer(self.client.post("/auth_kivira/login_aluno", json=login).json()["access_token"])

        self.assertEqual(self.client.patch(url, json={"ativo": False}, headers=self.outro).status_code, 403)
        self.assertEqual(self.client.patch(url, json={"ativo": False}, headers=self.aluno).status_code, 403)
        self.assertEqual(self.client.patch(url, json={"ativo": False}, headers=self.prof).status_code, 200)
        # não entra mais e o token que já tinha cai na hora
        self.assertEqual(self.client.post("/auth_kivira/login_aluno", json=login).status_code, 403)
        self.assertEqual(self.client.get("/aluno/me", headers=token_antigo).status_code, 401)
        lista = self.client.get(f"/aluno_turma/turma/{self.turma_id}", headers=self.prof).json()
        self.assertFalse(next(a for a in lista if a["aluno_id"] == self.aluno3_id)["conta_ativa"])

        self.assertEqual(self.client.patch(url, json={"ativo": True}, headers=self.admin).status_code, 200)
        self.assertEqual(self.client.post("/auth_kivira/login_aluno", json=login).status_code, 200)

    def test_professor_desativa_a_si_mesmo_e_so_admin_reativa(self):
        url = f"/professor/{self.prof3_id}/ativo"
        self.assertEqual(self.client.patch(url, json={"ativo": False}, headers=self.prof).status_code, 403)
        self.assertEqual(self.client.patch(url, json={"ativo": False}, headers=self.prof3).status_code, 200)
        self.assertEqual(self.client.get("/professor/me", headers=self.prof3).status_code, 401)
        self.assertEqual(self.client.post("/auth_kivira/login", json={"email": "prof3@k.com", "senha": "senha123"}).status_code, 403)
        self.assertEqual(self.client.patch(url, json={"ativo": True}, headers=self.admin).status_code, 200)
        self.assertEqual(self.client.get("/professor/me", headers=self.prof3).status_code, 200)

    def test_editar_atividade_tira_a_turma_so_com_null_explicito(self):
        url = f"/atividade/{self.atividade_id}"
        def turma_atual():
            return self.client.get(url, headers=self.prof).json()["turma_id"]

        self.assertEqual(self.client.patch(url, json={"turma_id": self.turma_id}, headers=self.prof).status_code, 200)
        self.assertEqual(turma_atual(), self.turma_id)
        # Campo ausente não mexe na turma
        self.client.patch(url, json={"titulo": "Somas"}, headers=self.prof)
        self.assertEqual(turma_atual(), self.turma_id)
        # null explícito = "Nenhuma (opcional)" no select da tela
        self.client.patch(url, json={"turma_id": None}, headers=self.prof)
        self.assertIsNone(turma_atual())

    def test_professor_nao_ve_questao_de_outro(self):
        self.assertEqual(self.client.get(f"/opcao_questao/{self.opcao_id}", headers=self.outro).status_code, 403)
        self.assertEqual(self.client.get(f"/opcao_questao/{self.opcao_id}", headers=self.prof).status_code, 200)


if __name__ == "__main__":
    unittest.main()
