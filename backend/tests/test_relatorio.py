# Testes do relatório da atividade: SQLite em memória, mesmo esquema do test_auth.
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
from routes.auth import criar_token
from models.usuario import Usuario
from models.professor import Professor
from models.aluno import Aluno
from models.aluno_turma import AlunoTurma
from models.atividade import Atividade
from models.turma import Turma
from models.questao import Questao
from models.sessao_jogo import SessaoJogo
from models.sessao_jogo_questao import SessaoJogoQuestao

engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
SessaoTeste = sessionmaker(bind=engine)


# turma.ano_letivo é YEAR (só MySQL); no SQLite vira INTEGER
@compiles(YEAR, "sqlite")
def _year_no_sqlite(tipo, compilador, **kw):
    return "INTEGER"


def sessao_teste():
    session = SessaoTeste()
    try:
        yield session
    finally:
        session.close()


class TestRelatorioAtividade(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tabelas = ["usuario", "avatar", "professor", "turma", "aluno", "aluno_turma", "atividade",
                   "questao", "sessao_jogo", "sessao_jogo_questao"]
        Base.metadata.create_all(engine, tables=[Base.metadata.tables[t] for t in tabelas])
        app.dependency_overrides[pegar_sessao_kivira] = sessao_teste
        cls.client = TestClient(app)

        s = SessaoTeste()
        dono, outro = Usuario(email="dono@k.com", senha_hash="x", tipo="professor"), Usuario(email="outro@k.com", senha_hash="x", tipo="professor")
        s.add_all([dono, outro])
        s.flush()
        for u in (dono, outro):
            p = Professor("Prof", None, None, None)
            p.usuario_id = u.id
            s.add(p)
        s.flush()
        cls.token_dono, cls.token_outro = criar_token(dono), criar_token(outro)

        professor_dono = s.query(Professor).filter(Professor.usuario_id == dono.id).one()
        turma = Turma("3º A", "3º ano", 2026, None)
        turma.professor_id = professor_dono.id
        turma.codigo_acesso = "ABC123"
        s.add(turma)
        s.flush()

        atividade = Atividade("Frações", "arrastar_soltar", None, "Matemática")
        atividade.professor_id = professor_dono.id
        atividade.turma_id = turma.id
        s.add(atividade)
        s.flush()
        cls.atividade_id = atividade.id
        cls.turma_id = turma.id
        q1, q2 = Questao("1/2", 1, 10, None, None), Questao("3/4", 2, 10, None, None)
        q1.atividade_id = q2.atividade_id = atividade.id
        s.add_all([q1, q2])

        alunos = [Aluno(nome, None, None) for nome in ("Ana", "Bia", "Caio")]
        s.add_all(alunos)
        s.flush()
        for a in alunos:
            s.add(AlunoTurma(turma_id=turma.id, aluno_id=a.id))
        ana, bia, _caio = alunos
        cls.ana_id, cls.bia_id = ana.id, bia.id

        def sessao(aluno, status, acertos, tempo, reinicios, respostas):
            sj = SessaoJogo(atividade_id=atividade.id, aluno_id=aluno.id, turma_id=turma.id, status=status,
                            acertos_primeira=acertos, tempo_gasto_seg=tempo, reinicios=reinicios)
            s.add(sj)
            s.flush()
            for questao, acertou in respostas:
                linha = SessaoJogoQuestao(sj.id, questao.id)
                linha.acertou_primeira = acertou
                s.add(linha)

        # Ana conclui de primeira errando q2; o replay (tudo certo) não pode contar
        sessao(ana, "concluido", 1, 60, 0, [(q1, True), (q2, False)])
        sessao(ana, "concluido", 2, 20, 0, [(q1, True), (q2, True)])
        # Bia abandona errando as duas, depois conclui
        sessao(bia, "abandonado", 0, 30, 0, [(q1, False), (q2, False)])
        sessao(bia, "concluido", 2, 100, 2, [(q1, True), (q2, True)])
        s.commit()
        s.close()

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def relatorio(self, token):
        return self.client.get(f"/atividade/{self.atividade_id}/relatorio", headers={"Authorization": f"Bearer {token}"})

    def test_outro_professor_nao_ve(self):
        self.assertEqual(self.relatorio(self.token_outro).status_code, 401)

    def test_resumo_usa_primeira_conclusao(self):
        dados = self.relatorio(self.token_dono).json()
        self.assertEqual(dados["resumo"], {
            "alunos_turma": 3,
            "alunos_concluiram": 2,
            "media_acertos_primeira": 1.5,
            "media_tempo_seg": 80.0,
            "media_reinicios": 1.0,
        })
        status = {a["nome"]: (a["status"], a["tentativas"]) for a in dados["alunos"]}
        self.assertEqual(status, {"Ana": ("concluido", 2), "Bia": ("concluido", 2), "Caio": ("nao_iniciado", 0)})

    def test_questoes_mais_erradas_primeiro(self):
        questoes = self.relatorio(self.token_dono).json()["questoes"]
        # q2: ninguém acertou de primeira; q1: só Ana (Bia errou na sessão abandonada)
        self.assertEqual([(q["ordem"], q["respostas"], q["taxa_acerto_primeira"]) for q in questoes], [(2, 2, 0), (1, 2, 50)])


    def relatorio_aluno(self, aluno_id, token):
        return self.client.get(f"/aluno/{aluno_id}/relatorio", headers={"Authorization": f"Bearer {token}"})

    def test_aluno_de_outra_turma_nao_aparece(self):
        self.assertEqual(self.relatorio_aluno(self.ana_id, self.token_outro).status_code, 401)

    def test_historico_do_aluno(self):
        ana = self.relatorio_aluno(self.ana_id, self.token_dono).json()
        self.assertEqual(ana["aluno"]["turmas"], ["3º A"])
        self.assertEqual(ana["resumo"]["taxa_acerto_primeira"], 50)
        atividade = ana["atividades"][0]
        self.assertEqual((atividade["status"], atividade["tentativas"], atividade["acertos_primeira"]), ("concluido", 2, 1))
        self.assertEqual([q["ordem"] for q in atividade["questoes_erradas"]], [2])

        # Bia errou as duas na partida que abandonou — é essa que vale
        bia = self.relatorio_aluno(self.bia_id, self.token_dono).json()
        self.assertEqual([q["ordem"] for q in bia["atividades"][0]["questoes_erradas"]], [1, 2])


    def test_relatorio_da_turma(self):
        url = f"/turma/{self.turma_id}/relatorio"
        self.assertEqual(self.client.get(url, headers={"Authorization": f"Bearer {self.token_outro}"}).status_code, 401)

        dados = self.client.get(url, headers={"Authorization": f"Bearer {self.token_dono}"}).json()
        # 3 alunos x 1 atividade, 2 concluíram; primeiras respostas: Ana 1/2, Bia 0/2
        self.assertEqual(dados["resumo"], {"alunos": 3, "atividades": 1, "taxa_conclusao": 67, "taxa_acerto_primeira": 25})
        self.assertEqual(dados["atividades"][0]["alunos_concluiram"], 2)
        por_nome = {a["nome_completo"]: (a["atividades_concluidas"], a["taxa_acerto_primeira"]) for a in dados["alunos"]}
        self.assertEqual(por_nome, {"Ana": (1, 50), "Bia": (1, 0), "Caio": (0, None)})
        self.assertEqual([(q["ordem"], q["taxa_acerto_primeira"]) for q in dados["questoes_dificeis"]], [(2, 0), (1, 50)])


if __name__ == "__main__":
    unittest.main()
