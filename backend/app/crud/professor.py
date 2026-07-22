from sqlalchemy.orm import Session

from app.models.professor import Professor
from app.models.usuario import TipoUsuario, Usuario
from app.schemas.professor import ProfessorCreate, ProfessorUpdate
from app.security import hash_senha


def get_professor(db: Session, professor_id: int) -> Professor | None:
    return db.get(Professor, professor_id)


def get_professores(db: Session, skip: int = 0, limit: int = 100) -> list[Professor]:
    return db.query(Professor).offset(skip).limit(limit).all()


def create_professor(db: Session, dados: ProfessorCreate) -> Professor:
    usuario = Usuario(
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        tipo=TipoUsuario.professor,
    )
    db.add(usuario)
    db.flush()  # gera o usuario.id sem finalizar a transação ainda

    professor = Professor(
        usuario_id=usuario.id,
        nome_completo=dados.nome_completo,
        apelido=dados.apelido,
        escola=dados.escola,
        avatar_url=dados.avatar_url,
        biografia=dados.biografia,
    )
    db.add(professor)
    db.commit()
    db.refresh(professor)
    return professor


def update_professor(
    db: Session, professor: Professor, dados: ProfessorUpdate
) -> Professor:
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(professor, campo, valor)
    db.commit()
    db.refresh(professor)
    return professor # atualiza as informações do professor


def delete_professor(db: Session, professor: Professor) -> None:
    # apaga o usuario associado; o ON DELETE CASCADE do banco remove o professor junto
    db.delete(professor.usuario)
    db.commit()