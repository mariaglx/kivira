import secrets
import string

from sqlalchemy.orm import Session

from app.models.turma import Turma
from app.schemas.turma import TurmaCreate, TurmaUpdate

CARACTERES_CODIGO = string.ascii_uppercase + string.digits


def gerar_codigo_acesso() -> str:
    return "".join(secrets.choice(CARACTERES_CODIGO) for _ in range(8))


def get_turma(db: Session, turma_id: int) -> Turma | None:
    return db.get(Turma, turma_id)


def get_turmas(db: Session, skip: int = 0, limit: int = 100) -> list[Turma]:
    return db.query(Turma).offset(skip).limit(limit).all()


def create_turma(db: Session, dados: TurmaCreate) -> Turma:
    codigo = gerar_codigo_acesso()
    while db.query(Turma).filter(Turma.codigo_acesso == codigo).first() is not None:
        codigo = gerar_codigo_acesso()  # colisão rara, tenta de novo

    turma = Turma(
        professor_id=dados.professor_id,
        nome=dados.nome,
        ano_escolar=dados.ano_escolar,
        ano_letivo=dados.ano_letivo,
        descricao=dados.descricao,
        codigo_acesso=codigo,
    )
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


def update_turma(db: Session, turma: Turma, dados: TurmaUpdate) -> Turma:
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(turma, campo, valor)
    db.commit()
    db.refresh(turma)
    return turma


def delete_turma(db: Session, turma: Turma) -> None:
    db.delete(turma)
    db.commit()