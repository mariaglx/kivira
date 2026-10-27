# Regras de conquista: o que cada feito exige e o corte por nível.
# Rodar de dentro de backend/: python -m unittest discover tests
import os

os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL_PROD"] = "sqlite://"

import unittest
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.dialects.mysql import YEAR
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
# importados só pra registrar as tabelas que sessao_jogo referencia por FK
from models.usuario import Usuario  # noqa: F401
from models.avatar import Avatar  # noqa: F401
from models.professor import Professor  # noqa: F401
from models.turma import Turma  # noqa: F401
from models.aluno import Aluno  # noqa: F401
from models.atividade import Atividade  # noqa: F401
from models.sessao_jogo import SessaoJogo
from services.conquista_service import conquistas_do_aluno, estatisticas_do_aluno


# turma.ano_letivo é YEAR (só MySQL); no SQLite vira INTEGER
@compiles(YEAR, "sqlite")
def _year_no_sqlite(tipo, compilador, **kw):
    return "INTEGER"


TABELAS = ["usuario", "avatar", "professor", "turma", "aluno", "atividade", "sessao_jogo"]


def desbloqueadas(conquistas):
    return {c["codigo"] for c in conquistas if c["desbloqueada"]}


class TestConquistas(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        Base.metadata.create_all(
            self.engine, tables=[Base.metadata.tables[t] for t in TABELAS]
        )
        self.session = sessionmaker(bind=self.engine)()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def gravar(self, **campos):
        padrao = {
            "aluno_id": 1,
            "atividade_id": 1,
            "status": "concluido",
            # creditar_conclusao sempre zera erradas e põe corretas = nº de
            # questões; "perfeita" se mede por acertos_primeira == corretas
            "respostas_erradas": 0,
            "respostas_corretas": 10,
            "acertos_primeira": 0,
            "tempo_gasto_seg": 0,
            "iniciado_em": datetime(2026, 10, 1, 10, 0),
        }
        padrao.update(campos)
        self.session.add(SessaoJogo(**padrao))
        self.session.commit()

    def test_aluno_zerado_so_tem_iniciante(self):
        conquistas, _ = conquistas_do_aluno(self.session, aluno_id=1, xp_total=0)
        self.assertEqual(desbloqueadas(conquistas), {"iniciante"})

    def test_titulo_por_nivel_acumula(self):
        # 300 XP = nível 3 pela curva de xp_para_nivel
        conquistas, _ = conquistas_do_aluno(self.session, aluno_id=1, xp_total=300)
        self.assertEqual(
            desbloqueadas(conquistas), {"iniciante", "aprendiz", "explorador"}
        )

    def test_replay_nao_conta_como_atividade_nova(self):
        # mesma atividade 12 vezes não pode liberar o "10 atividades"
        for _ in range(12):
            self.gravar(atividade_id=7)
        estatisticas = estatisticas_do_aluno(self.session, aluno_id=1)
        self.assertEqual(estatisticas["atividades_concluidas"], 1)

    def test_atividade_com_erro_nao_conta_como_perfeita(self):
        # acertou 8 das 10 de primeira: terminou, mas não foi perfeita
        self.gravar(atividade_id=1, acertos_primeira=8, respostas_corretas=10)
        conquistas, _ = conquistas_do_aluno(self.session, aluno_id=1, xp_total=0)
        self.assertIn("primeira_partida", desbloqueadas(conquistas))
        self.assertNotIn("sem_errar", desbloqueadas(conquistas))

    def test_tudo_de_primeira_conta_como_perfeita(self):
        self.gravar(atividade_id=1, acertos_primeira=10, respostas_corretas=10)
        conquistas, _ = conquistas_do_aluno(self.session, aluno_id=1, xp_total=0)
        self.assertIn("sem_errar", desbloqueadas(conquistas))

    def test_replay_perfeito_nao_rende_impecavel(self):
        # a mesma atividade jogada 6 vezes com tudo certo continua sendo UMA
        # atividade perfeita; "Impecável" pede 5 atividades diferentes
        for _ in range(6):
            self.gravar(atividade_id=3, acertos_primeira=10, respostas_corretas=10)
        conquistas, estatisticas = conquistas_do_aluno(self.session, aluno_id=1, xp_total=0)
        self.assertEqual(estatisticas["atividades_perfeitas"], 1)
        self.assertNotIn("cinco_perfeitas", desbloqueadas(conquistas))

    def test_acertos_ignoram_replay(self):
        # primeira conclusão com 4 acertos, replays decorados com 10 cada:
        # só os 4 da primeira contam
        self.gravar(atividade_id=5, acertos_primeira=4, respostas_corretas=10)
        for _ in range(3):
            self.gravar(atividade_id=5, acertos_primeira=10, respostas_corretas=10)
        estatisticas = estatisticas_do_aluno(self.session, aluno_id=1)
        self.assertEqual(estatisticas["acertos_primeira"], 4)

    def test_dias_contam_sessao_abandonada(self):
        # presença é ter aberto o Kivira no dia, mesmo desistindo no meio
        for dia in range(1, 6):
            self.gravar(
                atividade_id=dia,
                status="abandonado",
                iniciado_em=datetime(2026, 10, dia, 9, 0),
            )
        conquistas, estatisticas = conquistas_do_aluno(self.session, aluno_id=1, xp_total=0)
        self.assertEqual(estatisticas["dias_jogados"], 5)
        self.assertIn("presenca", desbloqueadas(conquistas))
        # mas abandonada não conta como atividade concluída
        self.assertEqual(estatisticas["atividades_concluidas"], 0)

    def test_sessoes_de_outro_aluno_nao_vazam(self):
        self.gravar(aluno_id=2, atividade_id=1)
        estatisticas = estatisticas_do_aluno(self.session, aluno_id=1)
        self.assertEqual(estatisticas["atividades_concluidas"], 0)

    def test_hora_cheia_soma_as_sessoes(self):
        for i in range(1, 4):
            self.gravar(atividade_id=i, tempo_gasto_seg=1200)  # 3 × 20min = 1h
        conquistas, _ = conquistas_do_aluno(self.session, aluno_id=1, xp_total=0)
        self.assertIn("hora_cheia", desbloqueadas(conquistas))


if __name__ == "__main__":
    unittest.main()
